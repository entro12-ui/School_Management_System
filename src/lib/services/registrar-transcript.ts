import { AcademicTerm, type AssessmentType, type GradeBand } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatGradeLevel } from "@/lib/grade-utils";
import { getSystemSettings } from "@/lib/system-settings";
import { formatAcademicTerm, formatAssessmentType } from "@/lib/transcript/labels";

const SEMESTER_TERMS: AcademicTerm[] = [
  AcademicTerm.SEMESTER_1,
  AcademicTerm.SEMESTER_2,
];

type AssessmentForTranscript = {
  id: string;
  subjectId: string;
  title: string;
  type: AssessmentType;
  term: AcademicTerm | null;
  maxScore: number;
  weight: number;
  weightPercent: number | null;
  subject: { name: string; code: string };
  grades: { studentId: string; score: number; remarks: string | null }[];
};

export type RegistrarTranscriptAssessmentRow = {
  id: string;
  title: string;
  typeLabel: string;
  score: number | null;
  maxScore: number;
  percent: number | null;
  weightMarks: number;
  remarks: string | null;
};

export type RegistrarTranscriptSubjectRow = {
  subjectId: string;
  subject: string;
  subjectCode: string;
  mark: number | null;
  maxMark: number;
  status: "COMPLETE" | "PENDING";
  assessments: RegistrarTranscriptAssessmentRow[];
};

export type RegistrarTranscriptSemester = {
  term: AcademicTerm;
  termLabel: string;
  subjects: RegistrarTranscriptSubjectRow[];
  subjectCount: number;
  total: number | null;
  maxTotal: number;
  average: number | null;
  rank: number | null;
  classSize: number;
};

export type RegistrarSemesterTranscriptData = {
  schoolName: string;
  country: string;
  calendar: string;
  issuedAt: string;
  documentNumber: string;
  issuedBy: {
    name: string;
    role: string;
  };
  student: {
    id: string;
    studentId: string;
    fullName: string;
    dateOfBirth: string | null;
    gender: string | null;
    gradeLabel: string;
    gradeBand: GradeBand;
    stream: string | null;
    className: string | null;
    academicYear: string | null;
    branchName: string;
    branchCity: string;
    branchAddress: string | null;
    branchPhone: string | null;
  };
  semesters: RegistrarTranscriptSemester[];
  yearlyTotal: number | null;
  yearlyMaxTotal: number;
  yearlyAverage: number | null;
};

export async function getRegistrarSemesterTranscript(
  studentId: string,
  options?: { branchId?: string; issuedByUserId?: string }
): Promise<RegistrarSemesterTranscriptData | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      branch: {
        select: { name: true, city: true, address: true, phone: true },
      },
      class: {
        include: { academicYear: { select: { name: true } } },
      },
    },
  });

  if (!student) return null;
  if (options?.branchId && student.branchId !== options.branchId) return null;

  const [settings, issuedBy] = await Promise.all([
    getSystemSettings(),
    options?.issuedByUserId
      ? prisma.user.findUnique({
          where: { id: options.issuedByUserId },
          select: { firstName: true, lastName: true, role: true },
        })
      : null,
  ]);

  const semesters = student.classId
    ? await buildSemesters(student.id, student.classId)
    : emptySemesters();

  const validSemesterAverages = semesters
    .map((semester) => semester.average)
    .filter((avg): avg is number => avg !== null);
  const yearlyAverage =
    validSemesterAverages.length > 0
      ? round2(validSemesterAverages.reduce((sum, avg) => sum + avg, 0) / validSemesterAverages.length)
      : null;
  const yearlyTotals = semesters
    .map((semester) => semester.total)
    .filter((total): total is number => total !== null);
  const yearlyTotal =
    yearlyTotals.length > 0 ? round2(yearlyTotals.reduce((sum, total) => sum + total, 0)) : null;

  return {
    schoolName: settings.schoolName,
    country: settings.defaultCountry,
    calendar: settings.academicCalendar,
    issuedAt: new Date().toISOString(),
    documentNumber: buildDocumentNumber(student.studentId),
    issuedBy: {
      name: issuedBy ? `${issuedBy.firstName} ${issuedBy.lastName}` : "Registrar Office",
      role: issuedBy?.role?.replace(/_/g, " ") ?? "REGISTRAR",
    },
    student: {
      id: student.id,
      studentId: student.studentId,
      fullName: `${student.firstName} ${student.lastName}`,
      dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
      gender: student.gender,
      gradeLabel: formatGradeLevel(student.gradeLevel),
      gradeBand: student.gradeBand,
      stream: student.stream,
      className: student.class?.name ?? null,
      academicYear: student.class?.academicYear?.name ?? null,
      branchName: student.branch.name,
      branchCity: student.branch.city,
      branchAddress: student.branch.address,
      branchPhone: student.branch.phone,
    },
    semesters,
    yearlyTotal,
    yearlyMaxTotal: semesters.reduce((sum, semester) => sum + semester.maxTotal, 0),
    yearlyAverage,
  };
}

