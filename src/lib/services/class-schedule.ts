import {
  ClassScheduleDay,
  SeniorStream,
  UserRole,
  type GradeBand,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatGradeLevel, gradeLevelToBand } from "@/lib/grade-utils";

export const CLASS_SCHEDULE_DAYS: ClassScheduleDay[] = [
  ClassScheduleDay.MONDAY,
  ClassScheduleDay.TUESDAY,
  ClassScheduleDay.WEDNESDAY,
  ClassScheduleDay.THURSDAY,
  ClassScheduleDay.FRIDAY,
  ClassScheduleDay.SATURDAY,
];

export const CLASS_SCHEDULE_DAY_LABELS: Record<ClassScheduleDay, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

const DAY_ORDER = new Map(CLASS_SCHEDULE_DAYS.map((day, index) => [day, index]));
const SCHEDULE_GRADE_LEVELS = Array.from({ length: 13 }, (_, index) => index);

function resolveScheduleBranchId(
  role: UserRole,
  userBranchId: string | null | undefined,
  overrideBranchId?: string
): string | undefined {
  if (role === UserRole.SUPER_ADMIN) return overrideBranchId;
  return userBranchId ?? undefined;
}

export async function getSchedulePageBranch(
  role: UserRole,
  userBranchId: string | null | undefined,
  searchBranchId?: string
) {
  const isSuperAdmin = role === UserRole.SUPER_ADMIN;
  let branchId = resolveScheduleBranchId(role, userBranchId, searchBranchId);

  if (isSuperAdmin && !branchId) {
    const first = await prisma.branch.findFirst({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true },
    });
    branchId = first?.id;
  }

  const branches = isSuperAdmin
    ? await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
      })
    : [];

  const branch = branchId
    ? await prisma.branch.findUnique({
        where: { id: branchId },
        select: { id: true, name: true, code: true },
      })
    : null;

  return { branchId, branches, branch, isSuperAdmin };
}

export type ScheduleClassOption = {
  id: string;
  name: string;
  gradeLevel: number;
  gradeBand: GradeBand;
  academicYear: string;
  subjects: { id: string; name: string; code: string }[];
};

export type ScheduleTeacherOption = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string | null;
  isScheduleUnitLeader: boolean;
  subjectIds: string[];
};

export type ClassScheduleEntryRow = {
  id: string;
  classId: string;
  className: string;
  gradeLabel: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  day: ClassScheduleDay;
  dayLabel: string;
  period: number;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  notes: string | null;
};

function sortScheduleEntries<T extends { day: ClassScheduleDay; period: number; className?: string }>(
  entries: T[]
) {
  return entries.sort((a, b) => {
    const dayDiff = (DAY_ORDER.get(a.day) ?? 99) - (DAY_ORDER.get(b.day) ?? 99);
    if (dayDiff !== 0) return dayDiff;
    if (a.period !== b.period) return a.period - b.period;
    return (a.className ?? "").localeCompare(b.className ?? "");
  });
}

function mapEntry(entry: {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: ClassScheduleDay;
  period: number;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  notes: string | null;
  class: { name: string; gradeLevel: number };
  subject: { name: string };
  teacher: { user: { firstName: string; lastName: string } };
}): ClassScheduleEntryRow {
  return {
    id: entry.id,
    classId: entry.classId,
    className: entry.class.name,
    gradeLabel: formatGradeLevel(entry.class.gradeLevel),
    subjectId: entry.subjectId,
    subjectName: entry.subject.name,
    teacherId: entry.teacherId,
    teacherName: `${entry.teacher.user.firstName} ${entry.teacher.user.lastName}`,
    day: entry.day,
    dayLabel: CLASS_SCHEDULE_DAY_LABELS[entry.day],
    period: entry.period,
    startTime: entry.startTime,
    endTime: entry.endTime,
    room: entry.room,
    notes: entry.notes,
  };
}

