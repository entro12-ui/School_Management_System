import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ROLE_PREFIX: Partial<Record<UserRole, string>> = {
  TEACHER: "T",
  LIBRARIAN: "L",
  FINANCE_OFFICER: "F",
  REGISTRAR: "R",
  HR_OFFICER: "HR",
  INVENTORY_OFFICER: "IM",
  BRANCH_ADMIN: "BA",
};

export function employeeCodePrefix(portalRole?: UserRole | null): string {
  if (portalRole && ROLE_PREFIX[portalRole]) return ROLE_PREFIX[portalRole]!;
  return "EMP";
}

/** Next code e.g. T-ADDIS-0003 for teachers at Addis branch. */
export async function generateHrEmployeeCode(
  branchId: string,
  portalRole?: UserRole | null
): Promise<string> {
  const branch = await prisma.branch.findUniqueOrThrow({
    where: { id: branchId },
    select: { code: true },
  });

  const prefix = employeeCodePrefix(portalRole);
  const codeRoot = `${prefix}-${branch.code}-`;

  const existing = await prisma.hrEmployee.findMany({
    where: { branchId, employeeCode: { startsWith: codeRoot } },
    select: { employeeCode: true },
  });

  let max = 0;
  for (const row of existing) {
    const tail = row.employeeCode.slice(codeRoot.length);
    const n = parseInt(tail, 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }

  return `${codeRoot}${String(max + 1).padStart(4, "0")}`;
}
