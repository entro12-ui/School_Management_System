"use server";

import { ClassScheduleDay, Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/actions/enrollment";
import { CLASS_SCHEDULE_DAYS } from "@/lib/services/class-schedule";

const MANAGE_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.REGISTRAR,
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type ScheduleActor =
  | {
      userId: string;
      role: UserRole;
      branchId: string | null;
      canAssignUnitLeader: true;
      unitLeaderStaffId: null;
    }
  | {
      userId: string;
      role: UserRole;
      branchId: string;
      canAssignUnitLeader: false;
      unitLeaderStaffId: string;
    };

async function getScheduleActor(): Promise<ScheduleActor> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (MANAGE_ROLES.includes(session.user.role)) {
    return {
      userId: session.user.id,
      role: session.user.role,
      branchId: session.user.branchId,
      canAssignUnitLeader: true,
      unitLeaderStaffId: null,
    };
  }

  if (session.user.role === UserRole.TEACHER) {
    const staff = await prisma.staffProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, branchId: true, isScheduleUnitLeader: true },
    });
    if (!staff?.isScheduleUnitLeader) {
      throw new Error("Only assigned schedule unit leaders can prepare schedules.");
    }
    return {
      userId: session.user.id,
      role: session.user.role,
      branchId: staff.branchId,
      canAssignUnitLeader: false,
      unitLeaderStaffId: staff.id,
    };
  }

  throw new Error("Unauthorized");
}

function readRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function readOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function readDay(formData: FormData) {
  const day = readRequiredString(formData, "day") as ClassScheduleDay;
  if (!CLASS_SCHEDULE_DAYS.includes(day)) throw new Error("Invalid schedule day.");
  return day;
}

function readPeriod(formData: FormData) {
  const period = Number(readRequiredString(formData, "period"));
  if (!Number.isInteger(period) || period < 1 || period > 12) {
    throw new Error("Period must be between 1 and 12.");
  }
  return period;
}

function readTime(formData: FormData, key: string) {
  const value = readOptionalString(formData, key);
  if (value && !TIME_RE.test(value)) throw new Error(`${key} must be HH:mm.`);
  return value;
}

async function assertBranchAccess(actor: ScheduleActor, branchId: string) {
  if (actor.role !== UserRole.SUPER_ADMIN && actor.branchId !== branchId) {
    throw new Error("You can only manage schedules in your branch.");
  }
}

export async function setScheduleUnitLeader(
  staffId: string,
  enabled: boolean
): Promise<ActionResult> {
  try {
    const actor = await getScheduleActor();
    if (!actor.canAssignUnitLeader) {
      return { success: false, error: "Only registrar or admins can assign unit leaders." };
    }

    const teacher = await prisma.staffProfile.findUnique({
      where: { id: staffId },
      include: { user: { select: { role: true, firstName: true, lastName: true } } },
    });
    if (!teacher || teacher.user.role !== UserRole.TEACHER) {
      return { success: false, error: "Teacher not found." };
    }

    await assertBranchAccess(actor, teacher.branchId);

    await prisma.staffProfile.update({
      where: { id: staffId },
      data: {
        isScheduleUnitLeader: enabled,
        scheduleUnitLeaderAssignedAt: enabled ? new Date() : null,
        scheduleUnitLeaderAssignedById: enabled ? actor.userId : null,
      },
    });

    revalidateSchedulePaths();
    return {
      success: true,
      message: enabled
        ? `${teacher.user.firstName} ${teacher.user.lastName} is now a schedule unit leader.`
        : `${teacher.user.firstName} ${teacher.user.lastName} is no longer a schedule unit leader.`,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Could not save." };
  }
}

export async function createClassScheduleEntry(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await getScheduleActor();
    const classId = readRequiredString(formData, "classId");
    const subjectId = readRequiredString(formData, "subjectId");
    const teacherId = readRequiredString(formData, "teacherId");
    const day = readDay(formData);
    const period = readPeriod(formData);
    const startTime = readTime(formData, "startTime");
    const endTime = readTime(formData, "endTime");
    const room = readOptionalString(formData, "room");
    const notes = readOptionalString(formData, "notes");

    const klass = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, branchId: true, name: true, gradeBand: true },
    });
    if (!klass) return { success: false, error: "Class not found." };
    await assertBranchAccess(actor, klass.branchId);

    const [classSubject, subject, teacher] = await Promise.all([
      prisma.classSubject.findUnique({
        where: { classId_subjectId: { classId, subjectId } },
        include: { subject: { select: { name: true } } },
      }),
      prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true, gradeBand: true },
      }),
      prisma.staffProfile.findUnique({
        where: { id: teacherId },
        include: {
          user: { select: { role: true, firstName: true, lastName: true } },
          staffSubjects: { where: { subjectId }, select: { id: true } },
        },
      }),
    ]);

    if (!subject) return { success: false, error: "Subject not found." };
    if (!classSubject && subject.gradeBand !== klass.gradeBand) {
      return {
        success: false,
        error: "Selected subject does not match this class grade band.",
      };
    }
    if (!teacher || teacher.branchId !== klass.branchId || teacher.user.role !== UserRole.TEACHER) {
      return { success: false, error: "Selected teacher is not valid for this branch." };
    }
    if (teacher.staffSubjects.length === 0) {
      return {
        success: false,
        error: `${teacher.user.firstName} ${teacher.user.lastName} is not assigned to ${subject.name}.`,
      };
    }

    await prisma.$transaction(async (tx) => {
      if (!classSubject) {
        await tx.classSubject.create({
          data: { classId, subjectId },
        });
      }

      await tx.classScheduleEntry.create({
        data: {
          branchId: klass.branchId,
          classId,
          subjectId,
          teacherId,
          day,
          period,
          startTime,
          endTime,
          room,
          notes,
          preparedById: actor.unitLeaderStaffId,
          createdById: actor.userId,
        },
      });
    });

    revalidateSchedulePaths();
    return {
      success: true,
      message: `${subject.name} added to ${klass.name} on ${day.replace(/_/g, " ")} period ${period}.`,
    };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        success: false,
        error:
          "Schedule conflict: that class or teacher already has a lesson in this day and period.",
      };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not create schedule entry.",
    };
  }
}

export async function deleteClassScheduleEntry(entryId: string): Promise<ActionResult> {
  try {
    const actor = await getScheduleActor();
    const entry = await prisma.classScheduleEntry.findUnique({
      where: { id: entryId },
      select: { branchId: true },
    });
    if (!entry) return { success: false, error: "Schedule entry not found." };
    await assertBranchAccess(actor, entry.branchId);

    await prisma.classScheduleEntry.delete({ where: { id: entryId } });
    revalidateSchedulePaths();
    return { success: true, message: "Schedule entry removed." };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not delete schedule entry.",
    };
  }
}

function revalidateSchedulePaths() {
  revalidatePath("/registrar/schedules");
  revalidatePath("/teacher/schedule");
  revalidatePath("/student/schedule");
}
