import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Teaching titles shown when portal role is Teacher. */
export const ACADEMIC_DESIGNATION_TITLES = [
  "Homeroom Teacher",
  "Primary Teacher",
  "English Teacher",
  "Mathematics Teacher",
  "Science Teacher",
  "Social Studies Teacher",
  "ICT Teacher",
  "Physical Education Teacher",
  "Art Teacher",
  "Music Teacher",
  "Amharic Teacher",
] as const;

/** Non-teaching staff titles keyed by portal role. */
export const STAFF_DESIGNATION_BY_ROLE: Record<
  Exclude<
    UserRole,
    | "SUPER_ADMIN"
    | "PLATFORM_ADMIN"
    | "PARENT"
    | "STUDENT"
    | "TEACHER"
  >,
  string
> = {
  BRANCH_ADMIN: "Branch Administrator",
  REGISTRAR: "Registrar",
  LIBRARIAN: "Librarian",
  FINANCE_OFFICER: "Finance Officer",
  HR_OFFICER: "HR Officer",
};

export const DEPARTMENT_FOR_PORTAL_ROLE: Partial<Record<UserRole, string>> = {
  TEACHER: "Academic",
  REGISTRAR: "Administration",
  LIBRARIAN: "Administration",
  FINANCE_OFFICER: "Administration",
  HR_OFFICER: "Administration",
  BRANCH_ADMIN: "Administration",
};

export function designationTitlesForPortalRole(
  portalRole: UserRole | null | undefined
): string[] {
  if (portalRole === UserRole.TEACHER) {
    return [...ACADEMIC_DESIGNATION_TITLES];
  }
  if (portalRole && portalRole in STAFF_DESIGNATION_BY_ROLE) {
    return [STAFF_DESIGNATION_BY_ROLE[portalRole as keyof typeof STAFF_DESIGNATION_BY_ROLE]];
  }
  return [
    ...Object.values(STAFF_DESIGNATION_BY_ROLE),
    "School Administrator",
    "Office Assistant",
  ];
}

export async function ensureStaffDesignationsForBranch(branchId: string) {
  const titles = new Set<string>([
    ...ACADEMIC_DESIGNATION_TITLES,
    ...Object.values(STAFF_DESIGNATION_BY_ROLE),
    "School Administrator",
    "Office Assistant",
    "HR Manager",
  ]);

  for (const title of titles) {
    await prisma.hrDesignation.upsert({
      where: { branchId_title: { branchId, title } },
      create: { branchId, title },
      update: {},
    });
  }
}

export async function resolveDesignationId(
  branchId: string,
  title: string
): Promise<string | null> {
  if (!title.trim()) return null;
  const row = await prisma.hrDesignation.upsert({
    where: { branchId_title: { branchId, title: title.trim() } },
    create: { branchId, title: title.trim() },
    update: {},
  });
  return row.id;
}

export async function resolveDepartmentIdForRole(
  branchId: string,
  portalRole: UserRole | null | undefined
): Promise<string | null> {
  const deptName = portalRole ? DEPARTMENT_FOR_PORTAL_ROLE[portalRole] : null;
  if (!deptName) return null;

  const dept = await prisma.hrDepartment.upsert({
    where: { branchId_name: { branchId, name: deptName } },
    create: {
      branchId,
      name: deptName,
      description:
        deptName === "Academic"
          ? "Teaching staff"
          : "School office and operations",
    },
    update: {},
  });
  return dept.id;
}
