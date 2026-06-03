import type { GradeBand } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TeacherClassSummary = {
  id: string;
  name: string;
  gradeLevel: number;
  gradeBand: GradeBand;
  academicYear: string;
  studentCount: number;
  isHomeroom: boolean;
  mySubjects: { id: string; name: string }[];
  sectionSubjects: { id: string; name: string }[];
};

export type TeacherClassesStats = {
  classCount: number;
  homeroomCount: number;
  studentCount: number;
};

export async function getTeacherByUserId(userId: string) {
  const teacher = await prisma.staffProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      branchId: true,
      employeeId: true,
      department: true,
      hireDate: true,
      createdAt: true,
      branch: true,
      staffSubjects: {
        include: { subject: true },
      },
      classAssignments: {
        include: {
          class: {
            include: {
              academicYear: { select: { name: true } },
              _count: { select: { students: { where: { isActive: true } } } },
            },
          },
        },
      },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!teacher) return null;

  return {
    ...teacher,
    // Compatibility for databases that have not applied the schedule-unit migration yet.
    isScheduleUnitLeader: false,
  };
}

export async function getTeacherClasses(userId: string) {
  const teacher = await getTeacherByUserId(userId);
  if (!teacher) return null;

  const subjectIds = teacher.staffSubjects.map((s) => s.subjectId);
  const subjectIdSet = new Set(subjectIds);
  const homeroomClassIds = new Set(
    teacher.classAssignments.filter((a) => a.isPrimary).map((a) => a.classId)
  );

  const orFilters = [
    ...(homeroomClassIds.size > 0
      ? [{ id: { in: [...homeroomClassIds] } }]
      : []),
    ...(subjectIds.length > 0
      ? [{ subjects: { some: { subjectId: { in: subjectIds } } } }]
      : []),
  ];

  if (orFilters.length === 0) {
    return {
      teacher,
      classes: [] as TeacherClassSummary[],
      stats: { classCount: 0, homeroomCount: 0, studentCount: 0 },
    };
  }

  const classes = await prisma.class.findMany({
    where: {
      branchId: teacher.branchId,
      OR: orFilters,
    },
    include: {
      academicYear: { select: { name: true } },
      subjects: { include: { subject: { select: { id: true, name: true } } } },
      _count: { select: { students: { where: { isActive: true } } } },
    },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });

  const summaries: TeacherClassSummary[] = classes.map((cls) => {
    const mySubjects = cls.subjects
      .filter((cs) => subjectIdSet.has(cs.subjectId))
      .map((cs) => ({ id: cs.subject.id, name: cs.subject.name }));
    const sectionSubjects = cls.subjects.map((cs) => ({
      id: cs.subject.id,
      name: cs.subject.name,
    }));

    return {
      id: cls.id,
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      gradeBand: cls.gradeBand,
      academicYear: cls.academicYear.name,
      studentCount: cls._count.students,
      isHomeroom: homeroomClassIds.has(cls.id),
      mySubjects,
      sectionSubjects,
    };
  });

  summaries.sort((a, b) => {
    if (a.isHomeroom !== b.isHomeroom) return a.isHomeroom ? -1 : 1;
    if (a.gradeLevel !== b.gradeLevel) return a.gradeLevel - b.gradeLevel;
    return a.name.localeCompare(b.name);
  });

  const stats: TeacherClassesStats = {
    classCount: summaries.length,
    homeroomCount: summaries.filter((c) => c.isHomeroom).length,
    studentCount: summaries.reduce((sum, c) => sum + c.studentCount, 0),
  };

  return { teacher, classes: summaries, stats };
}

export async function getTeacherClassOptions(userId: string) {
  const data = await getTeacherClasses(userId);
  if (!data) return [];
  return data.classes.map((c) => ({
    id: c.id,
    name: c.name,
    gradeLevel: c.gradeLevel,
    isHomeroom: c.isHomeroom,
  }));
}

export async function teacherCanAccessClass(
  userId: string,
  classId: string
): Promise<boolean> {
  const data = await getTeacherClasses(userId);
  return data?.classes.some((c) => c.id === classId) ?? false;
}

export async function teacherHasSubject(staffId: string, subjectId: string) {
  const link = await prisma.staffSubject.findUnique({
    where: { staffId_subjectId: { staffId, subjectId } },
  });
  return !!link;
}

