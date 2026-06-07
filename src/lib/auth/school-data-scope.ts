import type { UserRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { getOrganizationScope } from "@/lib/auth/organization-scope";
import { branchBelongsToOrganization } from "@/lib/auth/super-admin-scope";

export type SchoolScopeUser = {
  role: UserRole;
  branchId?: string | null;
  organizationId?: string | null;
};

export type SchoolDataScope = {
  organizationId?: string;
  branchId?: string;
};

/** Resolve which school/branch data the signed-in user may access. */
export function getSchoolDataScope(user: SchoolScopeUser): SchoolDataScope | null {
  if (user.role === "SUPER_ADMIN") {
    const organizationId = getOrganizationScope(user);
    return organizationId ? { organizationId } : null;
  }
  if (user.branchId) return { branchId: user.branchId };
  return null;
}

export async function resolveSchoolDataScope(
  user: SchoolScopeUser,
  searchBranchId?: string | null
): Promise<SchoolDataScope | null> {
  const base = getSchoolDataScope(user);
  if (!base) return null;

  if (base.organizationId && searchBranchId) {
    const allowed = await branchBelongsToOrganization(searchBranchId, base.organizationId);
    if (allowed) {
      return { organizationId: base.organizationId, branchId: searchBranchId };
    }
  }

  return base;
}

function emptyStudentWhere(): Prisma.StudentWhereInput {
  return { id: "__scoped_empty__" };
}

function emptyBranchWhere(): Prisma.BranchWhereInput {
  return { id: "__scoped_empty__" };
}

export function studentScopeWhere(scope: SchoolDataScope | null): Prisma.StudentWhereInput {
  if (!scope) return emptyStudentWhere();
  if (scope.branchId) return { branchId: scope.branchId };
  if (scope.organizationId) return { branch: { organizationId: scope.organizationId } };
  return emptyStudentWhere();
}

export function paymentScopeWhere(scope: SchoolDataScope | null): Prisma.PaymentWhereInput {
  if (!scope) return { id: "__scoped_empty__" };
  if (scope.branchId) return { branchId: scope.branchId };
  if (scope.organizationId) return { branch: { organizationId: scope.organizationId } };
  return { id: "__scoped_empty__" };
}

export function userBranchScopeWhere(scope: SchoolDataScope | null): Prisma.UserWhereInput {
  if (!scope) return { id: "__scoped_empty__" };
  if (scope.branchId) return { branchId: scope.branchId };
  if (scope.organizationId) return { branch: { organizationId: scope.organizationId } };
  return { id: "__scoped_empty__" };
}

export function branchScopeWhere(scope: SchoolDataScope | null): Prisma.BranchWhereInput {
  if (!scope) return emptyBranchWhere();
  if (scope.branchId) return { id: scope.branchId, isActive: true };
  if (scope.organizationId) return { organizationId: scope.organizationId, isActive: true };
  return emptyBranchWhere();
}

export function feeStructureScopeWhere(
  scope: SchoolDataScope | null
): Prisma.FeeStructureWhereInput {
  if (!scope) return { id: "__scoped_empty__" };
  if (scope.branchId) return { branchId: scope.branchId };
  if (scope.organizationId) return { branch: { organizationId: scope.organizationId } };
  return { id: "__scoped_empty__" };
}
