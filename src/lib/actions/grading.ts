"use server";

import { AssessmentType, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherByUserId, teacherHasSubject } from "@/lib/services/teacher";

export type ActionResult =
  | { success: true; message: string; assessmentId?: string }
  | { success: false; error: string };

export async function saveGrades(
  subjectId: string,
  classId: string,
  assessmentTitle: string,
  assessmentType: AssessmentType,
  maxScore: number,
  weightMarks: number,
  grades: { studentId: string; score: number }[]
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.TEACHER) {
    return { success: false, error: "Unauthorized" };
  }

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) return { success: false, error: "Teacher profile not found." };

  const hasSubject = await teacherHasSubject(teacher.id, subjectId);
  if (!hasSubject) {
    return { success: false, error: "You are not assigned to this subject." };
  }

  const klass = await prisma.class.findFirst({
    where: { id: classId, branchId: teacher.branchId },
  });
  if (!klass) return { success: false, error: "Invalid class." };

  if (grades.length === 0) {
    return { success: false, error: "No grades to save." };
  }

  if (weightMarks < 0 || weightMarks > 100) {
    return { success: false, error: "Weight marks must be between 0 and 100." };
  }

  const assessmentId = await prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.create({
      data: {
        classId,
        subjectId,
        title: assessmentTitle,
        type: assessmentType,
        maxScore,
        weightPercent: weightMarks,
        weight: weightMarks / 100,
        sheetKey: null,
      },
    });

    await tx.gradeRecord.createMany({
      data: grades.map((g) => ({
        assessmentId: assessment.id,
        studentId: g.studentId,
        score: Math.min(Math.max(0, g.score), maxScore),
        enteredBy: session.user!.id,
      })),
    });

    return assessment.id;
  });

  revalidatePath("/teacher/grading");
  revalidatePath("/teacher/grading/single");
  revalidatePath("/teacher/reports");
  return {
    success: true,
    message: `Saved “${assessmentTitle}” for ${grades.length} students. See it below under Saved assessments.`,
    assessmentId,
  };
}
