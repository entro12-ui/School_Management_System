import bcrypt from "bcryptjs";
import { SchoolSignupStatus, UserRole, type Prisma } from "@prisma/client";
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

export type ProvisionSchoolResult = {
  organizationId: string;
  branchId: string;
  userId: string;
  email: string;
  oneTimePassword: string;
};

export async function provisionSchoolFromSignup(
  signupRequestId: string,
  tx?: Prisma.TransactionClient
): Promise<ProvisionSchoolResult> {
  const run = async (db: Prisma.TransactionClient) => {
    const signup = await db.schoolSignupRequest.findUnique({
      where: { id: signupRequestId },
    });

    if (!signup) throw new Error("School signup not found.");
    if (signup.status === SchoolSignupStatus.PROVISIONED && signup.organizationId) {
      throw new Error("This school is already provisioned.");
    }
    if (signup.status === SchoolSignupStatus.REJECTED) {
      throw new Error("This application was rejected.");
    }

    const existingUser = await db.user.findUnique({
      where: { email: signup.contactEmail.toLowerCase() },
    });
    if (existingUser) {
      throw new Error("A user with this contact email already exists.");
    }

    const orgCode = await uniqueOrgCode(db, signup.schoolName);
    const branchCode = await uniqueBranchCode(db, orgCode);
    const oneTimePassword = generateOneTimePassword();
    const passwordHash = await bcrypt.hash(oneTimePassword, 10);
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

    const user = await db.user.create({
      data: {
        email: signup.contactEmail.toLowerCase().trim(),
        passwordHash,
        firstName: signup.contactFirstName.trim(),
        lastName: signup.contactLastName.trim(),
        phone: signup.phone?.trim() || null,
        role: UserRole.SUPER_ADMIN,
        organizationId: organization.id,
        branchId: null,
        mustChangePassword: true,
        pendingOtp: oneTimePassword,
        otpIssuedAt: now,
      },
    });

    await db.schoolSignupRequest.update({
      where: { id: signup.id },
      data: {
        status: SchoolSignupStatus.PROVISIONED,
        organizationId: organization.id,
      },
    });

    return {
      organizationId: organization.id,
      branchId: branch.id,
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
