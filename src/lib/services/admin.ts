import { prisma } from "@/lib/prisma";
import { RegistrationRole, RegistrationStatus, UserRole } from "@prisma/client";
import { getOrganizationScope } from "@/lib/auth/organization-scope";

export async function getBranchesOverview(organizationId?: string) {
  const branches = await prisma.branch.findMany({
    where: organizationId ? { organizationId } : undefined,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          students: { where: { isActive: true } },
          staffProfiles: true,
          users: true,
          classes: true,
        },
      },
      academicYears: {
        where: { isCurrent: true },
        take: 1,
        select: { name: true },
      },
    },
  });

  return branches.map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    city: b.city,
    address: b.address,
    phone: b.phone,
    isActive: b.isActive,
    currentYear: b.academicYears[0]?.name ?? "—",
    students: b._count.students,
    staff: b._count.staffProfiles,
    users: b._count.users,
    classes: b._count.classes,
  }));
}

export async function getAuditLogs(limit = 200, organizationId?: string) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    where: organizationId ? { branch: { organizationId } } : undefined,
    include: {
      branch: { select: { name: true, code: true } },
      actor: { select: { firstName: true, lastName: true, email: true, role: true } },
    },
  });
}

export async function getAdminSummary(user?: { role: UserRole; organizationId?: string | null }) {
  const orgScope = user ? getOrganizationScope(user) : undefined;

  if (user?.role === UserRole.SUPER_ADMIN && !orgScope) {
    return { branches: 0, users: 0, auditCount: 0, pendingRegistrations: 0 };
  }

  const branchFilter = orgScope ? { organizationId: orgScope, isActive: true } : { isActive: true };

  const [branches, users, auditCount, pendingRegistrations] = await Promise.all([
    prisma.branch.count({ where: branchFilter }),
    prisma.user.count({
      where: {
        isActive: true,
        role: { notIn: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN] },
        ...(orgScope ? { organizationId: orgScope } : {}),
      },
    }),
    prisma.auditLog.count(orgScope ? { where: { branch: { organizationId: orgScope } } } : undefined),
    prisma.registrationRequest.count({
      where: {
        status: RegistrationStatus.PENDING,
        role: { in: [RegistrationRole.REGISTRAR, RegistrationRole.HR_MANAGER] },
        ...(orgScope ? { branch: { organizationId: orgScope } } : {}),
      },
    }),
  ]);

  return { branches, users, auditCount, pendingRegistrations };
}