export async function getClassScheduleSetup(branchId: string) {
  const academicYearId = await ensureKgToGrade12Classes(branchId);

  const [classes, subjects, teachers, entries] = await Promise.all([
    prisma.class.findMany({
      where: {
        branchId,
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: {
        academicYear: { select: { name: true, isCurrent: true } },
        subjects: {
          include: { subject: { select: { id: true, name: true, code: true } } },
          orderBy: { subject: { name: "asc" } },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    }),
    prisma.subject.findMany({
      orderBy: [{ gradeBand: "asc" }, { name: "asc" }],
      select: { id: true, name: true, code: true, gradeBand: true },
    }),
    prisma.staffProfile.findMany({
      where: {
        branchId,
        user: { role: UserRole.TEACHER, isActive: true },
      },
      select: {
        id: true,
        employeeId: true,
        department: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        staffSubjects: { select: { subjectId: true } },
      },
      orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
    }),
    getBranchScheduleEntries(branchId, academicYearId ?? undefined),
  ]);

  const subjectsByBand = new Map<GradeBand, { id: string; name: string; code: string }[]>();
  for (const subject of subjects) {
    const list = subjectsByBand.get(subject.gradeBand) ?? [];
    list.push({ id: subject.id, name: subject.name, code: subject.code });
    subjectsByBand.set(subject.gradeBand, list);
  }

  const classOptions: ScheduleClassOption[] = classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    gradeLevel: cls.gradeLevel,
    gradeBand: cls.gradeBand,
    academicYear: cls.academicYear.name,
    subjects:
      cls.subjects.length > 0
        ? cls.subjects.map((link) => ({
            id: link.subject.id,
            name: link.subject.name,
            code: link.subject.code,
          }))
        : (subjectsByBand.get(cls.gradeBand) ?? []),
  }));

  const teacherOptions: ScheduleTeacherOption[] = teachers.map((teacher) => ({
    id: teacher.id,
    employeeId: teacher.employeeId,
    name: `${teacher.user.firstName} ${teacher.user.lastName}`,
    email: teacher.user.email,
    department: teacher.department,
    isScheduleUnitLeader: false,
    subjectIds: teacher.staffSubjects.map((subject) => subject.subjectId),
  }));

  return { classes: classOptions, teachers: teacherOptions, entries };
}

async function ensureKgToGrade12Classes(branchId: string) {
  const year = await prisma.academicYear.findFirst({
    where: { branchId, isCurrent: true },
    orderBy: { startDate: "desc" },
    select: { id: true },
  });

  if (!year) return null;

  await Promise.all(
    SCHEDULE_GRADE_LEVELS.map(async (gradeLevel) => {
      const existing = await prisma.class.findFirst({
        where: {
          branchId,
          academicYearId: year.id,
          gradeLevel,
        },
        select: { id: true },
      });
      if (existing) return;

      await prisma.class.create({
        data: {
          branchId,
          academicYearId: year.id,
          name: classNameForGrade(gradeLevel),
          gradeLevel,
          gradeBand: gradeLevelToBand(gradeLevel),
          stream: defaultStreamForGrade(gradeLevel),
        },
      });
    })
  );

  return year.id;
}

function classNameForGrade(gradeLevel: number) {
  if (gradeLevel === 0) return "KG-A";
  return `Grade ${gradeLevel}-A`;
}

function defaultStreamForGrade(gradeLevel: number) {
  if (gradeLevel >= 11) return SeniorStream.NATURAL_SCIENCE;
  return null;
}

export async function getBranchScheduleEntries(branchId: string, academicYearId?: string) {
  const entries = await prisma.classScheduleEntry.findMany({
    where: {
      branchId,
      ...(academicYearId ? { class: { academicYearId } } : {}),
    },
    include: {
      class: { select: { name: true, gradeLevel: true } },
      subject: { select: { name: true } },
      teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  return sortScheduleEntries(entries.map(mapEntry));
}

export async function getTeacherSchedule(userId: string) {
  const teacher = await prisma.staffProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      branchId: true,
      branch: { select: { id: true, name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  });
  if (!teacher) return null;

  const entries = await prisma.classScheduleEntry.findMany({
    where: { teacherId: teacher.id },
    include: {
      class: { select: { name: true, gradeLevel: true } },
      subject: { select: { name: true } },
      teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  return {
    teacher: {
      ...teacher,
      isScheduleUnitLeader: false,
    },
    entries: sortScheduleEntries(entries.map(mapEntry)),
  };
}

export async function getStudentClassSchedule(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      branch: { select: { name: true } },
      class: { select: { id: true, name: true, gradeLevel: true } },
    },
  });
  if (!student) return null;

  if (!student.classId || !student.class) {
    return { student, entries: [] as ClassScheduleEntryRow[] };
  }

  const entries = await prisma.classScheduleEntry.findMany({
    where: { classId: student.classId },
    include: {
      class: { select: { name: true, gradeLevel: true } },
      subject: { select: { name: true } },
      teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  return {
    student,
    entries: sortScheduleEntries(entries.map(mapEntry)),
  };
}
