import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrganizationScope } from "@/lib/auth/organization-scope";

export type BranchScopeUser = {
  role: UserRole;
  branchId?: string | null;
  organizationId?: string | null;
};

export type OrganizationPageBranch = {
  branchId: string | undefined;
  branches: { id: string; name: string; code: string }[];
  branch: { id: string; name: string; code: string } | null;
  isSuperAdmin: boolean;
  organizationMissing: boolean;
};

export function superAdminOrganizationId(user: BranchScopeUser): string | undefined {
  if (user.role !== "SUPER_ADMIN") return undefined;
  return getOrganizationScope(user);
}

export async function branchBelongsToOrganization(
  branchId: string,
  organizationId: string
): Promise<boolean> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, organizationId },
    select: { id: true },
  });
  return Boolean(branch);
}

export async function assertSuperAdminCanAccessBranch(
  user: BranchScopeUser,
  branchId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (user.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Unauthorized." };
  }

  const organizationId = superAdminOrganizationId(user);
  if (!organizationId) {
    return { ok: false, error: "Your account is not linked to a school organization." };
  }

  const allowed = await branchBelongsToOrganization(branchId, organizationId);
  if (!allowed) {
    return { ok: false, error: "You can only manage branches in your school." };
  }

  return { ok: true };
}

/** Branch staff: own branch only. Super admin: branches in their organization. */
export async function assertUserCanAccessBranch(
  user: BranchScopeUser,
  branchId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (user.role === "SUPER_ADMIN") {
    return assertSuperAdminCanAccessBranch(user, branchId);
  }
  if (user.branchId === branchId) {
    return { ok: true };
  }
  return { ok: false, error: "You cannot access data for another branch." };
}

/** Super admin: branches in their org only. Other roles: their assigned branch. */
export async function resolveOrganizationPageBranch(
  user: BranchScopeUser,
  searchBranchId?: string
): Promise<OrganizationPageBranch> {
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  if (isSuperAdmin) {
    const organizationId = superAdminOrganizationId(user);
    if (!organizationId) {
      return {
        branchId: undefined,
        branches: [],
        branch: null,
        isSuperAdmin: true,
        organizationMissing: true,
      };
    }

    const branchWhere = { isActive: true, organizationId };
    let branchId = searchBranchId;

    if (branchId && !(await branchBelongsToOrganization(branchId, organizationId))) {
      branchId = undefined;
    }

    if (!branchId) {
      const first = await prisma.branch.findFirst({
        where: branchWhere,
        orderBy: { name: "asc" },
        select: { id: true },
      });
      branchId = first?.id;
    }

    const branches = await prisma.branch.findMany({
      where: branchWhere,
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    });

    const branch = branchId
      ? await prisma.branch.findUnique({
          where: { id: branchId },
          select: { id: true, name: true, code: true },
        })
      : null;

    return {
      branchId,
      branches,
      branch,
      isSuperAdmin: true,
      organizationMissing: false,
    };
  }

  const branchId = user.branchId ?? undefined;
  const branch = branchId
    ? await prisma.branch.findUnique({
        where: { id: branchId },
        select: { id: true, name: true, code: true },
      })
    : null;

  return {
    branchId,
    branches: [],
    branch,
    isSuperAdmin: false,
    organizationMissing: false,
  };
}
