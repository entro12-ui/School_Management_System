import { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getSchoolWeekDays,
  parseDateKey,
  presentFromStatus,
  toDateKey,
} from "@/lib/attendance-utils";

export { presentFromStatus };

export async function getWeeklyAttendanceSheet(
  branchId: string,
  classId: string,
  weekStart: Date
) {
  const days = getSchoolWeekDays(weekStart);
  const dayKeys = days.map((d) => d.key);
  const rangeStart = parseDateKey(days[0].key);
  const rangeEnd = parseDateKey(days[days.length - 1].key);

  const students = await prisma.student.findMany({
    where: { branchId, classId, isActive: true },
    include: { class: { select: { name: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const records = await prisma.attendanceRecord.findMany({
    where: {
      branchId,
      classId,
      studentId: { in: students.map((s) => s.id) },
      date: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
  });

  const grid: Record<string, Record<string, AttendanceStatus | null>> = {};
  for (const s of students) {
    grid[s.id] = {};
    for (const key of dayKeys) {
      grid[s.id][key] = null;
    }
  }

  for (const r of records) {
    if (!r.studentId) continue;
    const key = toDateKey(r.date);
    if (grid[r.studentId]) {
      grid[r.studentId][key] = r.status;
    }
  }

  const klass = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, name: true, gradeLevel: true, gradeBand: true },
  });

  return {
    class: klass,
    students: students.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      name: `${s.firstName} ${s.lastName}`,
      gradeLevel: s.gradeLevel,
    })),
    days,
    grid,
  };
}
