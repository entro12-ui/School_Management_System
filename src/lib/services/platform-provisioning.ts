import bcrypt from "bcryptjs";
import {
  PlatformPaymentStatus,
  SchoolSignupStatus,
  UserRole,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateOneTimePassword } from "@/lib/otp";

function slugifyCode(input: string): string {
  const base = input
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 12);
  return base || "SCHOOL";
}

async function uniqueOrgCode(
  tx: Prisma.TransactionClient,
  schoolName: string
): Promise<string> {
  const base = slugifyCode(schoolName);
  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const existing = await tx.organization.findUnique({ where: { code: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique organization code.");
}

async function uniqueBranchCode(
  tx: Prisma.TransactionClient,
  orgCode: string
): Promise<string> {
  const base = `${orgCode}-MAIN`.slice(0, 20);
  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`.slice(0, 24);
    const existing = await tx.branch.findUnique({ where: { code: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique branch code.");
}

export type ProvisionOrganizationResult = {
  organizationId: string;
  branchId: string;
  signupRequestId: string;
};

export type CompleteSuperAdminAccountResult = {
  userId: string;
  email: string;
  organizationId: string;
};

/** After successful payment: create org + branch, mark signup PAID (no user yet). */
export async function provisionOrganizationFromPayment(
  signupRequestId: string,
  tx?: Prisma.TransactionClient
): Promise<ProvisionOrganizationResult> {
  const run = async (db: Prisma.TransactionClient) => {
    const signup = await db.schoolSignupRequest.findUnique({
      where: { id: signupRequestId },
      include: { superAdminUser: true },
    });

    if (!signup) throw new Error("School signup not found.");
    if (signup.status === SchoolSignupStatus.REJECTED) {
      throw new Error("This application was rejected.");
    }
    if (signup.status === SchoolSignupStatus.PROVISIONED && signup.organizationId) {
      throw new Error("This school is already provisioned.");
    }
    if (signup.status === SchoolSignupStatus.PAID && signup.organizationId) {
      return {
        organizationId: signup.organizationId,
        branchId: (
          await db.branch.findFirstOrThrow({
            where: { organizationId: signup.organizationId },
            orderBy: { createdAt: "asc" },
          })
        ).id,
        signupRequestId: signup.id,
      };
    }

    if (signup.superAdminUser) {
      throw new Error(
        "This application already has a super admin account. Complete payment provisioning instead."
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email: signup.contactEmail.toLowerCase() },
    });
    if (existingUser) {
      throw new Error("A user with this contact email already exists.");
    }

    const orgCode = await uniqueOrgCode(db, signup.schoolName);
    const branchCode = await uniqueBranchCode(db, orgCode);
    const now = new Date();

    const organization = await db.organization.create({
      data: {
        name: signup.schoolName.trim(),
        code: orgCode,
        city: signup.city.trim(),
        address: signup.address?.trim() || null,
        phone: signup.phone?.trim() || null,
        contactEmail: signup.contactEmail.toLowerCase().trim(),
        studentLimit: signup.estimatedStudents,
        isActive: true,
        activatedAt: now,
      },
    });

    const branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        code: branchCode,
        name: `${signup.schoolName.trim()} — Main Campus`,
        city: signup.city.trim(),
        address: signup.address?.trim() || null,
        phone: signup.phone?.trim() || null,
        isActive: true,
      },
    });

    await db.schoolSignupRequest.update({
      where: { id: signup.id },
      data: {
        status: SchoolSignupStatus.PAID,
        organizationId: organization.id,
      },
    });

    return {
      organizationId: organization.id,
      branchId: branch.id,
      signupRequestId: signup.id,
    };
  };

  if (tx) return run(tx);
  return prisma.$transaction(run, { maxWait: 10_000, timeout: 30_000 });
}

/** Public: create super admin account after payment (signup must be PAID). */
export async function completeSchoolSuperAdminAccount(input: {
  signupRequestId: string;
  password: string;
}): Promise<CompleteSuperAdminAccountResult> {
  return prisma.$transaction(async (db) => {
    const signup = await db.schoolSignupRequest.findUnique({
      where: { id: input.signupRequestId },
      include: {
        organization: true,
        platformPayments: {
          where: { status: PlatformPaymentStatus.SUCCESS },
          take: 1,
        },
      },
    });

    if (!signup) throw new Error("Application not found.");
    if (signup.status === SchoolSignupStatus.PROVISIONED && signup.superAdminUserId) {
      throw new Error("Super admin account already exists for this school.");
    }
    if (signup.status !== SchoolSignupStatus.PAID || !signup.organizationId) {
      throw new Error("Complete payment before creating your super admin account.");
    }
    if (signup.platformPayments.length === 0) {
      throw new Error("No successful payment found for this application.");
    }
    if (signup.superAdminUserId) {
      throw new Error("Super admin account already exists.");
    }

    const existingUser = await db.user.findUnique({
      where: { email: signup.contactEmail.toLowerCase() },
    });
    if (existingUser) {
      throw new Error("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await db.user.create({
      data: {
        email: signup.contactEmail.toLowerCase().trim(),
        passwordHash,
        firstName: signup.contactFirstName.trim(),
        lastName: signup.contactLastName.trim(),
        phone: signup.phone?.trim() || null,
        role: UserRole.SUPER_ADMIN,
        organizationId: signup.organizationId,
        branchId: null,
        isActive: true,
        mustChangePassword: false,
      },
    });

    await db.schoolSignupRequest.update({
      where: { id: signup.id },
      data: {
        status: SchoolSignupStatus.PROVISIONED,
        superAdminUserId: user.id,
      },
    });

    return {
      userId: user.id,
      email: user.email,
      organizationId: signup.organizationId,
    };
  }, { maxWait: 10_000, timeout: 30_000 });
}

/** Legacy: full provision with OTP when no self-service account page was used. */
export type ProvisionSchoolResult = {
  organizationId: string;
  branchId: string;
  userId: string;
  email: string;
  oneTimePassword?: string;
};

export async function provisionSchoolFromSignup(
  signupRequestId: string,
  tx?: Prisma.TransactionClient
): Promise<ProvisionSchoolResult> {
  const run = async (db: Prisma.TransactionClient) => {
    const signup = await db.schoolSignupRequest.findUnique({
      where: { id: signupRequestId },
      include: { superAdminUser: true },
    });

    if (!signup) throw new Error("School signup not found.");
    if (signup.status === SchoolSignupStatus.PROVISIONED && signup.organizationId) {
      throw new Error("This school is already provisioned.");
    }
    if (signup.status === SchoolSignupStatus.REJECTED) {
      throw new Error("This application was rejected.");
    }

    const orgResult = await provisionOrganizationFromPayment(signupRequestId, db);
    const oneTimePassword = generateOneTimePassword();
    const passwordHash = await bcrypt.hash(oneTimePassword, 10);
    const now = new Date();

    const user = await db.user.create({
      data: {
        email: signup.contactEmail.toLowerCase().trim(),
        passwordHash,
        firstName: signup.contactFirstName.trim(),
        lastName: signup.contactLastName.trim(),
        phone: signup.phone?.trim() || null,
        role: UserRole.SUPER_ADMIN,
        organizationId: orgResult.organizationId,
        branchId: null,
        mustChangePassword: true,
        pendingOtp: oneTimePassword,
        otpIssuedAt: now,
        isActive: true,
      },
    });

    await db.schoolSignupRequest.update({
      where: { id: signup.id },
      data: {
        status: SchoolSignupStatus.PROVISIONED,
        superAdminUserId: user.id,
      },
    });

    return {
      organizationId: orgResult.organizationId,
      branchId: orgResult.branchId,
      userId: user.id,
      email: user.email,
      oneTimePassword,
    };
  };

  if (tx) return run(tx);
  return prisma.$transaction(run, { maxWait: 10_000, timeout: 30_000 });
}

export async function createOrganizationBranch(input: {
  organizationId: string;
  name: string;
  code: string;
  city: string;
  address?: string;
  phone?: string;
}) {
  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (!code) throw new Error("Branch code is required.");

  const existing = await prisma.branch.findUnique({ where: { code } });
  if (existing) throw new Error("This branch code is already in use.");

  return prisma.branch.create({
    data: {
      organizationId: input.organizationId,
      code,
      name: input.name.trim(),
      city: input.city.trim(),
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
      isActive: true,
    },
  });
}

export async function getSchoolSignupAccountContext(signupRequestId: string) {
  const signup = await prisma.schoolSignupRequest.findUnique({
    where: { id: signupRequestId },
    include: {
      organization: true,
      platformPayments: {
        where: { status: PlatformPaymentStatus.SUCCESS },
        orderBy: { paidAt: "desc" },
        take: 1,
      },
    },
  });

  if (!signup) return null;

  return {
    id: signup.id,
    schoolName: signup.schoolName,
    contactEmail: signup.contactEmail,
    contactFirstName: signup.contactFirstName,
    contactLastName: signup.contactLastName,
    status: signup.status,
    hasPaid: signup.platformPayments.length > 0,
    hasAccount: Boolean(signup.superAdminUserId),
  };
}
