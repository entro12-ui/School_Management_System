import {
  AttendanceStatus,
  PaymentStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getConsolidatedStats,
  getGradeBandBreakdown,
} from "@/lib/services/dashboard";
import { getBranchGradeLevelBreakdown } from "@/lib/services/branch-admin";

export type NamedValue = { name: string; value: number };
export type GroupedBarRow = { name: string } & Record<string, number | string>;

export type DashboardChartConfig =
  | { type: "bar"; title: string; description?: string; data: NamedValue[] }
  | { type: "pie"; title: string; description?: string; data: NamedValue[] }
  | {
      type: "grouped-bar";
      title: string;
      description?: string;
      data: GroupedBarRow[];
      series: { key: string; label: string; color: string }[];
    }
  | { type: "line"; title: string; description?: string; data: NamedValue[] };

function bandLabel(band: string) {
  return band.replace(/_/g, " ");
}

export async function getAdminDashboardCharts(): Promise<DashboardChartConfig[]> {
  const [stats, gradeBands] = await Promise.all([
    getConsolidatedStats(),
    getGradeBandBreakdown(),
  ]);

  return [
    {
      type: "bar",
      title: "Enrollment by branch",
      description: "Active KG–12 students",
      data: stats.branches.map((b) => ({ name: b.name, value: b.enrollment })),
    },
    {
      type: "pie",
      title: "Enrollment by grade band",
      data: gradeBands
        .filter((g) => g.count > 0)
        .map((g) => ({ name: bandLabel(g.band), value: g.count })),
    },
    {
      type: "grouped-bar",
      title: "Revenue vs outstanding",
      description: "By branch (ETB)",
      data: stats.branches.map((b) => ({
        name: b.name,
        collected: b.revenue,
        outstanding: b.outstanding,
      })),
      series: [
        { key: "collected", label: "Collected", color: "#10b981" },
        { key: "outstanding", label: "Outstanding", color: "#f59e0b" },
      ],
    },
    {
      type: "bar",
      title: "Attendance today",
      description: "Present rate by branch (%)",
      data: stats.branches.map((b) => ({
        name: b.name,
        value: Math.round(b.attendanceRate),
      })),
    },
  ];
}

export async function getBranchDashboardCharts(
  branchId: string
): Promise<DashboardChartConfig[]> {
  const [gradeLevels, gradeBands, weekAttendance, financial] = await Promise.all([
    getBranchGradeLevelBreakdown(branchId),
    getGradeBandBreakdown(branchId),
    getAttendanceLast7Days(branchId),
    getBranchFinancialSplit(branchId),
  ]);

  return [
    {
      type: "bar",
      title: "Students by grade",
      data: gradeLevels.map((g) => ({ name: g.label, value: g.count })),
    },
    {
      type: "pie",
      title: "Students by grade band",
      data: gradeBands
        .filter((g) => g.count > 0)
        .map((g) => ({ name: bandLabel(g.band), value: g.count })),
    },
    {
      type: "pie",
      title: "Fee collection",
      description: "Collected vs outstanding (ETB)",
      data: financial,
    },
    {
      type: "line",
      title: "Attendance (7 days)",
      description: "Students marked present",
      data: weekAttendance,
    },
  ];
}

export async function getFinanceDashboardCharts(
  branchId?: string
): Promise<DashboardChartConfig[]> {
  const where = branchId ? { branchId } : {};
  const [statusGroups, bandOutstanding] = await Promise.all([
    prisma.payment.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    }),
    getOutstandingByGradeBand(branchId),
  ]);

  const statusLabels: Record<string, string> = {
    PAID: "Paid",
    PENDING: "Pending",
    PARTIAL: "Partial",
    OVERDUE: "Overdue",
  };

  return [
    {
      type: "pie",
      title: "Payments by status",
      data: statusGroups
        .filter((g) => g._count.id > 0)
        .map((g) => ({
          name: statusLabels[g.status] ?? g.status,
          value: g._count.id,
        })),
    },
    {
      type: "bar",
      title: "Outstanding by grade band",
      description: "Balance due (ETB)",
      data: bandOutstanding,
    },
  ];
}

export async function getTeacherDashboardCharts(
  branchId: string
): Promise<DashboardChartConfig[]> {
  const [weekAttendance, dailyMarks] = await Promise.all([
    getAttendanceLast7Days(branchId),
    getDailyAttendanceBreakdown(branchId),
  ]);

  return [
    {
      type: "line",
      title: "Branch attendance (7 days)",
      description: "Students present",
      data: weekAttendance,
    },
    {
      type: "bar",
      title: "Today’s attendance",
      description: "By status",
      data: dailyMarks,
    },
  ];
}

export async function getParentDashboardCharts(
  childrenIds: string[]
): Promise<DashboardChartConfig[]> {
  if (childrenIds.length === 0) return [];

  const [childGrades, attendanceSplit] = await Promise.all([
    getChildrenAverageGrades(childrenIds),
    getChildrenAttendanceSplit(childrenIds),
  ]);

  return [
    {
      type: "bar",
      title: "Average score by child",
      description: "Recent assessments (%)",
      data: childGrades,
    },
    {
      type: "pie",
      title: "Attendance this month",
      data: attendanceSplit,
    },
  ];
}

