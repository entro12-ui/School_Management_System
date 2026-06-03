import {
  AttendanceStatus,
  PaymentProofStatus,
  PaymentStatus,
  RegistrationStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminMonthlyReportBranchOption = {
  id: string;
  name: string;
};

export type AdminMonthlyReportBranchRow = {
  branchId: string;
  branchName: string;
  city: string;
  enrollment: number;
  newEnrollments: number;
  attendanceRate: number;
  averageScore: number | null;
  collectedRevenue: number;
  outstandingFees: number;
  atRiskStudents: number;
};

export type AdminMonthlyReport = {
  month: number;
  year: number;
  branchId: string | null;
  monthLabel: string;
  generatedAt: string;
  executiveSummary: string;
  ownerBrief: string[];
  recommendations: string[];
  metrics: {
    totalEnrollment: number;
    newEnrollments: number;
    inactiveStudents: number;
    averageAttendanceRate: number;
    averageScore: number | null;
    atRiskStudents: number;
    dropoutWarnings: number;
    collectedRevenue: number;
    outstandingFees: number;
    pendingPaymentProofs: number;
    activeStaff: number;
    libraryIssues: number;
    overdueLibraryIssues: number;
    pendingRegistrations: number;
    auditEvents: number;
  };
  branches: AdminMonthlyReportBranchRow[];
};

type ReportInput = {
  month: number;
  year: number;
  branchId?: string | null;
};

const REPORT_STAFF_ROLES: UserRole[] = [
  UserRole.BRANCH_ADMIN,
  UserRole.REGISTRAR,
  UserRole.TEACHER,
  UserRole.FINANCE_OFFICER,
  UserRole.LIBRARIAN,
  UserRole.HR_OFFICER,
];

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function attendanceRate(records: { status: AttendanceStatus }[]) {
  if (records.length === 0) return 0;
  const present = records.filter(
    (record) =>
      record.status === AttendanceStatus.PRESENT ||
      record.status === AttendanceStatus.LATE ||
      record.status === AttendanceStatus.EXCUSED
  ).length;
  return Math.round((present / records.length) * 100);
}

function percentFromGrade(grade: { score: number; assessment: { maxScore: number } }) {
  return grade.assessment.maxScore > 0
    ? Math.round((grade.score / grade.assessment.maxScore) * 100)
    : 0;
}

function getRiskCounts(students: Array<{
  grades: Array<{ score: number; assessment: { maxScore: number; date: Date } }>;
  attendance: Array<{ status: AttendanceStatus }>;
}>) {
  let atRisk = 0;
  let dropout = 0;

  for (const student of students) {
    const percents = student.grades.map(percentFromGrade);
    const avg = average(percents);
    const midpoint = Math.floor(percents.length / 2);
    const older = average(percents.slice(0, midpoint));
    const recent = average(percents.slice(midpoint));
    const trend = older != null && recent != null ? recent - older : null;
    const rate = student.attendance.length > 0 ? attendanceRate(student.attendance) : null;
    const absences = student.attendance.filter(
      (record) => record.status === AttendanceStatus.ABSENT
    ).length;

    const academicRisk = avg == null || avg < 65 || (trend != null && trend <= -10);
    const attendanceRisk = rate == null || rate < 85 || absences >= 4;
    const dropoutRisk =
      (rate != null && rate < 75 && absences >= 4) ||
      (rate != null && rate < 85 && avg != null && avg < 60) ||
      (trend != null && trend <= -15 && rate != null && rate < 85);

    if (academicRisk || attendanceRisk) atRisk += 1;
    if (dropoutRisk) dropout += 1;
  }

  return { atRisk, dropout };
}

function buildExecutiveSummary(report: Omit<AdminMonthlyReport, "executiveSummary" | "ownerBrief" | "recommendations">) {
  const { metrics } = report;
  const attendanceSignal =
    metrics.averageAttendanceRate >= 90
      ? "attendance remained strong"
      : metrics.averageAttendanceRate >= 80
        ? "attendance was acceptable but needs monitoring"
        : "attendance requires immediate leadership attention";
  const financeSignal =
    metrics.outstandingFees > metrics.collectedRevenue
      ? "outstanding fees are higher than monthly collections"
      : "collections are ahead of the current outstanding pressure";
  const riskSignal =
    metrics.dropoutWarnings > 0
      ? `${metrics.dropoutWarnings} dropout warning(s) need urgent follow-up`
      : `${metrics.atRiskStudents} student(s) require academic or attendance support`;

  return `For ${report.monthLabel}, the school reviewed ${metrics.totalEnrollment} active student(s) across ${report.branches.length} branch scope(s). Overall, ${attendanceSignal}, ${financeSignal}, and ${riskSignal}. The owner should prioritize attendance recovery, fee collection discipline, and targeted academic interventions for the next month.`;
}

function buildOwnerBrief(metrics: AdminMonthlyReport["metrics"]) {
  const brief = [
    `${metrics.newEnrollments} new enrollment(s) were recorded this month.`,
    `${metrics.averageAttendanceRate}% average attendance rate across recorded attendance.`,
    metrics.averageScore == null
      ? "Academic average needs more grade entries for a reliable monthly reading."
      : `${metrics.averageScore}% average academic score from monthly grade records.`,
    `${metrics.atRiskStudents} at-risk student(s), including ${metrics.dropoutWarnings} dropout warning(s).`,
    `${metrics.pendingPaymentProofs} payment proof(s) need finance review.`,
  ];

  if (metrics.pendingRegistrations > 0) {
    brief.push(`${metrics.pendingRegistrations} registration request(s) are still pending.`);
  }
  if (metrics.overdueLibraryIssues > 0) {
    brief.push(`${metrics.overdueLibraryIssues} overdue library issue(s) need follow-up.`);
  }

  return brief;
}

function buildRecommendations(metrics: AdminMonthlyReport["metrics"]) {
  const recommendations: string[] = [];

  if (metrics.dropoutWarnings > 0) {
    recommendations.push("Schedule guardian follow-up for all dropout-warning students within the first week of next month.");
  }
  if (metrics.atRiskStudents > 0) {
    recommendations.push("Ask branch leaders to assign academic intervention plans for at-risk students and review progress weekly.");
  }
  if (metrics.averageAttendanceRate < 85) {
    recommendations.push("Launch a same-day absence call routine and weekly attendance review by class.");
  }
  if (metrics.outstandingFees > 0) {
    recommendations.push("Prioritize overdue and partial payment follow-up, starting with branches that have the highest outstanding balance.");
  }
  if (metrics.pendingPaymentProofs > 0) {
    recommendations.push("Clear pending payment proofs to keep finance reports accurate before the next billing cycle.");
  }
  if (metrics.averageScore != null && metrics.averageScore < 70) {
    recommendations.push("Run subject-level academic review and provide remedial support for low-scoring classes.");
  }
  if (metrics.pendingRegistrations > 0) {
    recommendations.push("Review pending staff registrations to avoid operational bottlenecks.");
  }
  if (metrics.overdueLibraryIssues > 0) {
    recommendations.push("Follow up on overdue books and unpaid library fines to protect learning resources.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintain current operating discipline and continue monitoring attendance, academic trends, and fee collection weekly.");
  }

  return recommendations.slice(0, 8);
}

export async function getAdminMonthlyReportBranchOptions(): Promise<AdminMonthlyReportBranchOption[]> {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return branches;
}

export async function getAdminMonthlyReport(input: ReportInput): Promise<AdminMonthlyReport> {
  const month = Math.min(12, Math.max(1, input.month));
  const year = Math.min(2100, Math.max(2000, input.year));
  const { start, end } = monthRange(year, month);

  const branches = await prisma.branch.findMany({
    where: {
      isActive: true,
      ...(input.branchId ? { id: input.branchId } : {}),
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, city: true },
  });
  const branchIds = branches.map((branch) => branch.id);
  const branchWhere = input.branchId ? { branchId: input.branchId } : {};

  const branchRows = await Promise.all(
    branches.map(async (branch) => {
      const where = { branchId: branch.id };
      const [
        enrollment,
        newEnrollments,
        attendance,
        grades,
        collected,
        outstandingPayments,
        riskStudents,
      ] = await Promise.all([
        prisma.student.count({ where: { ...where, isActive: true } }),
        prisma.student.count({
          where: { ...where, enrollmentDate: { gte: start, lt: end } },
        }),
        prisma.attendanceRecord.findMany({
          where: { ...where, date: { gte: start, lt: end }, studentId: { not: null } },
          select: { status: true },
        }),
        prisma.gradeRecord.findMany({
          where: { student: where, assessment: { date: { gte: start, lt: end } } },
          select: { score: true, assessment: { select: { maxScore: true } } },
        }),
        prisma.payment.aggregate({
          where: {
            ...where,
            status: PaymentStatus.PAID,
            OR: [{ paidAt: { gte: start, lt: end } }, { updatedAt: { gte: start, lt: end } }],
          },
          _sum: { paidAmount: true },
        }),
        prisma.payment.findMany({
          where: {
            ...where,
            status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
          },
          select: { amount: true, paidAmount: true },
        }),
        prisma.student.findMany({
          where: { ...where, isActive: true },
          take: 120,
          select: {
            grades: {
              where: { assessment: { date: { gte: new Date(year, month - 5, 1), lt: end } } },
              orderBy: [{ assessment: { date: "asc" } }, { createdAt: "asc" }],
              select: { score: true, assessment: { select: { maxScore: true, date: true } } },
            },
            attendance: {
              where: { date: { gte: new Date(year, month - 2, 1), lt: end } },
              select: { status: true },
            },
          },
        }),
      ]);

      const gradePercents = grades.map(percentFromGrade);
      const outstandingFees = outstandingPayments.reduce(
        (sum, payment) => sum + Math.max(0, Number(payment.amount) - Number(payment.paidAmount)),
        0
      );

      return {
        branchId: branch.id,
        branchName: branch.name,
        city: branch.city,
        enrollment,
        newEnrollments,
        attendanceRate: attendanceRate(attendance),
        averageScore: average(gradePercents),
        collectedRevenue: Number(collected._sum.paidAmount ?? 0),
        outstandingFees,
        atRiskStudents: getRiskCounts(riskStudents).atRisk,
      };
    })
  );

  const [
    inactiveStudents,
    pendingPaymentProofs,
    activeStaff,
    libraryIssues,
    overdueLibraryIssues,
    pendingRegistrations,
    auditEvents,
    riskStudents,
  ] = await Promise.all([
    prisma.student.count({
      where: {
        ...branchWhere,
        isActive: false,
        updatedAt: { gte: start, lt: end },
      },
    }),
    prisma.paymentProof.count({
      where: {
        status: PaymentProofStatus.PENDING_REVIEW,
        createdAt: { gte: start, lt: end },
        payment: branchWhere,
      },
    }),
    prisma.user.count({
      where: {
        isActive: true,
        role: { in: REPORT_STAFF_ROLES },
        ...(input.branchId ? { branchId: input.branchId } : {}),
      },
    }),
    prisma.bookIssue.count({
      where: { ...branchWhere, issuedAt: { gte: start, lt: end } },
    }),
    prisma.bookIssue.count({
      where: { ...branchWhere, returnedAt: null, dueDate: { lt: new Date() } },
    }),
    prisma.registrationRequest.count({
      where: {
        ...branchWhere,
        status: RegistrationStatus.PENDING,
      },
    }),
    prisma.auditLog.count({
      where: {
        ...branchWhere,
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.student.findMany({
      where: {
        isActive: true,
        ...(branchIds.length > 0 ? { branchId: { in: branchIds } } : {}),
      },
      take: 250,
      select: {
        grades: {
          where: { assessment: { date: { gte: new Date(year, month - 5, 1), lt: end } } },
          orderBy: [{ assessment: { date: "asc" } }, { createdAt: "asc" }],
          select: { score: true, assessment: { select: { maxScore: true, date: true } } },
        },
        attendance: {
          where: { date: { gte: new Date(year, month - 2, 1), lt: end } },
          select: { status: true },
        },
      },
    }),
  ]);

  const totalEnrollment = branchRows.reduce((sum, branch) => sum + branch.enrollment, 0);
  const totalNewEnrollments = branchRows.reduce((sum, branch) => sum + branch.newEnrollments, 0);
  const collectedRevenue = branchRows.reduce((sum, branch) => sum + branch.collectedRevenue, 0);
  const outstandingFees = branchRows.reduce((sum, branch) => sum + branch.outstandingFees, 0);
  const averageAttendanceRate =
    branchRows.length > 0
      ? Math.round(branchRows.reduce((sum, branch) => sum + branch.attendanceRate, 0) / branchRows.length)
      : 0;
  const scoreValues = branchRows
    .map((branch) => branch.averageScore)
    .filter((score): score is number => score != null);
  const riskCounts = getRiskCounts(riskStudents);

  const baseReport = {
    month,
    year,
    branchId: input.branchId ?? null,
    monthLabel: monthLabel(year, month),
    generatedAt: new Date().toISOString(),
    metrics: {
      totalEnrollment,
      newEnrollments: totalNewEnrollments,
      inactiveStudents,
      averageAttendanceRate,
      averageScore: average(scoreValues),
      atRiskStudents: riskCounts.atRisk,
      dropoutWarnings: riskCounts.dropout,
      collectedRevenue,
      outstandingFees,
      pendingPaymentProofs,
      activeStaff,
      libraryIssues,
      overdueLibraryIssues,
      pendingRegistrations,
      auditEvents,
    },
    branches: branchRows.sort((left, right) => right.enrollment - left.enrollment),
  };

  return {
    ...baseReport,
    executiveSummary: buildExecutiveSummary(baseReport),
    ownerBrief: buildOwnerBrief(baseReport.metrics),
    recommendations: buildRecommendations(baseReport.metrics),
  };
}
