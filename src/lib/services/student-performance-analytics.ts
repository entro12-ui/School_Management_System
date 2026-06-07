import { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatGradeLevel } from "@/lib/grade-utils";
import { fullName } from "@/lib/utils";

export type StudentRiskLevel = "critical" | "high" | "moderate" | "stable";

export type StudentPerformanceRisk = {
  watchRank: number;
  studentId: string;
  studentCode: string;
  studentName: string;
  branchName: string;
  className: string;
  gradeLabel: string;
  riskLevel: StudentRiskLevel;
  riskScore: number;
  averagePercent: number | null;
  attendanceRate: number | null;
  absences: number;
  lateArrivals: number;
  gradeTrend: number | null;
  trendLabel: string;
  attendanceCorrelation: string;
  dropoutWarning: boolean;
  riskFactors: string[];
  interventions: string[];
};

export type StudentPerformanceAnalytics = {
  generatedAt: Date;
  totalStudentsReviewed: number;
  atRiskCount: number;
  dropoutWarningCount: number;
  averageRiskScore: number;
  attendanceAcademicCorrelation: string;
  students: StudentPerformanceRisk[];
};

const REVIEW_LIMIT = 250;
const GRADE_WINDOW_DAYS = 120;
const ATTENDANCE_WINDOW_DAYS = 60;

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function daysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function classifyRisk(score: number): StudentRiskLevel {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 35) return "moderate";
  return "stable";
}

function buildTrendLabel(trend: number | null) {
  if (trend == null) return "Needs more grade data";
  if (trend <= -12) return `Declining ${Math.abs(trend)} pts`;
  if (trend <= -5) return `Slight decline ${Math.abs(trend)} pts`;
  if (trend >= 8) return `Improving ${trend} pts`;
  return "Mostly steady";
}

function scoreAcademicRisk(averagePercent: number | null, gradeTrend: number | null) {
  let score = 0;
  if (averagePercent == null) return 18;
  if (averagePercent < 50) score += 38;
  else if (averagePercent < 60) score += 30;
  else if (averagePercent < 70) score += 18;

  if (gradeTrend != null) {
    if (gradeTrend <= -15) score += 22;
    else if (gradeTrend <= -8) score += 14;
    else if (gradeTrend <= -4) score += 7;
  }
  return score;
}

function scoreAttendanceRisk(attendanceRate: number | null, absences: number, lateArrivals: number) {
  let score = 0;
  if (attendanceRate == null) return 15;
  if (attendanceRate < 70) score += 32;
  else if (attendanceRate < 80) score += 24;
  else if (attendanceRate < 90) score += 12;

  if (absences >= 8) score += 16;
  else if (absences >= 4) score += 9;
  if (lateArrivals >= 6) score += 7;
  return score;
}

function buildCorrelationInsight(
  averagePercent: number | null,
  attendanceRate: number | null,
  gradeTrend: number | null
) {
  if (averagePercent == null || attendanceRate == null) {
    return "Needs more grade and attendance data";
  }
  if (attendanceRate < 85 && averagePercent < 70) {
    return "Low attendance aligns with weaker grades";
  }
  if (attendanceRate < 85 && gradeTrend != null && gradeTrend < -5) {
    return "Attendance concerns align with a declining grade trend";
  }
  if (attendanceRate >= 92 && averagePercent < 65) {
    return "Attendance is stable; academic support should be targeted";
  }
  if (attendanceRate >= 90 && averagePercent >= 70) {
    return "Attendance and grades are both healthy";
  }
  return "Mixed signal; monitor both attendance and grades";
}

