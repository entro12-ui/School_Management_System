import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getBranchesOverview } from "@/lib/services/admin";

export type OrganizationBranch = {
  id: string;
  code: string;
  name: string;
  city: string;
  students: number;
  staff: number;
  classes: number;
  users: number;
  isActive: boolean;
  roleCounts: Partial<Record<UserRole, number>>;
};

export async function getOrganizationHierarchy(organizationId?: string) {
  const [branches, roleGroups, centralAdmins] = await Promise.all([
    getBranchesOverview(organizationId),
    prisma.user.groupBy({
      by: ["branchId", "role"],
      where: {
        isActive: true,
        branchId: { not: null },
        role: { not: UserRole.SUPER_ADMIN },
        ...(organizationId ? { branch: { organizationId } } : {}),
      },
      _count: { _all: true },
    }),
    prisma.user.count({
      where: {
        isActive: true,
        role: UserRole.SUPER_ADMIN,
        ...(organizationId ? { organizationId } : {}),
      },
    }),
  ]);

  const roleCountsByBranch = new Map<string, Partial<Record<UserRole, number>>>();
  for (const row of roleGroups) {
    if (!row.branchId) continue;
    const existing = roleCountsByBranch.get(row.branchId) ?? {};
    existing[row.role] = row._count._all;
    roleCountsByBranch.set(row.branchId, existing);
  }

  const branchNodes: OrganizationBranch[] = branches.map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    city: b.city,
    students: b.students,
    staff: b.staff,
    classes: b.classes,
    users: b.users,
    isActive: b.isActive,
    roleCounts: roleCountsByBranch.get(b.id) ?? {},
  }));

  const totals = {
    branches: branchNodes.filter((b) => b.isActive).length,
    students: branchNodes.reduce((s, b) => s + b.students, 0),
    staff: branchNodes.reduce((s, b) => s + b.staff, 0),
    classes: branchNodes.reduce((s, b) => s + b.classes, 0),
    users: branchNodes.reduce((s, b) => s + b.users, 0),
  };

  return {
    branches: branchNodes,
    centralAdmins,
    totals,
  };
}
