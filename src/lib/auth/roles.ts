import { UserRole } from "@prisma/client";
import { ROLE_HOME as ROLE_HOME_PATHS } from "@/lib/auth/role-home";

export const ROLE_LABELS: Record<UserRole, string> = {
  PLATFORM_ADMIN: "Platform Admin",
  SUPER_ADMIN: "Super Admin",
  BRANCH_ADMIN: "Branch Admin",
  REGISTRAR: "Registrar",
  TEACHER: "Teacher",
  FINANCE_OFFICER: "Finance Officer",
  LIBRARIAN: "Librarian",
  HR_OFFICER: "HR Officer",
  INVENTORY_OFFICER: "Store Manager",
  PARENT: "Parent",
  STUDENT: "Student",
};

export const ROLE_HOME = ROLE_HOME_PATHS as Record<UserRole, string>;

export const STAFF_ROLES: UserRole[] = [
  UserRole.PLATFORM_ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.REGISTRAR,
  UserRole.TEACHER,
  UserRole.FINANCE_OFFICER,
  UserRole.LIBRARIAN,
  UserRole.HR_OFFICER,
  UserRole.INVENTORY_OFFICER,
];

export function canAccessBranch(
  role: UserRole,
  userBranchId: string | null | undefined,
  targetBranchId: string | null | undefined,
  options?: {
    userOrganizationId?: string | null;
    targetOrganizationId?: string | null;
  }
): boolean {
  if (role === UserRole.PLATFORM_ADMIN) return true;
  if (role === UserRole.SUPER_ADMIN) {
    if (!options?.userOrganizationId) return false;
    if (!targetBranchId) return true;
    return options.userOrganizationId === options.targetOrganizationId;
  }
  if (!targetBranchId) return true;
  return userBranchId === targetBranchId;
}

export function isLeadershipRole(role: UserRole): boolean {
  return (
    role === UserRole.PLATFORM_ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.BRANCH_ADMIN
  );
}
