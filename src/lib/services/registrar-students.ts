import type { AssessmentType, GradeBand, Prisma } from "@prisma/client";
import {
  studentScopeWhere,
  type SchoolDataScope,
} from "@/lib/auth/school-data-scope";
import { prisma } from "@/lib/prisma";
import { formatGradeLevel } from "@/lib/grade-utils";
import {
  computeGpaFromGrades,
  getStudentGpaRecords,
  getStudentGrades,
  showGpaPortal,
} from "@/lib/services/student";
import {
  formatAcademicTerm,
  formatAssessmentType,
} from "@/lib/transcript/labels";

export type RegistrarStudentListRow = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  gradeLabel: string;
  gradeBand: GradeBand;
  className: string | null;
  branchName: string;
  branchId: string;
  guardianName: string | null;
  gradeCount: number;
  assessmentCount: number;
  email: string | null;
};

export type RegistrarStudentIdCardRow = {
  id: string;
  studentId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  gradeLevel: number;
  gradeLabel: string;
  gradeBand: GradeBand;
  className: string | null;
  academicYear: string | null;
  schoolName: string;
  branchCode: string;
  branchCity: string;
  schoolAddress: string | null;
  schoolPhone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  studentEmail: string | null;
  studentPhone: string | null;
  enrollmentDate: string;
  isActive: boolean;
};

export type GeneratedStudentIdCardRow = {
  id: string;
  cardNumber: string;
  issueDate: string;
  expiresAt: string | null;
  status: string;
  notes: string | null;
  printedAt: string | null;
  createdAt: string;
  student: RegistrarStudentIdCardRow;
};

const idCardStudentInclude = {
  branch: {
    select: {
      code: true,
      name: true,
      city: true,
      address: true,
      phone: true,
    },
  },
  class: {
    select: {
      name: true,
      academicYear: { select: { name: true } },
    },
  },
  user: { select: { email: true, phone: true, photoUrl: true } },
  guardian: {
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
} satisfies Prisma.StudentInclude;

type IdCardStudentPayload = Prisma.StudentGetPayload<{
  include: typeof idCardStudentInclude;
}>;

function mapStudentForIdCard(s: IdCardStudentPayload): RegistrarStudentIdCardRow {
  const guardian = s.guardian?.user;
  return {
    id: s.id,
    studentId: s.studentId,
    fullName: `${s.firstName} ${s.lastName}`,
    firstName: s.firstName,
    lastName: s.lastName,
    photoUrl: s.user?.photoUrl ?? null,
    gradeLevel: s.gradeLevel,
    gradeLabel: formatGradeLevel(s.gradeLevel),
    gradeBand: s.gradeBand,
    className: s.class?.name ?? null,
    academicYear: s.class?.academicYear?.name ?? null,
    schoolName: s.branch.name,
    branchCode: s.branch.code,
    branchCity: s.branch.city,
    schoolAddress: s.branch.address,
    schoolPhone: s.branch.phone,
    dateOfBirth: s.dateOfBirth?.toISOString() ?? null,
    gender: s.gender,
    guardianName: guardian ? `${guardian.firstName} ${guardian.lastName}` : null,
    guardianPhone: guardian?.phone ?? null,
    guardianEmail: guardian?.email ?? null,
    studentEmail: s.user?.email ?? null,
    studentPhone: s.user?.phone ?? null,
    enrollmentDate: s.enrollmentDate.toISOString(),
    isActive: s.isActive,
  };
}

export type RegistrarGradeRow = {
  id: string;
  assessmentId: string;
  title: string;
  subject: string;
  subjectCode: string;
  type: AssessmentType;
  typeLabel: string;
  termLabel: string;
  score: number | null;
  maxScore: number;
  percent: number | null;
  date: string;
  remarks: string | null;
  hasGrade: boolean;
};

export type RegistrarStudentAcademicRecord = {
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    gender: string | null;
    gradeLevel: number;
    gradeLabel: string;
    gradeBand: GradeBand;
    stream: string | null;
    enrollmentDate: string;
    isActive: boolean;
    className: string | null;
    classId: string | null;
    academicYear: string | null;
    branchName: string;
    branchId: string;
    email: string | null;
    phone: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    guardianEmail: string | null;
  };
  showGpa: boolean;
  computedGpa: number | null;
  gpaRecords: {
    term: string;
    yearLabel: string;
    gpa: number;
    cumulative: number | null;
  }[];
  grades: RegistrarGradeRow[];
  subjectSummaries: { subject: string; count: number; averagePercent: number | null }[];
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    ratePercent: number | null;
  };
  stats: {
    gradedAssessments: number;
    classAssessments: number;
    subjects: number;
  };
};

