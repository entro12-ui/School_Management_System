/** Convert Prisma Decimal fields for Client Component props. */
export function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

export function serializeHrSalaries<
  T extends {
    baseSalary: unknown;
    allowances: unknown;
    taxPercentage: unknown;
    pensionPercentage: unknown;
  },
>(rows: T[]) {
  return rows.map((r) => ({
    ...r,
    baseSalary: toNumber(r.baseSalary) ?? 0,
    allowances: toNumber(r.allowances) ?? 0,
    taxPercentage: toNumber(r.taxPercentage) ?? 0,
    pensionPercentage: toNumber(r.pensionPercentage) ?? 0,
  }));
}

export function serializeHrPayrollRecords<
  T extends { grossSalary: unknown; deductions: unknown; netSalary: unknown },
>(rows: T[]) {
  return rows.map((r) => ({
    ...r,
    grossSalary: toNumber(r.grossSalary) ?? 0,
    deductions: toNumber(r.deductions) ?? 0,
    netSalary: toNumber(r.netSalary) ?? 0,
  }));
}

export function serializeHrTrainings<
  T extends {
    id: string;
    title: string;
    description: string | null;
    startDate: Date | null;
    endDate: Date | null;
    _count: { enrollments: number };
    enrollments: Array<{
      status: string;
      completionPercentage?: unknown;
      employee: { firstName: string; lastName: string };
    }>;
  },
>(rows: T[]) {
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    startDate: t.startDate,
    endDate: t.endDate,
    _count: t._count,
    enrollments: t.enrollments.map((e) => ({
      status: e.status,
      employee: e.employee,
      completionPercentage: toNumber(e.completionPercentage) ?? 0,
    })),
  }));
}

export function serializeHrCandidates<
  T extends { aiScore?: unknown } & Record<string, unknown>,
>(rows: T[]) {
  return rows.map((c) => ({
    ...c,
    aiScore: c.aiScore != null ? toNumber(c.aiScore) : null,
  }));
}

export function serializeHrPerformanceReviews<
  T extends { kpiScore?: unknown } & Record<string, unknown>,
>(rows: T[]) {
  return rows.map((r) => ({
    ...r,
    kpiScore: r.kpiScore != null ? toNumber(r.kpiScore) : null,
  }));
}