export async function getTeacherAccessibleGradeLevels(userId: string) {
  const data = await getTeacherClasses(userId);
  if (!data) return [];

  const levels = new Set(data.classes.map((c) => c.gradeLevel));
  return [...levels].sort((a, b) => a - b);
}

export async function getStudentsInGradeLevel(branchId: string, gradeLevel: number) {
  return prisma.student.findMany({
    where: {
      branchId,
      isActive: true,
      gradeLevel,
    },
    include: {
      class: { select: { name: true } },
      user: { select: { email: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getStudentsInClass(branchId: string, classId: string) {
  return prisma.student.findMany({
    where: {
      branchId,
      classId,
      isActive: true,
    },
    include: {
      class: { select: { name: true } },
      user: { select: { email: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function teacherCanAccessGradeLevel(
  userId: string,
  gradeLevel: number
): Promise<boolean> {
  const levels = await getTeacherAccessibleGradeLevels(userId);
  return levels.includes(gradeLevel);
}

export async function getStudentsForTeacherSubject(
  branchId: string,
  subjectId: string,
  classId?: string,
  options?: { light?: boolean }
) {
  const subject = await prisma.subject.findUniqueOrThrow({
    where: { id: subjectId },
    select: { gradeBand: true },
  });

  let gradeLevel: number | undefined;
  if (classId) {
    const klass = await prisma.class.findUnique({
      where: { id: classId },
      select: { gradeLevel: true },
    });
    gradeLevel = klass?.gradeLevel;
  }

  return prisma.student.findMany({
    where: {
      branchId,
      isActive: true,
      gradeBand: subject.gradeBand,
      ...(gradeLevel !== undefined ? { gradeLevel } : {}),
    },
    include: {
      class: { select: { name: true } },
      ...(options?.light
        ? {}
        : {
            grades: {
              where: { assessment: { subjectId } },
              include: { assessment: true },
            },
          }),
    },
    orderBy: [{ gradeLevel: "asc" }, { lastName: "asc" }],
  });
}

export async function getClassesForTeacher(branchId: string, subjectId: string) {
  const subject = await prisma.subject.findUniqueOrThrow({
    where: { id: subjectId },
  });

  const linked = await prisma.class.findMany({
    where: {
      branchId,
      subjects: { some: { subjectId } },
    },
    select: { id: true, name: true, gradeLevel: true },
    orderBy: { gradeLevel: "asc" },
  });

  if (linked.length > 0) return linked;

  return prisma.class.findMany({
    where: { branchId, gradeBand: subject.gradeBand },
    select: { id: true, name: true, gradeLevel: true },
    orderBy: { gradeLevel: "asc" },
  });
}

export async function getBranchAttendance(
  branchId: string,
  date: Date,
  classId?: string
) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const students = await prisma.student.findMany({
    where: {
      branchId,
      isActive: true,
      ...(classId ? { classId } : {}),
    },
    include: {
      class: { select: { name: true } },
      attendance: {
        where: { date: dayStart },
        take: 1,
      },
    },
    orderBy: [{ gradeLevel: "asc" }, { lastName: "asc" }],
  });

  return students.map((s) => ({
    id: s.id,
    studentId: s.studentId,
    name: `${s.firstName} ${s.lastName}`,
    gradeLevel: s.gradeLevel,
    gradeBand: s.gradeBand,
    className: s.class?.name ?? "—",
    status: s.attendance[0]?.status ?? null,
    checkIn: s.attendance[0]?.checkIn ?? null,
  }));
}

export async function getTeacherDashboardStats(staffId: string, branchId: string) {
  const subjectCount = await prisma.staffSubject.count({ where: { staffId } });
  const studentCount = await prisma.student.count({
    where: { branchId, isActive: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const presentToday = await prisma.attendanceRecord.count({
    where: {
      branchId,
      date: today,
      status: "PRESENT",
      studentId: { not: null },
    },
  });

  const assessmentCount = await prisma.assessment.count({
    where: {
      subject: { staffAssignments: { some: { staffId } } },
    },
  });

  return { subjectCount, studentCount, presentToday, assessmentCount };
}

export async function getAllSubjects() {
  return prisma.subject.findMany({
    orderBy: [{ gradeBand: "asc" }, { name: "asc" }],
  });
}

export async function getSubjectNamesByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const subjects = await prisma.subject.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, code: true, gradeBand: true },
  });
  return subjects;
}
