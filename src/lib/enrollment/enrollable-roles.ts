import { UserRole } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/auth/roles";

/** Roles that may never be created from the enrollment desk. */
const BLOCKED: UserRole[] = [UserRole.SUPER_ADMIN];

const BASE: UserRole[] = [
  UserRole.STUDENT,
  UserRole.TEACHER,
  UserRole.FINANCE_OFFICER,
  UserRole.LIBRARIAN,
  UserRole.PARENT,
];

const BRANCH_LEADERSHIP: UserRole[] = [
  UserRole.REGISTRAR,
  UserRole.HR_OFFICER,
];

/** Display labels on the enroll form (HR Manager vs generic HR Officer). */
export const ENROLL_ROLE_LABELS: Record<UserRole, string> = {
  ...ROLE_LABELS,
  HR_OFFICER: "HR Manager",
};

export function getEnrollableRolesFor(actorRole: UserRole): UserRole[] {
  let roles: UserRole[];

  switch (actorRole) {
    case UserRole.SUPER_ADMIN:
      roles = [...BASE, ...BRANCH_LEADERSHIP, UserRole.BRANCH_ADMIN];
      break;
    case UserRole.BRANCH_ADMIN:
      roles = [...BASE, ...BRANCH_LEADERSHIP];
      break;
    case UserRole.REGISTRAR:
      roles = [...BASE];
      break;
    default:
      roles = [];
  }

  return roles.filter((r) => !BLOCKED.includes(r));
}

export function canActorEnrollRole(
  actorRole: UserRole,
  targetRole: UserRole
): boolean {
  return getEnrollableRolesFor(actorRole).includes(targetRole);
}

export function enrollRoleLabel(role: UserRole): string {
  return ENROLL_ROLE_LABELS[role] ?? ROLE_LABELS[role];
}

/** Staff roles that use department / subject fields on the enroll form. */
export const ENROLL_STAFF_WITH_PROFILE: ReadonlySet<UserRole> = new Set([
  UserRole.TEACHER,
  UserRole.FINANCE_OFFICER,
  UserRole.LIBRARIAN,
]);

/** Roles that may upload a profile photo on enrollment. */
export const ENROLL_PHOTO_ROLES: ReadonlySet<UserRole> = new Set([
  UserRole.STUDENT,
  UserRole.TEACHER,
  UserRole.FINANCE_OFFICER,
  UserRole.LIBRARIAN,
  UserRole.REGISTRAR,
  UserRole.HR_OFFICER,
  UserRole.BRANCH_ADMIN,
]);
