import { prisma } from "@/lib/prisma";
import {
  sumWeightMarks,
  TOTAL_WEIGHT_MARKS,
  weightsAreValid,
} from "@/lib/grading-weighted";
import { getWeightedGradingSheet } from "@/lib/services/grading-weighted";

export type ReportSheetRow = {
  studentId: string;
  studentCode: string;
  name: string;
  className: string;
  scores: Record<string, number | null>;
  total: number | null;
};

export type ReportSheetCard = {
  sheetKey: string;
  subjectId: string;
  classId: string;
  subjectName: string;
  className: string;
  gradeLevel: number;
  components: { id: string; label: string; weightMarks: number; maxScore: number }[];
  weightsTotal: number;
  weightsValid: boolean;
  studentCount: number;
  gradedCount: number;
  completeCount: number;
  averageTotal: number | null;
  lastUpdated: string | null;
  rows: ReportSheetRow[];
};

export type StandaloneAssessmentCard = {
  id: string;
  title: string;
  type: string;
  classId: string;
  subjectId: string;
  className: string;
  subjectName: string;
  maxScore: number;
  date: string;
  gradedCount: number;
  rosterCount: number;
  averageScore: number | null;
  completionPct: number;
};

export type TeacherReportsData = {
  sheets: ReportSheetCard[];
  standalone: StandaloneAssessmentCard[];
  stats: {
    sheetCount: number;
    studentsOnRoster: number;
    fullyGradedStudents: number;
    sheetsNeedingWork: number;
  };
};

export async function getTeacherReportCards(
  staffId: string,
  branchId: string,
  subjectIds: string[]
): Promise<TeacherReportsData> {
  if (subjectIds.length === 0) {
    return {
      sheets: [],
      standalone: [],
      stats: {
        sheetCount: 0,
        studentsOnRoster: 0,
        fullyGradedStudents: 0,
        sheetsNeedingWork: 0,
      },
    };
  }

  const sheetAssessments = await prisma.assessment.findMany({
    where: {
      subjectId: { in: subjectIds },
      sheetKey: { not: null },
      class: { branchId },
    },
    select: {
      sheetKey: true,
      subjectId: true,
      classId: true,
    },
    distinct: ["sheetKey"],
  });

  const combos = sheetAssessments
    .filter((a) => a.sheetKey?.startsWith(`sheet:${staffId}:`))
    .map((a) => ({
      sheetKey: a.sheetKey!,
      subjectId: a.subjectId,
      classId: a.classId,
    }));

  const uniqueCombos = [
    ...new Map(combos.map((c) => [`${c.subjectId}:${c.classId}`, c])).values(),
  ];

  const sheets: ReportSheetCard[] = [];

  for (const combo of uniqueCombos) {
    const sheet = await getWeightedGradingSheet(
      staffId,
      branchId,
      combo.subjectId,
      combo.classId
    );

    const components = sheet.components.map((c) => ({
      id: c.assessmentId ?? c.id,
      label: c.label,
      weightMarks: c.weightMarks,
      maxScore: c.maxScore,
    }));

    const weightsTotal = sumWeightMarks(sheet.components);
    const colIds = components.map((c) => c.id);

    const rows: ReportSheetRow[] = sheet.rows.map((r) => ({
      studentId: r.studentId,
      studentCode: r.studentCode,
      name: `${r.firstName} ${r.lastName}`,
      className: r.className,
      scores: r.scores,
      total: r.weightedTotal,
    }));

    let gradedCount = 0;
    let completeCount = 0;
    const totals: number[] = [];

    for (const row of rows) {
      const filled = colIds.filter(
        (id) => row.scores[id] !== null && row.scores[id] !== undefined
      ).length;
      if (filled > 0) gradedCount++;
      if (colIds.length > 0 && filled === colIds.length) completeCount++;
      if (row.total !== null) totals.push(row.total);
    }

    const klass = await prisma.class.findUnique({
      where: { id: combo.classId },
      select: { gradeLevel: true },
    });

    const subject = await prisma.subject.findUnique({
      where: { id: combo.subjectId },
      select: { name: true },
    });

    const meta = await prisma.assessment.aggregate({
      where: { sheetKey: sheet.sheetKey },
      _max: { createdAt: true },
    });

    sheets.push({
      sheetKey: sheet.sheetKey,
      subjectId: combo.subjectId,
      classId: combo.classId,
      subjectName: subject?.name ?? "—",
      className: sheet.className,
      gradeLevel: klass?.gradeLevel ?? 0,
      components,
      weightsTotal,
      weightsValid: weightsAreValid(sheet.components),
      studentCount: rows.length,
      gradedCount,
      completeCount,
      averageTotal:
        totals.length > 0
          ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 100) / 100
          : null,
      lastUpdated: meta._max.createdAt?.toISOString() ?? null,
      rows,
    });
  }

  sheets.sort((a, b) =>
    a.className.localeCompare(b.className) || a.subjectName.localeCompare(b.subjectName)
  );

  const standaloneRaw = await prisma.assessment.findMany({
    where: {
      subjectId: { in: subjectIds },
      sheetKey: null,
      class: { branchId },
    },
    include: {
      class: { select: { id: true, name: true, gradeLevel: true } },
      subject: { select: { id: true, name: true, gradeBand: true } },
      grades: { select: { score: true } },
    },
    orderBy: { date: "desc" },
  });

  const grouped = new Map<string, (typeof standaloneRaw)[number]>();
  for (const a of standaloneRaw) {
    const key = `${a.title}|${a.classId}|${a.subjectId}`;
    const existing = grouped.get(key);
    if (!existing || a.grades.length > existing.grades.length) {
      grouped.set(key, a);
    }
  }

  const standalone: StandaloneAssessmentCard[] = [];

  for (const a of grouped.values()) {
    const rosterCount = await prisma.student.count({
      where: {
        branchId,
        isActive: true,
        gradeBand: a.subject.gradeBand,
        gradeLevel: a.class.gradeLevel,
      },
    });

    const gradedCount = a.grades.length;
    const averageScore =
      gradedCount > 0
        ? Math.round(
            (a.grades.reduce((s, g) => s + g.score, 0) / gradedCount) * 100
          ) / 100
        : null;

    standalone.push({
      id: a.id,
      title: a.title,
      type: a.type,
      classId: a.classId,
      subjectId: a.subjectId,
      className: a.class.name,
      subjectName: a.subject.name,
      maxScore: a.maxScore,
      date: a.date.toISOString(),
      gradedCount,
      rosterCount,
      averageScore,
      completionPct:
        rosterCount > 0 ? Math.round((gradedCount / rosterCount) * 100) : 0,
    });
  }

  standalone.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const studentsOnRoster = sheets.reduce((s, sh) => s + sh.studentCount, 0);
  const fullyGradedStudents = sheets.reduce((s, sh) => s + sh.completeCount, 0);
  const sheetsNeedingWork = sheets.filter(
    (sh) =>
      !sh.weightsValid ||
      sh.completeCount < sh.studentCount ||
      sh.components.length === 0
  ).length;

  return {
    sheets,
    standalone,
    stats: {
      sheetCount: sheets.length,
      studentsOnRoster,
      fullyGradedStudents,
      sheetsNeedingWork,
    },
  };
}

export function formatReportDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ET", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export { TOTAL_WEIGHT_MARKS };
