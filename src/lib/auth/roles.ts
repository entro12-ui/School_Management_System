import { UserRole } from "@prisma/client";

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  BRANCH_ADMIN: "Branch Admin",
  REGISTRAR: "Registrar",
  TEACHER: "Teacher",
  FINANCE_OFFICER: "Finance Officer",
  LIBRARIAN: "Librarian",
  HR_OFFICER: "HR Officer",
  PARENT: "Parent",
  STUDENT: "Student",
};

export const ROLE_HOME: Record<UserRole, string> = {
  SUPER_ADMIN: "/admin",
  BRANCH_ADMIN: "/branch",
  REGISTRAR: "/registrar",
  TEACHER: "/teacher",
  FINANCE_OFFICER: "/finance",
  LIBRARIAN: "/library",
  HR_OFFICER: "/hr",
  PARENT: "/parent",
  STUDENT: "/student",
};

export const STAFF_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.REGISTRAR,
  UserRole.TEACHER,
  UserRole.FINANCE_OFFICER,
  UserRole.LIBRARIAN,
  UserRole.HR_OFFICER,
];

export function canAccessBranch(
  role: UserRole,
  userBranchId: string | null | undefined,
  targetBranchId: string | null | undefined
): boolean {
  if (role === UserRole.SUPER_ADMIN) return true;
  if (!targetBranchId) return true;
  return userBranchId === targetBranchId;
}

export function isLeadershipRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.BRANCH_ADMIN;
}
