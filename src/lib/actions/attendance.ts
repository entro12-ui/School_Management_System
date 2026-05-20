"use server";

import { AttendanceStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  getSchoolWeekDays,
  getWeekStart,
  parseDateKey,
  toDateKey,
} from "@/lib/attendance-utils";
import { prisma } from "@/lib/prisma";
import { getTeacherByUserId } from "@/lib/services/teacher";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

export type WeeklyAttendanceEntry = {
  studentId: string;
  date: string;
  present: boolean;
};

const UPDATE_CHUNK = 40;

export async function saveWeeklyAttendance(
  classId: string,
  weekStartIso: string,
  entries: WeeklyAttendanceEntry[]
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.TEACHER) {
    return { success: false, error: "Unauthorized" };
  }

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) return { success: false, error: "Teacher profile not found." };

  const klass = await prisma.class.findFirst({
    where: { id: classId, branchId: teacher.branchId },
  });
  if (!klass) return { success: false, error: "Invalid class." };

  if (entries.length === 0) {
    return { success: false, error: "No attendance data to save." };
  }

  const weekStart = getWeekStart(parseDateKey(weekStartIso));
  const weekStartKey = toDateKey(weekStart);

  const weekEntries = entries.filter((entry) => {
    const date = parseDateKey(entry.date);
    const weekOfEntry = getWeekStart(date);
    return toDateKey(weekOfEntry) === weekStartKey;
  });

  if (weekEntries.length === 0) {
    return { success: false, error: "No attendance data for this week." };
  }

  const students = await prisma.student.findMany({
    where: {
      branchId: teacher.branchId,
      classId,
      isActive: true,
    },
    select: { id: true },
  });
  const validStudentIds = new Set(students.map((s) => s.id));

  const normalized = weekEntries.filter((e) => validStudentIds.has(e.studentId));
  if (normalized.length === 0) {
    return { success: false, error: "No valid students in this class." };
  }

  const days = getSchoolWeekDays(weekStart);
  const rangeStart = parseDateKey(days[0].key);
  const rangeEnd = parseDateKey(days[days.length - 1].key);
  const studentIds = [...new Set(normalized.map((e) => e.studentId))];

  const existing = await prisma.attendanceRecord.findMany({
    where: {
      branchId: teacher.branchId,
      studentId: { in: studentIds },
      date: { gte: rangeStart, lte: rangeEnd },
    },
  });

  const existingByKey = new Map<string, (typeof existing)[number]>();
  for (const record of existing) {
    if (!record.studentId) continue;
    const key = `${record.studentId}:${toDateKey(record.date)}`;
    if (!existingByKey.has(key)) existingByKey.set(key, record);
  }

  const toCreate: {
    branchId: string;
    classId: string;
    studentId: string;
    date: Date;
    status: AttendanceStatus;
    method: string;
  }[] = [];
  const updatesById = new Map<string, AttendanceStatus>();
  const pendingCreates = new Map<string, (typeof toCreate)[number]>();

  for (const entry of normalized) {
    const date = parseDateKey(entry.date);
    const status = entry.present
      ? AttendanceStatus.PRESENT
      : AttendanceStatus.ABSENT;
    const key = `${entry.studentId}:${toDateKey(date)}`;
    const found = existingByKey.get(key);

    if (found) {
      updatesById.set(found.id, status);
    } else {
      pendingCreates.set(key, {
        branchId: teacher.branchId,
        classId,
        studentId: entry.studentId,
        date,
        status,
        method: "weekly_sheet",
      });
    }
  }

  toCreate.push(...pendingCreates.values());
  const toUpdate = [...updatesById.entries()].map(([id, status]) => ({
    id,
    status,
  }));

  if (toCreate.length > 0) {
    await prisma.attendanceRecord.createMany({ data: toCreate });
  }

  for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK) {
    const chunk = toUpdate.slice(i, i + UPDATE_CHUNK);
    await Promise.all(
      chunk.map(({ id, status }) =>
        prisma.attendanceRecord.update({
          where: { id },
          data: {
            status,
            classId,
            method: "weekly_sheet",
          },
        })
      )
    );
  }

  revalidatePath("/teacher/attendance");
  return {
    success: true,
    message: `Saved attendance for ${normalized.length} entries.`,
  };
}