function buildRiskFactors(
  averagePercent: number | null,
  attendanceRate: number | null,
  absences: number,
  lateArrivals: number,
  gradeTrend: number | null
) {
  const factors: string[] = [];
  if (averagePercent == null) factors.push("Limited recent grade data");
  else if (averagePercent < 60) factors.push(`Low average score (${averagePercent}%)`);
  else if (averagePercent < 70) factors.push(`Borderline average score (${averagePercent}%)`);

  if (gradeTrend != null && gradeTrend <= -8) {
    factors.push(`Grades declined by ${Math.abs(gradeTrend)} points`);
  }
  if (attendanceRate == null) factors.push("Limited recent attendance data");
  else if (attendanceRate < 85) factors.push(`Attendance below target (${attendanceRate}%)`);
  if (absences >= 4) factors.push(`${absences} absences in recent records`);
  if (lateArrivals >= 6) factors.push(`${lateArrivals} late arrivals`);

  return factors.length > 0 ? factors : ["No major warning factors"];
}

function buildInterventions(risk: {
  averagePercent: number | null;
  attendanceRate: number | null;
  absences: number;
  gradeTrend: number | null;
  dropoutWarning: boolean;
}) {
  const suggestions: string[] = [];

  if (risk.dropoutWarning) {
    suggestions.push("Schedule a parent or guardian conference within one week.");
    suggestions.push("Assign a staff mentor to check attendance and wellbeing twice weekly.");
  }
  if (risk.averagePercent == null) {
    suggestions.push("Ask teachers to enter recent assessment evidence for a clearer picture.");
  } else if (risk.averagePercent < 60) {
    suggestions.push("Create a two-week remedial plan focused on the lowest scoring subjects.");
  } else if (risk.averagePercent < 70) {
    suggestions.push("Offer targeted practice and weekly progress check-ins.");
  }
  if (risk.gradeTrend != null && risk.gradeTrend <= -8) {
    suggestions.push("Review the last three assessments to identify where the decline started.");
  }
  if (risk.attendanceRate != null && risk.attendanceRate < 85) {
    suggestions.push("Start attendance follow-up with same-day absence calls.");
  }
  if (risk.absences >= 4) {
    suggestions.push("Check transport, health, or home factors affecting attendance.");
  }

  return suggestions.slice(0, 4);
}

type StudentRiskSource = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  branch: { name: string };
  class: { name: string } | null;
  grades: Array<{
    score: number;
    assessment: { date: Date; maxScore: number };
  }>;
  attendance: Array<{ status: AttendanceStatus }>;
};

function getStudentRiskInclude() {
  const gradeSince = daysAgo(GRADE_WINDOW_DAYS);
  const attendanceSince = daysAgo(ATTENDANCE_WINDOW_DAYS);

  return {
    branch: { select: { name: true } },
    class: { select: { name: true } },
    grades: {
      where: { assessment: { date: { gte: gradeSince } } },
      orderBy: [{ assessment: { date: "asc" as const } }, { createdAt: "asc" as const }],
      take: 16,
      include: {
        assessment: {
          select: {
            date: true,
            maxScore: true,
          },
        },
      },
    },
    attendance: {
      where: { date: { gte: attendanceSince } },
      select: { status: true },
      orderBy: { date: "asc" as const },
      take: 80,
    },
  };
}