export async function getStudentDashboardCharts(
  studentId: string
): Promise<DashboardChartConfig[]> {
  const [gradeTrend, feeSplit] = await Promise.all([
    getStudentGradeTrend(studentId),
    getStudentFeeSplit(studentId),
  ]);

  const charts: DashboardChartConfig[] = [];
  if (gradeTrend.length > 0) {
    charts.push({
      type: "line",
      title: "Recent assessment scores",
      description: "Percentage by assessment",
      data: gradeTrend,
    });
  }
  if (feeSplit.length > 0) {
    charts.push({
      type: "pie",
      title: "Semester fees",
      data: feeSplit,
    });
  }
  return charts;
}

export async function getRegistrarDashboardCharts(
  branchId: string
): Promise<DashboardChartConfig[]> {
  const [byRole, monthly] = await Promise.all([
    getUsersByRole(branchId),
    getMonthlyEnrollments(branchId),
  ]);

  return [
    {
      type: "pie",
      title: "Portal users by role",
      data: byRole,
    },
    {
      type: "bar",
      title: "New enrollments (6 months)",
      data: monthly,
    },
  ];
}

export async function getLibraryDashboardCharts(
  branchId: string
): Promise<DashboardChartConfig[]> {
  const [byCategory, issueStatus] = await Promise.all([
    getBooksByCategory(branchId),
    getLibraryIssueStatus(branchId),
  ]);

  return [
    {
      type: "bar",
      title: "Books by category",
      data: byCategory,
    },
    {
      type: "pie",
      title: "Loans",
      description: "Active vs returned",
      data: issueStatus,
    },
  ];
}

async function getAttendanceLast7Days(branchId: string): Promise<NamedValue[]> {
  const days: NamedValue[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const present = await prisma.attendanceRecord.count({
      where: {
        branchId,
        date: { gte: d, lt: next },
        status: AttendanceStatus.PRESENT,
        studentId: { not: null },
      },
    });

    days.push({
      name: d.toLocaleDateString("en-ET", { weekday: "short" }),
      value: present,
    });
  }

  return days;
}

async function getDailyAttendanceBreakdown(branchId: string): Promise<NamedValue[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const groups = await prisma.attendanceRecord.groupBy({
    by: ["status"],
    where: {
      branchId,
      date: { gte: today, lt: tomorrow },
      studentId: { not: null },
    },
    _count: { id: true },
  });

  const labels: Record<string, string> = {
    PRESENT: "Present",
    ABSENT: "Absent",
    LATE: "Late",
    EXCUSED: "Excused",
  };

  return groups.map((g) => ({
    name: labels[g.status] ?? g.status,
    value: g._count.id,
  }));
}

async function getBranchFinancialSplit(branchId: string): Promise<NamedValue[]> {
  const [paid, outstanding] = await Promise.all([
    prisma.payment.aggregate({
      where: { branchId, status: PaymentStatus.PAID },
      _sum: { paidAmount: true },
    }),
    prisma.payment.findMany({
      where: {
        branchId,
        status: {
          in: [
            PaymentStatus.PENDING,
            PaymentStatus.PARTIAL,
            PaymentStatus.OVERDUE,
          ],
        },
      },
      select: { amount: true, paidAmount: true },
    }),
  ]);

  const collected = Number(paid._sum.paidAmount ?? 0);
  const due = outstanding.reduce(
    (sum, p) => sum + Number(p.amount) - Number(p.paidAmount),
    0
  );

  if (collected === 0 && due === 0) {
    return [{ name: "No payments yet", value: 1 }];
  }

  return [
    { name: "Collected", value: collected },
    { name: "Outstanding", value: due },
  ];
}

async function getOutstandingByGradeBand(branchId?: string): Promise<NamedValue[]> {
  const students = await prisma.student.findMany({
    where: { isActive: true, ...(branchId ? { branchId } : {}) },
    select: {
      gradeBand: true,
      payments: {
        where: {
          status: {
            in: [
              PaymentStatus.PENDING,
              PaymentStatus.PARTIAL,
              PaymentStatus.OVERDUE,
            ],
          },
        },
        select: { amount: true, paidAmount: true },
      },
    },
  });

  const byBand = new Map<string, number>();
  for (const s of students) {
    const due = s.payments.reduce(
      (sum, p) => sum + Number(p.amount) - Number(p.paidAmount),
      0
    );
    if (due <= 0) continue;
    byBand.set(s.gradeBand, (byBand.get(s.gradeBand) ?? 0) + due);
  }

  return [...byBand.entries()].map(([band, value]) => ({
    name: bandLabel(band),
    value: Math.round(value),
  }));
}

