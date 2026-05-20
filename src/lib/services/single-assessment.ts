import { prisma } from "@/lib/prisma";

export type SavedSingleAssessmentGrade = {
  studentId: string;
  studentCode: string;
  name: string;
  score: number;
};

export type SavedSingleAssessment = {
  id: string;
  title: string;
  type: string;
  maxScore: number;
  weightMarks: number;
  date: string;
  grades: SavedSingleAssessmentGrade[];
};

/** Standalone assessments (no weighted sheet) for the teacher's subjects. */
export async function getSavedSingleAssessments(
  branchId: string,
  subjectIds: string[]
): Promise<Record<string, SavedSingleAssessment[]>> {
  if (subjectIds.length === 0) return {};

  const rows = await prisma.assessment.findMany({
    where: {
      sheetKey: null,
      subjectId: { in: subjectIds },
      class: { branchId },
    },
    include: {
      grades: {
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { student: { lastName: "asc" } },
      },
    },
    orderBy: { date: "desc" },
  });

  const byKey: Record<string, SavedSingleAssessment[]> = {};

  for (const a of rows) {
    const key = `${a.subjectId}:${a.classId}`;
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push({
      id: a.id,
      title: a.title,
      type: a.type,
      maxScore: a.maxScore,
      weightMarks: a.weightPercent ?? a.weight * 100,
      date: a.date.toISOString(),
      grades: a.grades.map((g) => ({
        studentId: g.student.id,
        studentCode: g.student.studentId,
        name: `${g.student.firstName} ${g.student.lastName}`,
        score: g.score,
      })),
    });
  }

  return byKey;
}