export async function getRegistrarStudentList(options: {
  branchId?: string;
  organizationId?: string;
  scope?: SchoolDataScope | null;
  includeInactive?: boolean;
}): Promise<RegistrarStudentListRow[]> {
  const scope =
    options.scope ??
    (options.branchId
      ? { branchId: options.branchId }
      : options.organizationId
        ? { organizationId: options.organizationId }
        : null);

  const students = await prisma.student.findMany({
    where: {
      ...studentScopeWhere(scope),
      ...(options.includeInactive ? {} : { isActive: true }),
    },
    include: {
      branch: { select: { name: true } },
      class: { select: { name: true } },
      user: { select: { email: true } },
      guardian: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      _count: { select: { grades: true } },
    },
    orderBy: [{ gradeLevel: "asc" }, { firstName: "asc" }],
  });

  const classIds = [...new Set(students.map((s) => s.classId).filter(Boolean))] as string[];
  const assessmentCounts = new Map<string, number>();

  if (classIds.length > 0) {
    const grouped = await prisma.assessment.groupBy({
      by: ["classId"],
      where: { classId: { in: classIds } },
      _count: { _all: true },
    });
    for (const g of grouped) {
      if (g.classId) assessmentCounts.set(g.classId, g._count._all);
    }
  }

  return students.map((s) => {
    const guardian = s.guardian?.user;
    return {
      id: s.id,
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      gradeLevel: s.gradeLevel,
      gradeLabel: formatGradeLevel(s.gradeLevel),
      gradeBand: s.gradeBand,
      className: s.class?.name ?? null,
      branchName: s.branch.name,
      branchId: s.branchId,
      guardianName: guardian ? `${guardian.firstName} ${guardian.lastName}` : null,
      gradeCount: s._count.grades,
      assessmentCount: s.classId ? assessmentCounts.get(s.classId) ?? 0 : 0,
      email: s.user?.email ?? null,
    };
  });
}

export async function getRegistrarStudentIdCards(options: {
  branchId?: string;
  organizationId?: string;
  scope?: SchoolDataScope | null;
  includeInactive?: boolean;
}): Promise<RegistrarStudentIdCardRow[]> {
  const scope =
    options.scope ??
    (options.branchId
      ? { branchId: options.branchId }
      : options.organizationId
        ? { organizationId: options.organizationId }
        : null);

  const students = await prisma.student.findMany({
    where: {
      ...studentScopeWhere(scope),
      ...(options.includeInactive ? {} : { isActive: true }),
    },
    include: idCardStudentInclude,
    orderBy: [{ branch: { name: "asc" } }, { gradeLevel: "asc" }, { firstName: "asc" }],
  });

  return students.map(mapStudentForIdCard);
}

export async function getGeneratedStudentIdCards(options: {
  branchId?: string;
  organizationId?: string;
  scope?: SchoolDataScope | null;
}): Promise<GeneratedStudentIdCardRow[]> {
  const scope =
    options.scope ??
    (options.branchId
      ? { branchId: options.branchId }
      : options.organizationId
        ? { organizationId: options.organizationId }
        : null);

  const cards = await prisma.studentIdCard.findMany({
    where: {
      student: studentScopeWhere(scope),
    },
    include: {
      student: { include: idCardStudentInclude },
    },
    orderBy: { createdAt: "desc" },
  });

  return cards.map((card) => ({
    id: card.id,
    cardNumber: card.cardNumber,
    issueDate: card.issueDate.toISOString(),
    expiresAt: card.expiresAt?.toISOString() ?? null,
    status: card.status,
    notes: card.notes,
    printedAt: card.printedAt?.toISOString() ?? null,
    createdAt: card.createdAt.toISOString(),
    student: mapStudentForIdCard(card.student),
  }));
}

