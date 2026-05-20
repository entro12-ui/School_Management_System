import { RegistrationRole, RegistrationStatus } from "@prisma/client";
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

export async function getAllPendingRegistrations() {
  return prisma.registrationRequest.findMany({
    where: {
      status: RegistrationStatus.PENDING,
      role: { in: PENDING_APPROVAL_ROLES },
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

export async function getPublicBranches() {
  return prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true, code: true },
    orderBy: { name: "asc" },
  });
}

export async function getRegistrationStatusByEmail(email: string) {
  const normalized = email.toLowerCase().trim();
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