async function buildSemesters(studentId: string, classId: string) {
  const [classStudents, assessments] = await Promise.all([
    prisma.student.findMany({
      where: { classId, isActive: true },
      select: { id: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.assessment.findMany({
      where: { classId, term: { in: SEMESTER_TERMS } },
      include: {
        subject: { select: { name: true, code: true } },
        grades: {
          select: { studentId: true, score: true, remarks: true },
        },
      },
      orderBy: [{ term: "asc" }, { subject: { name: "asc" } }, { sortOrder: "asc" }],
    }),
  ]);

  return SEMESTER_TERMS.map((term) => {
    const termAssessments = assessments.filter((assessment) => assessment.term === term);
    const classResults = computeClassResults(classStudents.map((s) => s.id), termAssessments);
    const studentResult = classResults.get(studentId);
    const ranked = [...classResults.entries()]
      .map(([id, result]) => ({ id, average: result.average }))
      .filter((row): row is { id: string; average: number } => row.average !== null)
      .sort((a, b) => b.average - a.average);
    const rank = rankStudent(ranked, studentId);

    return {
      term,
      termLabel: formatAcademicTerm(term),
      subjects: studentResult?.subjects ?? [],
      subjectCount: studentResult?.subjectCount ?? 0,
      total: studentResult?.total ?? null,
      maxTotal: studentResult?.maxTotal ?? 0,
      average: studentResult?.average ?? null,
      rank,
      classSize: ranked.length,
    };
  });
}

function computeClassResults(studentIds: string[], assessments: AssessmentForTranscript[]) {
  const results = new Map<
    string,
    {
      subjects: RegistrarTranscriptSubjectRow[];
      subjectCount: number;
      total: number | null;
      maxTotal: number;
      average: number | null;
    }
  >();

  for (const studentId of studentIds) {
    const subjects = buildSubjectRows(studentId, assessments);
    const marks = subjects
      .map((subject) => subject.mark)
      .filter((mark): mark is number => mark !== null);
    const total = marks.length > 0 ? round2(marks.reduce((sum, mark) => sum + mark, 0)) : null;
    const maxTotal = subjects.length * 100;
    const average = marks.length > 0 ? round2(total! / marks.length) : null;

    results.set(studentId, {
      subjects,
      subjectCount: marks.length,
      total,
      maxTotal,
      average,
    });
  }

  return results;
}

function buildSubjectRows(
  studentId: string,
  assessments: AssessmentForTranscript[]
): RegistrarTranscriptSubjectRow[] {
  const bySubject = new Map<string, AssessmentForTranscript[]>();

  for (const assessment of assessments) {
    const list = bySubject.get(assessment.subjectId) ?? [];
    list.push(assessment);
    bySubject.set(assessment.subjectId, list);
  }

  return [...bySubject.entries()]
    .map(([subjectId, subjectAssessments]) => {
      const first = subjectAssessments[0];
      const rows = subjectAssessments.map((assessment) => {
        const grade = assessment.grades.find((g) => g.studentId === studentId);
        const percent =
          grade?.score != null ? round2((grade.score / assessment.maxScore) * 100) : null;

        return {
          id: assessment.id,
          title: assessment.title,
          typeLabel: formatAssessmentType(assessment.type),
          score: grade?.score ?? null,
          maxScore: assessment.maxScore,
          percent,
          weightMarks: assessment.weightPercent ?? assessment.weight,
          remarks: grade?.remarks ?? null,
        };
      });

      const mark = computeSubjectMark(rows);

      return {
        subjectId,
        subject: first.subject.name,
        subjectCode: first.subject.code,
        mark,
        maxMark: 100,
        status: mark === null ? "PENDING" : "COMPLETE",
        assessments: rows,
      } satisfies RegistrarTranscriptSubjectRow;
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

function computeSubjectMark(rows: RegistrarTranscriptAssessmentRow[]) {
  const graded = rows.filter((row) => row.percent !== null);
  if (graded.length === 0) return null;

  const weightedSum = graded.reduce(
    (sum, row) => sum + row.percent! * (row.weightMarks || 1),
    0
  );
  const weightTotal = graded.reduce((sum, row) => sum + (row.weightMarks || 1), 0);

  return weightTotal > 0 ? round2(weightedSum / weightTotal) : null;
}

function rankStudent(ranked: { id: string; average: number }[], studentId: string) {
  const target = ranked.find((row) => row.id === studentId);
  if (!target) return null;
  const higherAverages = new Set(
    ranked.filter((row) => row.average > target.average).map((row) => row.average)
  );
  return higherAverages.size + 1;
}

function emptySemesters(): RegistrarTranscriptSemester[] {
  return SEMESTER_TERMS.map((term) => ({
    term,
    termLabel: formatAcademicTerm(term),
    subjects: [],
    subjectCount: 0,
    total: null,
    maxTotal: 0,
    average: null,
    rank: null,
    classSize: 0,
  }));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function buildDocumentNumber(studentId: string) {
  const safeId = studentId.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `TR-${safeId}-${date}`;
}
