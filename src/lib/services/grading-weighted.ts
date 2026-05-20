import { AssessmentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildSheetKey,
  computeWeightedTotal,
  type StudentWeightedRow,
  type WeightComponent,
} from "@/lib/grading-weighted";

export async function getWeightedGradingSheet(
  staffId: string,
  branchId: string,
  subjectId: string,
  classId: string
) {
  const sheetKey = buildSheetKey(staffId, subjectId, classId);

  const subject = await prisma.subject.findUniqueOrThrow({
    where: { id: subjectId },
  });

  const klass = await prisma.class.findFirst({
    where: { id: classId, branchId },
    select: { gradeLevel: true, name: true },
  });

  const assessments = await prisma.assessment.findMany({
    where: { sheetKey, subjectId, classId },
    orderBy: { sortOrder: "asc" },
    include: {
      grades: true,
    },
  });

  const components: WeightComponent[] = assessments.map((a) => ({
    id: a.id,
    assessmentId: a.id,
    label: a.title,
    weightMarks: a.weightPercent ?? a.weight * 100,
    maxScore: a.maxScore,
  }));

  const students = await prisma.student.findMany({
    where: {
      branchId,
      isActive: true,
      gradeBand: subject.gradeBand,
      ...(klass ? { gradeLevel: klass.gradeLevel } : {}),
    },
    include: { class: { select: { name: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const rows: StudentWeightedRow[] = students.map((s) => {
    const scores: Record<string, number | null> = {};
    for (const a of assessments) {
      const g = a.grades.find((gr) => gr.studentId === s.id);
      scores[a.id] = g ? g.score : null;
    }
    const cmpForCalc = components.map((c) => ({
      ...c,
      id: c.assessmentId ?? c.id,
    }));
    return {
      studentId: s.id,
      studentCode: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.class?.name ?? "—",
      scores,
      weightedTotal: computeWeightedTotal(cmpForCalc, scores),
    };
  });

  return {
    sheetKey,
    className: klass?.name ?? "—",
    components,
    rows,
  };
}

export function assessmentTypeForLabel(label: string): AssessmentType {
  const lower = label.toLowerCase();
  if (lower.includes("quiz")) return AssessmentType.QUIZ;
  if (lower.includes("mid")) return AssessmentType.MIDTERM;
  if (lower.includes("final")) return AssessmentType.FINAL;
  if (lower.includes("continuous")) return AssessmentType.CONTINUOUS;
  return AssessmentType.QUIZ;
}