export async function getRegistrarStudentAcademicRecord(
  studentId: string,
  options?: { branchId?: string; scope?: SchoolDataScope | null }
): Promise<RegistrarStudentAcademicRecord | null> {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      ...(options?.scope
        ? studentScopeWhere(options.scope)
        : options?.branchId
          ? { branchId: options.branchId }
          : {}),
    },
    include: {
      branch: { select: { name: true } },
      class: { include: { academicYear: { select: { name: true } } } },
      user: { select: { email: true, phone: true } },
      guardian: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      },
    },
  });

  if (!student) return null;

  const [gradeRecords, gpaRecords, computedGpa, attendanceRows, classAssessments] =
    await Promise.all([
      getStudentGrades(student.id, student.classId),
      getStudentGpaRecords(student.id),
      computeGpaFromGrades(student.id),
      prisma.attendanceRecord.groupBy({
        by: ["status"],
        where: { studentId: student.id },
        _count: { _all: true },
      }),
      student.classId
        ? prisma.assessment.findMany({
            where: { classId: student.classId },
            include: {
              subject: { select: { name: true, code: true } },
              grades: {
                where: { studentId: student.id },
                select: { id: true, score: true, remarks: true },
              },
            },
            orderBy: [{ date: "desc" }, { subject: { name: "asc" } }],
          })
        : Promise.resolve([]),
    ]);

  const grades: RegistrarGradeRow[] = classAssessments.map((a) => {
    const gr = a.grades[0];
    const score = gr?.score ?? null;
    const percent =
      score != null ? Math.round((score / a.maxScore) * 100) : null;
    return {
      id: gr?.id ?? `pending-${a.id}`,
      assessmentId: a.id,
      title: a.title,
      subject: a.subject.name,
      subjectCode: a.subject.code,
      type: a.type,
      typeLabel: formatAssessmentType(a.type),
      termLabel: formatAcademicTerm(a.term),
      score,
      maxScore: a.maxScore,
      percent,
      date: a.date.toISOString(),
      remarks: gr?.remarks ?? null,
      hasGrade: !!gr,
    };
  });

  // Include grades from other classes if student moved
  for (const g of gradeRecords) {
    if (!grades.some((r) => r.assessmentId === g.assessmentId)) {
      grades.push({
        id: g.id,
        assessmentId: g.assessmentId,
        title: g.assessment.title,
        subject: g.assessment.subject.name,
        subjectCode: g.assessment.subject.code,
        type: g.assessment.type,
        typeLabel: formatAssessmentType(g.assessment.type),
        termLabel: formatAcademicTerm(g.assessment.term),
        score: g.score,
        maxScore: g.assessment.maxScore,
        percent: Math.round((g.score / g.assessment.maxScore) * 100),
        date: g.assessment.date.toISOString(),
        remarks: g.remarks,
        hasGrade: true,
      });
    }
  }

  grades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const bySubject = new Map<string, number[]>();
  for (const g of grades.filter((r) => r.percent != null)) {
    const list = bySubject.get(g.subject) ?? [];
    list.push(g.percent!);
    bySubject.set(g.subject, list);
  }

  const counts = Object.fromEntries(
    attendanceRows.map((r) => [r.status, r._count._all])
  ) as Record<string, number>;
  const present = counts.PRESENT ?? 0;
  const absent = counts.ABSENT ?? 0;
  const late = counts.LATE ?? 0;
  const excused = counts.EXCUSED ?? 0;
  const total = present + absent + late + excused;

  const guardian = student.guardian?.user;

  return {
    student: {
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
      gender: student.gender,
      gradeLevel: student.gradeLevel,
      gradeLabel: formatGradeLevel(student.gradeLevel),
      gradeBand: student.gradeBand,
      stream: student.stream,
      enrollmentDate: student.enrollmentDate.toISOString(),
      isActive: student.isActive,
      className: student.class?.name ?? null,
      classId: student.classId,
      academicYear: student.class?.academicYear?.name ?? null,
      branchName: student.branch.name,
      branchId: student.branchId,
      email: student.user?.email ?? null,
      phone: student.user?.phone ?? null,
      guardianName: guardian
        ? `${guardian.firstName} ${guardian.lastName}`
        : null,
      guardianPhone: guardian?.phone ?? null,
      guardianEmail: guardian?.email ?? null,
    },
    showGpa: showGpaPortal(student.gradeBand, student.gradeLevel),
    computedGpa,
    gpaRecords: gpaRecords.map((r) => ({
      term: formatAcademicTerm(r.term),
      yearLabel: r.yearLabel,
      gpa: r.gpa,
      cumulative: r.cumulative,
    })),
    grades,
    subjectSummaries: [...bySubject.entries()]
      .map(([subject, percents]) => ({
        subject,
        count: percents.length,
        averagePercent: Math.round(
          percents.reduce((a, b) => a + b, 0) / percents.length
        ),
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject)),
    attendance: {
      present,
      absent,
      late,
      excused,
      ratePercent:
        total > 0 ? Math.round(((present + late + excused) / total) * 100) : null,
    },
    stats: {
      gradedAssessments: grades.filter((g) => g.hasGrade).length,
      classAssessments: classAssessments.length,
      subjects: bySubject.size,
    },
  };
}
