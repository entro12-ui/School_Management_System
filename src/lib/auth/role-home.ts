/** Portal home paths by role — edge-safe (no Prisma import). */
export const ROLE_HOME: Record<string, string> = {
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
