import type { AcademicTerm, AssessmentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  computeGpaFromGrades,
  getStudentByUserId,
  getStudentGpaRecords,
  getStudentGrades,
  showGpaPortal,
} from "@/lib/services/student";
import { getSystemSettings } from "@/lib/system-settings";
import { formatAcademicTerm, formatAssessmentType, formatGradeLevel } from "@/lib/transcript/labels";

export type TranscriptGradeRow = {
  id: string;
  subject: string;
  subjectCode: string | null;
  title: string;
  type: AssessmentType;
  typeLabel: string;
  term: AcademicTerm | null;
  termLabel: string;
  score: number;
  maxScore: number;
  percent: number;
  date: string;
};

export type TranscriptSubjectSummary = {
  subject: string;
  assessmentCount: number;
  averagePercent: number;
};

export type StudentTranscriptData = {
  schoolName: string;
  defaultCountry: string;
  academicCalendar: string;
  issuedAt: string;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth: string | null;
    gender: string | null;
    gradeLabel: string;
    stream: string | null;
    className: string | null;
    academicYear: string | null;
    branchName: string;
    enrollmentDate: string;
  };
  showGpa: boolean;
  computedGpa: number | null;
  gpaRecords: {
    term: string;
    yearLabel: string;
    gpa: number;
    cumulative: number | null;
  }[];
  grades: TranscriptGradeRow[];
  subjectSummaries: TranscriptSubjectSummary[];
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    ratePercent: number | null;
  };
};

function gradeRowFromRecord(
  g: Awaited<ReturnType<typeof getStudentGrades>>[number]
): TranscriptGradeRow {
  const percent = Math.round((g.score / g.assessment.maxScore) * 100);
  return {
    id: g.id,
    subject: g.assessment.subject.name,
    subjectCode: g.assessment.subject.code,
    title: g.assessment.title,
    type: g.assessment.type,
    typeLabel: formatAssessmentType(g.assessment.type),
    term: g.assessment.term,
    termLabel: formatAcademicTerm(g.assessment.term),
    score: g.score,
    maxScore: g.assessment.maxScore,
    percent,
    date: g.assessment.date.toISOString(),
  };
}

function buildSubjectSummaries(rows: TranscriptGradeRow[]): TranscriptSubjectSummary[] {
  const bySubject = new Map<string, number[]>();
  for (const r of rows) {
    const list = bySubject.get(r.subject) ?? [];
    list.push(r.percent);
    bySubject.set(r.subject, list);
  }
  return [...bySubject.entries()]
    .map(([subject, percents]) => ({
      subject,
      assessmentCount: percents.length,
      averagePercent: Math.round(
        percents.reduce((a, b) => a + b, 0) / percents.length
      ),
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

export async function getStudentTranscriptByUserId(
  userId: string
): Promise<StudentTranscriptData | null> {
  const student = await getStudentByUserId(userId);
  if (!student) return null;

  const [settings, grades, gpaRecords, computedGpa, attendanceRows] = await Promise.all([
    getSystemSettings(),
    getStudentGrades(student.id, student.classId),
    getStudentGpaRecords(student.id),
    computeGpaFromGrades(student.id),
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { studentId: student.id },
      _count: { _all: true },
    }),
  ]);

  const gradeRows = grades.map(gradeRowFromRecord);
  const counts = Object.fromEntries(
    attendanceRows.map((r) => [r.status, r._count._all])
  ) as Record<string, number>;
  const present = counts.PRESENT ?? 0;
  const absent = counts.ABSENT ?? 0;
  const late = counts.LATE ?? 0;
  const excused = counts.EXCUSED ?? 0;
  const total = present + absent + late + excused;
  const ratePercent =
    total > 0 ? Math.round(((present + late + excused) / total) * 100) : null;

  return {
    schoolName: settings.schoolName,
    defaultCountry: settings.defaultCountry,
    academicCalendar: settings.academicCalendar,
    issuedAt: new Date().toISOString(),
    student: {
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
      gender: student.gender,
      gradeLabel: formatGradeLevel(student.gradeLevel),
      stream: student.stream,
      className: student.class?.name ?? null,
      academicYear: student.class?.academicYear?.name ?? null,
      branchName: student.branch.name,
      enrollmentDate: student.enrollmentDate.toISOString(),
    },
    showGpa: showGpaPortal(student.gradeBand, student.gradeLevel),
    computedGpa,
    gpaRecords: gpaRecords.map((r) => ({
      term: formatAcademicTerm(r.term),
      yearLabel: r.yearLabel,
      gpa: r.gpa,
      cumulative: r.cumulative,
    })),
    grades: gradeRows,
    subjectSummaries: buildSubjectSummaries(gradeRows),
    attendance: { present, absent, late, excused, ratePercent },
  };
}

export function transcriptFilename(
  data: StudentTranscriptData,
  ext: "html" | "csv"
): string {
  const safeId = data.student.studentId.replace(/[^a-zA-Z0-9-_]/g, "_");
  const date = new Date().toISOString().slice(0, 10);
  return `transcript-${safeId}-${date}.${ext}`;
}
