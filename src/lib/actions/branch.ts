"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { assertSuperAdminCanAccessBranch } from "@/lib/auth/super-admin-scope";
import { prisma } from "@/lib/prisma";
export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

async function assertCanManageBranchClass(branchId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Unauthorized" };

  if (session.user.role === UserRole.SUPER_ADMIN) {
    const access = await assertSuperAdminCanAccessBranch(session.user, branchId);
    if (!access.ok) return { ok: false as const, error: access.error };
    return { ok: true as const, session };
  }

  if (session.user.role === UserRole.BRANCH_ADMIN && session.user.branchId === branchId) {
    return { ok: true as const, session };
  }

  return { ok: false as const, error: "You cannot manage classes for this branch." };
}

export async function assignClassHomeroom(
  classId: string,
  teacherStaffId: string
): Promise<ActionResult> {
  const klass = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, branchId: true, name: true, academicYearId: true },
  });

  if (!klass) return { success: false, error: "Class not found." };

  const access = await assertCanManageBranchClass(klass.branchId);
  if (!access.ok) return { success: false, error: access.error };

  if (!teacherStaffId) {
    await prisma.classTeacher.updateMany({
      where: { classId, isPrimary: true },
      data: { isPrimary: false },
    });
    revalidatePath("/branch/classes");
    return { success: true, message: `Homeroom cleared for ${klass.name}.` };
  }

  const teacher = await prisma.staffProfile.findFirst({
    where: {
      id: teacherStaffId,
      branchId: klass.branchId,
      user: {
        role: UserRole.TEACHER,
        isActive: true,
      },
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (!teacher) {
    return {
      success: false,
      error: "Select a registered teacher enrolled at this branch.",
    };
  }

  const alreadyHomeroomElsewhere = await prisma.classTeacher.findFirst({
    where: {
      teacherId: teacherStaffId,
      isPrimary: true,
      classId: { not: classId },
      class: {
        branchId: klass.branchId,
        academicYearId: klass.academicYearId,
      },
    },
    include: { class: { select: { name: true } } },
  });

  if (alreadyHomeroomElsewhere) {
    return {
      success: false,
      error: `${teacher.user.firstName} ${teacher.user.lastName} is already homeroom for ${alreadyHomeroomElsewhere.class.name}. One teacher per class — enroll more teachers or pick another.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.classTeacher.updateMany({
      where: { classId },
      data: { isPrimary: false },
    });

    await tx.classTeacher.upsert({
      where: {
        classId_teacherId: { classId, teacherId: teacherStaffId },
      },
      create: {
        classId,
        teacherId: teacherStaffId,
        isPrimary: true,
      },
      update: {
        isPrimary: true,
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      branchId: klass.branchId,
      actorId: access.session.user.id,
      action: "ASSIGN_HOMEROOM",
      entity: "Class",
      entityId: classId,
      metadata: { className: klass.name, teacherStaffId },
    },
  });

  revalidatePath("/branch/classes");
  revalidatePath("/teacher/classes");

  return {
    success: true,
    message: `${teacher.user.firstName} ${teacher.user.lastName} is now homeroom for ${klass.name}.`,
  };
}
