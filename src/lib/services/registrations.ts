import { RegistrationRole, RegistrationStatus, UserRole } from "@prisma/client";
import { getOrganizationScope } from "@/lib/auth/organization-scope";
import { prisma } from "@/lib/prisma";

const PENDING_APPROVAL_ROLES: RegistrationRole[] = ["REGISTRAR", "HR_MANAGER"];

export async function getPendingRegistrations(branchId: string) {
  return prisma.registrationRequest.findMany({
    where: {
      branchId,
      status: RegistrationStatus.PENDING,
      role: { in: PENDING_APPROVAL_ROLES },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAllPendingRegistrations(organizationId?: string) {
  return prisma.registrationRequest.findMany({
    where: {
      status: RegistrationStatus.PENDING,
      role: { in: PENDING_APPROVAL_ROLES },
      ...(organizationId ? { branch: { organizationId } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { branch: { select: { name: true, city: true } } },
  });
}

export async function getRegistrationCounts(branchId: string) {
  const roleFilter = { role: { in: PENDING_APPROVAL_ROLES } };
  const [pending, approved, rejected] = await Promise.all([
    prisma.registrationRequest.count({
      where: {
        branchId,
        status: RegistrationStatus.PENDING,
        ...roleFilter,
      },
    }),
    prisma.registrationRequest.count({
      where: {
        branchId,
        status: RegistrationStatus.APPROVED,
        ...roleFilter,
      },
    }),
    prisma.registrationRequest.count({
      where: {
        branchId,
        status: RegistrationStatus.REJECTED,
        ...roleFilter,
      },
    }),
  ]);
  return { pending, approved, rejected };
}

export async function getGlobalPendingStaffApplicationCount() {
  return prisma.registrationRequest.count({
    where: {
      status: RegistrationStatus.PENDING,
      role: { in: PENDING_APPROVAL_ROLES },
    },
  });
}

export async function getPublicBranches(organizationId?: string) {
  return prisma.branch.findMany({
    where: {
      isActive: true,
      ...(organizationId ? { organizationId } : {}),
    },
    select: { id: true, name: true, city: true, code: true },
    orderBy: { name: "asc" },
  });
}

export async function getBranchesForUser(user?: {
  role: UserRole;
  organizationId?: string | null;
  branchId?: string | null;
}) {
  if (user?.role === UserRole.SUPER_ADMIN) {
    const orgScope = getOrganizationScope(user);
    return getPublicBranches(orgScope);
  }
  if (user?.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: user.branchId, isActive: true },
      select: { id: true, name: true, city: true, code: true },
    });
    return branch ? [branch] : [];
  }
  return [];
}

export async function getRegistrationStatusByEmail(email: string) {
  const normalized = email.toLowerCase().trim();

  const schoolSignup = await prisma.schoolSignupRequest.findFirst({
    where: { contactEmail: normalized },
    orderBy: { createdAt: "desc" },
  });
  if (schoolSignup) {
    if (schoolSignup.status === "PENDING") {
      return {
        status: "pending" as const,
        role: "SCHOOL_SUPER_ADMIN" as const,
        schoolName: schoolSignup.schoolName,
      };
    }
    if (schoolSignup.status === "APPROVED") {
      return {
        status: "pending_payment" as const,
        role: "SCHOOL_SUPER_ADMIN" as const,
        schoolName: schoolSignup.schoolName,
        paymentUrl: `/register/school/pay/${schoolSignup.id}`,
      };
    }
    if (schoolSignup.status === "PAID") {
      return {
        status: "pending_account" as const,
        role: "SCHOOL_SUPER_ADMIN" as const,
        schoolName: schoolSignup.schoolName,
        accountUrl: `/register/school/account/${schoolSignup.id}`,
      };
    }
    if (schoolSignup.status === "REJECTED") {
      return {
        status: "rejected" as const,
        role: "SCHOOL_SUPER_ADMIN" as const,
        reason: schoolSignup.rejectionReason,
      };
    }
  }

  const pending = await prisma.registrationRequest.findFirst({
    where: { email: normalized, status: RegistrationStatus.PENDING },
    include: { branch: { select: { name: true } } },
  });
  if (pending) {
    return {
      status: "pending" as const,
      role: pending.role,
      branchName: pending.branch.name,
    };
  }

  const rejected = await prisma.registrationRequest.findFirst({
    where: { email: normalized, status: RegistrationStatus.REJECTED },
    orderBy: { reviewedAt: "desc" },
  });
  if (rejected) {
    return {
      status: "rejected" as const,
      reason: rejected.rejectionReason,
    };
  }

  return { status: "none" as const };
}
