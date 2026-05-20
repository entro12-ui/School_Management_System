import { UserRole } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/auth/roles";

/** Portal roles HR can assign when registering staff with login. */
export const HR_ASSIGNABLE_PORTAL_ROLES: UserRole[] = [
  UserRole.TEACHER,
  UserRole.REGISTRAR,
  UserRole.LIBRARIAN,
  UserRole.FINANCE_OFFICER,
  UserRole.HR_OFFICER,
  UserRole.BRANCH_ADMIN,
];

/** Roles HR can assign instantly when adding an employee (not HR Manager — apply online). */
export const HR_EMPLOYEE_DIRECT_PORTAL_ROLES: UserRole[] =
  HR_ASSIGNABLE_PORTAL_ROLES.filter(
    (r) => r !== UserRole.HR_OFFICER && r !== UserRole.BRANCH_ADMIN
  );

export function portalRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}