function computeStudentPerformanceRisk(student: StudentRiskSource): StudentPerformanceRisk {
  const gradePercents = student.grades
    .filter((grade) => grade.assessment.maxScore > 0)
    .map((grade) => Math.round((grade.score / grade.assessment.maxScore) * 100));

  const averagePercent = average(gradePercents);
  const midpoint = Math.floor(gradePercents.length / 2);
  const olderAverage = average(gradePercents.slice(0, midpoint));
  const recentAverage = average(gradePercents.slice(midpoint));
  const gradeTrend =
    olderAverage != null && recentAverage != null ? recentAverage - olderAverage : null;

  const presentCount = student.attendance.filter(
    (record) =>
      record.status === AttendanceStatus.PRESENT ||
      record.status === AttendanceStatus.LATE ||
      record.status === AttendanceStatus.EXCUSED
  ).length;
  const absences = student.attendance.filter(
    (record) => record.status === AttendanceStatus.ABSENT
  ).length;
  const lateArrivals = student.attendance.filter(
    (record) => record.status === AttendanceStatus.LATE
  ).length;
  const attendanceRate =
    student.attendance.length > 0
      ? Math.round((presentCount / student.attendance.length) * 100)
      : null;

  const dropoutWarning =
    (attendanceRate != null && attendanceRate < 75 && absences >= 4) ||
    (attendanceRate != null &&
      attendanceRate < 85 &&
      averagePercent != null &&
      averagePercent < 60) ||
    (gradeTrend != null && gradeTrend <= -15 && attendanceRate != null && attendanceRate < 85);

  const riskScore = clamp(
    scoreAcademicRisk(averagePercent, gradeTrend) +
      scoreAttendanceRisk(attendanceRate, absences, lateArrivals) +
      (dropoutWarning ? 16 : 0)
  );

  const riskFactors = buildRiskFactors(
    averagePercent,
    attendanceRate,
    absences,
    lateArrivals,
    gradeTrend
  );

  return {
    watchRank: 0,
    studentId: student.id,
    studentCode: student.studentId,
    studentName: fullName(student.firstName, student.lastName),
    branchName: student.branch.name,
    className: student.class?.name ?? "Unassigned",
    gradeLabel: formatGradeLevel(student.gradeLevel),
    riskLevel: classifyRisk(riskScore),
    riskScore,
    averagePercent,
    attendanceRate,
    absences,
    lateArrivals,
    gradeTrend,
    trendLabel: buildTrendLabel(gradeTrend),
    attendanceCorrelation: buildCorrelationInsight(
      averagePercent,
      attendanceRate,
      gradeTrend
    ),
    dropoutWarning,
    riskFactors,
    interventions: buildInterventions({
      averagePercent,
      attendanceRate,
      absences,
      gradeTrend,
      dropoutWarning,
    }),
  };
}

export async function getStudentPerformanceRiskById(
  studentId: string,
  options?: { branchId?: string }
): Promise<StudentPerformanceRisk | null> {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      isActive: true,
      ...(options?.branchId ? { branchId: options.branchId } : {}),
    },
    include: getStudentRiskInclude(),
  });

  if (!student) return null;
  return computeStudentPerformanceRisk(student as unknown as StudentRiskSource);
}

export async function getStudentPerformanceAnalytics(
  organizationId?: string
): Promise<StudentPerformanceAnalytics> {
  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      ...(organizationId ? { branch: { organizationId } } : {}),
    },
    take: REVIEW_LIMIT,
    orderBy: [{ branch: { name: "asc" } }, { gradeLevel: "asc" }, { lastName: "asc" }],
    include: getStudentRiskInclude(),
  });

  const riskRows = students.map((student) =>
    computeStudentPerformanceRisk(student as unknown as StudentRiskSource)
  );

  riskRows.sort((left, right) => right.riskScore - left.riskScore);

  const atRiskRows = riskRows
    .filter((row) => row.riskLevel !== "stable")
    .map((row, index) => ({ ...row, watchRank: index + 1 }));
  const dropoutWarningCount = riskRows.filter((row) => row.dropoutWarning).length;
  const averageRiskScore =
    riskRows.length > 0
      ? Math.round(riskRows.reduce((sum, row) => sum + row.riskScore, 0) / riskRows.length)
      : 0;

  const lowAttendanceLowGradeCount = riskRows.filter(
    (row) =>
      row.attendanceRate != null &&
      row.attendanceRate < 85 &&
      row.averagePercent != null &&
      row.averagePercent < 70
  ).length;

  return {
    generatedAt: new Date(),
    totalStudentsReviewed: riskRows.length,
    atRiskCount: atRiskRows.length,
    dropoutWarningCount,
    averageRiskScore,
    attendanceAcademicCorrelation:
      lowAttendanceLowGradeCount > 0
        ? `${lowAttendanceLowGradeCount} student(s) show both attendance and academic risk.`
        : "No strong system-wide attendance/grade risk cluster found.",
    students: atRiskRows,
  };
}
