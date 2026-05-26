"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  buildSheetKey,
  TOTAL_WEIGHT_MARKS,
  weightsAreValid,
  type WeightComponent,
} from "@/lib/grading-weighted";
import { prisma } from "@/lib/prisma";
import {
  assessmentTypeForLabel,
  getWeightedGradingSheet,
} from "@/lib/services/grading-weighted";
import { getTeacherByUserId, teacherHasSubject } from "@/lib/services/teacher";

export type SavedSheetPayload = {
  components: WeightComponent[];
  rows: {
    studentId: string;
    scores: Record<string, number | null>;
  }[];
};

export type ActionResult =
  | { success: true; message: string; sheet?: SavedSheetPayload }
  | { success: false; error: string };

const componentSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  weightMarks: z.coerce.number().min(0).max(100),
  maxScore: z.coerce.number().min(1).max(1000),
});

const GRADE_UPSERT_CHUNK = 40;

type GradeRow = {
  assessmentId: string;
  studentId: string;
  score: number;
};

async function persistGradeRows(enteredBy: string, rows: GradeRow[]) {
  if (rows.length === 0) return;

  const assessmentIds = [...new Set(rows.map((r) => r.assessmentId))];
  const existing = await prisma.gradeRecord.findMany({
    where: { assessmentId: { in: assessmentIds } },
    select: { assessmentId: true, studentId: true },
  });

  const existingKeys = new Set(
    existing.map((e) => `${e.assessmentId}:${e.studentId}`)
  );

  const toCreate: {
    assessmentId: string;
    studentId: string;
    score: number;
    enteredBy: string;
  }[] = [];
  const toUpdate: GradeRow[] = [];

  for (const row of rows) {
    const key = `${row.assessmentId}:${row.studentId}`;
    if (existingKeys.has(key)) {
      toUpdate.push(row);
    } else {
      toCreate.push({ ...row, enteredBy });
    }
  }

  if (toCreate.length > 0) {
    await prisma.gradeRecord.createMany({ data: toCreate });
  }

  for (let i = 0; i < toUpdate.length; i += GRADE_UPSERT_CHUNK) {
    const chunk = toUpdate.slice(i, i + GRADE_UPSERT_CHUNK);
    await Promise.all(
      chunk.map((row) =>
        prisma.gradeRecord.update({
          where: {
            assessmentId_studentId: {
              assessmentId: row.assessmentId,
              studentId: row.studentId,
            },
          },
          data: { score: row.score, enteredBy },
        })
      )
    );
  }
}

export async function saveWeightedGradingSheet(input: {
  subjectId: string;
  classId: string;
  components: WeightComponent[];
  scores: Record<string, Record<string, number>>;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.TEACHER) {
    return { success: false, error: "Unauthorized" };
  }

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) return { success: false, error: "Teacher not found." };

  if (!(await teacherHasSubject(teacher.id, input.subjectId))) {
    return { success: false, error: "You are not assigned to this subject." };
  }

  const parsed = z.array(componentSchema).safeParse(input.components);
  if (!parsed.success) {
    return { success: false, error: "Invalid weight components." };
  }

  const components = parsed.data;
  if (components.length === 0) {
    return { success: false, error: "Add at least one assessment column." };
  }

  if (!weightsAreValid(components)) {
    const total = components.reduce((s, c) => s + c.weightMarks, 0);
    return {
      success: false,
      error: `Weights must total ${TOTAL_WEIGHT_MARKS} marks (currently ${Math.round(total)}).`,
    };
  }

  const klass = await prisma.class.findFirst({
    where: { id: input.classId, branchId: teacher.branchId },
  });
  if (!klass) return { success: false, error: "Invalid class." };

  const sheetKey = buildSheetKey(teacher.id, input.subjectId, input.classId);
  const enteredBy = session.user.id;

  const assessments = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.assessment.findMany({
        where: { sheetKey },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((e) => e.id));
      const keepIds = new Set<string>();
      const saved: { id: string; componentId: string; maxScore: number }[] = [];

      for (let i = 0; i < components.length; i++) {
        const c = components[i];
        const isExisting = existingIds.has(c.id);

        const assessment = isExisting
          ? await tx.assessment.update({
              where: { id: c.id },
              data: {
                title: c.label.trim(),
                weightPercent: c.weightMarks,
                weight: c.weightMarks / 100,
                maxScore: c.maxScore,
                sortOrder: i,
                sheetKey,
                type: assessmentTypeForLabel(c.label),
              },
            })
          : await tx.assessment.create({
              data: {
                classId: input.classId,
                subjectId: input.subjectId,
                title: c.label.trim(),
                type: assessmentTypeForLabel(c.label),
                maxScore: c.maxScore,
                weightPercent: c.weightMarks,
                weight: c.weightMarks / 100,
                sheetKey,
                sortOrder: i,
              },
            });

        keepIds.add(assessment.id);
        saved.push({ id: assessment.id, componentId: c.id, maxScore: c.maxScore });
      }

      const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
      if (toDelete.length > 0) {
        await tx.gradeRecord.deleteMany({
          where: { assessmentId: { in: toDelete } },
        });
        await tx.assessment.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      return saved;
    },
    { maxWait: 10_000, timeout: 30_000 }
  );

  const gradeRows: GradeRow[] = [];
  for (const a of assessments) {
    const studentScores =
      input.scores[a.id] ?? input.scores[a.componentId] ?? {};
    for (const [studentId, score] of Object.entries(studentScores)) {
      if (Number.isNaN(score)) continue;
      gradeRows.push({
        assessmentId: a.id,
        studentId,
        score: Math.min(Math.max(0, score), a.maxScore),
      });
    }
  }

  await persistGradeRows(enteredBy, gradeRows);

  revalidatePath("/teacher/grading");
  revalidatePath("/teacher/grading/single");
  revalidatePath("/teacher/reports");
  revalidatePath("/parent/results");

  const sheet = await getWeightedGradingSheet(
    teacher.id,
    teacher.branchId,
    input.subjectId,
    input.classId
  );

  return {
    success: true,
    message: `Saved grades for ${components.length} columns.`,
    sheet: {
      components: sheet.components,
      rows: sheet.rows.map((r) => ({
        studentId: r.studentId,
        scores: r.scores,
      })),
    },
  };
}

export async function loadWeightedGradingSheet(subjectId: string, classId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.TEACHER) {
    return null;
  }
  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) return null;
  return getWeightedGradingSheet(teacher.id, teacher.branchId, subjectId, classId);
}
