import { prisma } from "@/lib/prisma";
import { RegistrationRole, RegistrationStatus, UserRole } from "@prisma/client";

export async function getBranchesOverview() {
  const branches = await prisma.branch.findMany({
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

export async function getAuditLogs(limit = 200) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      branch: { select: { name: true, code: true } },
      actor: { select: { firstName: true, lastName: true, email: true, role: true } },
    },
  });
}

export async function getAdminSummary() {
  const [branches, users, auditCount, pendingRegistrations] = await Promise.all([
    prisma.branch.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: true, role: { not: UserRole.SUPER_ADMIN } } }),
    prisma.auditLog.count(),
    prisma.registrationRequest.count({
      where: {
        status: RegistrationStatus.PENDING,
        role: { in: [RegistrationRole.REGISTRAR, RegistrationRole.HR_MANAGER] },
      },
    }),
  ]);

  return { branches, users, auditCount, pendingRegistrations };
}