async function getChildrenAverageGrades(
  childrenIds: string[]
): Promise<NamedValue[]> {
  const children = await prisma.student.findMany({
    where: { id: { in: childrenIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      grades: {
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          score: true,
          assessment: { select: { maxScore: true } },
        },
      },
    },
  });

  return children.map((c) => {
    const records = c.grades.filter((g) => Number(g.assessment.maxScore) > 0);
    const avg =
      records.length > 0
        ? records.reduce(
            (s, g) =>
              s + (Number(g.score) / Number(g.assessment.maxScore)) * 100,
            0
          ) / records.length
        : 0;
    return {
      name: `${c.firstName} ${c.lastName.charAt(0)}.`,
      value: Math.round(avg),
    };
  });
}

async function getChildrenAttendanceSplit(
  childrenIds: string[]
): Promise<NamedValue[]> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const groups = await prisma.attendanceRecord.groupBy({
    by: ["status"],
    where: {
      studentId: { in: childrenIds },
      date: { gte: monthStart },
      status: { in: [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT] },
    },
    _count: { id: true },
  });

  const present = groups.find((g) => g.status === AttendanceStatus.PRESENT)?._count.id ?? 0;
  const absent = groups.find((g) => g.status === AttendanceStatus.ABSENT)?._count.id ?? 0;

  if (present === 0 && absent === 0) {
    return [{ name: "No records", value: 1 }];
  }

  return [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
  ];
}

async function getStudentGradeTrend(studentId: string): Promise<NamedValue[]> {
  const records = await prisma.gradeRecord.findMany({
    where: { studentId },
    include: {
      assessment: { select: { title: true, date: true, maxScore: true } },
    },
    orderBy: { assessment: { date: "asc" } },
    take: 8,
  });

  return records.map((r) => {
    const pct =
      Number(r.assessment.maxScore) > 0
        ? Math.round((Number(r.score) / Number(r.assessment.maxScore)) * 100)
        : 0;
    const title = r.assessment.title;
    const short =
      title.length > 14 ? `${title.slice(0, 12)}…` : title;
    return { name: short, value: pct };
  });
}

async function getStudentFeeSplit(studentId: string): Promise<NamedValue[]> {
  const payments = await prisma.payment.findMany({
    where: { studentId },
    select: { term: true, amount: true, paidAmount: true, status: true },
  });

  if (payments.length === 0) return [];

  const paid = payments
    .filter((p) => p.status === PaymentStatus.PAID)
    .reduce((s, p) => s + Number(p.paidAmount), 0);
  const due = payments.reduce(
    (s, p) => s + Math.max(0, Number(p.amount) - Number(p.paidAmount)),
    0
  );

  if (paid === 0 && due === 0) return [];

  return [
    { name: "Paid", value: paid },
    { name: "Balance due", value: due },
  ];
}

async function getUsersByRole(branchId: string): Promise<NamedValue[]> {
  const roles: UserRole[] = [
    UserRole.STUDENT,
    UserRole.TEACHER,
    UserRole.PARENT,
    UserRole.REGISTRAR,
    UserRole.FINANCE_OFFICER,
    UserRole.LIBRARIAN,
  ];

  const counts = await Promise.all(
    roles.map(async (role) => ({
      role,
      count: await prisma.user.count({
        where: { branchId, role, isActive: true },
      }),
    }))
  );

  const roleLabels: Partial<Record<UserRole, string>> = {
    STUDENT: "Students",
    TEACHER: "Teachers",
    PARENT: "Parents",
    REGISTRAR: "Registrar",
    FINANCE_OFFICER: "Finance",
    LIBRARIAN: "Librarian",
  };

  return counts
    .filter((c) => c.count > 0)
    .map((c) => ({
      name: roleLabels[c.role] ?? c.role,
      value: c.count,
    }));
}

async function getMonthlyEnrollments(branchId: string): Promise<NamedValue[]> {
  const months: NamedValue[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const count = await prisma.user.count({
      where: {
        branchId,
        createdAt: { gte: start, lt: end },
        role: {
          in: [
            UserRole.STUDENT,
            UserRole.TEACHER,
            UserRole.PARENT,
            UserRole.REGISTRAR,
          ],
        },
      },
    });

    months.push({
      name: start.toLocaleDateString("en-ET", { month: "short" }),
      value: count,
    });
  }

  return months;
}

async function getBooksByCategory(branchId: string): Promise<NamedValue[]> {
  const books = await prisma.book.findMany({
    where: { branchId },
    select: { category: true },
  });

  const byCat = new Map<string, number>();
  for (const b of books) {
    const cat = b.category?.trim() || "Uncategorized";
    byCat.set(cat, (byCat.get(cat) ?? 0) + 1);
  }

  if (byCat.size === 0) {
    return [{ name: "No books", value: 0 }];
  }

  return [...byCat.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

async function getLibraryIssueStatus(branchId: string): Promise<NamedValue[]> {
  const [active, returned] = await Promise.all([
    prisma.bookIssue.count({
      where: { branchId, returnedAt: null },
    }),
    prisma.bookIssue.count({
      where: { branchId, returnedAt: { not: null } },
    }),
  ]);

  if (active === 0 && returned === 0) {
    return [{ name: "No loans yet", value: 1 }];
  }

  return [
    { name: "On loan", value: active },
    { name: "Returned", value: returned },
  ];
}
