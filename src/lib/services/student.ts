import { AssessmentType, GradeBand } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getStudentByUserId(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      branch: true,
      class: {
        include: {
          academicYear: { select: { name: true } },
        },
      },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

export async function getStudentGrades(studentId: string, classId?: string | null) {
  return prisma.gradeRecord.findMany({
    where: {
      studentId,
      ...(classId ? { assessment: { classId } } : {}),
    },
    include: {
      assessment: {
        include: {
          subject: { select: { name: true, code: true } },
          class: { select: { name: true } },
        },
      },
    },
    orderBy: { assessment: { date: "desc" } },
  });
}

export async function getStudentAssignments(studentId: string, classId?: string | null) {
  if (!classId) return [];

  return prisma.assessment.findMany({
    where: {
      classId,
      type: {
        in: [
          AssessmentType.QUIZ,
          AssessmentType.CONTINUOUS,
          AssessmentType.DAILY_REPORT,
          AssessmentType.PLAY_BASED,
        ],
      },
    },
    include: {
      subject: { select: { name: true } },
      grades: {
        where: { studentId },
        select: { score: true, id: true },
      },
    },
    orderBy: { date: "desc" },
    take: 30,
  });
}

export async function getStudentExams(studentId: string, classId?: string | null) {
  if (!classId) return [];

  return prisma.assessment.findMany({
    where: {
      classId,
      type: {
        in: [
          AssessmentType.MIDTERM,
          AssessmentType.FINAL,
          AssessmentType.NATIONAL_PREP,
        ],
      },
    },
    include: {
      subject: { select: { name: true } },
      grades: {
        where: { studentId },
        select: { score: true },
      },
    },
    orderBy: { date: "asc" },
  });
}

export async function getStudentGpaRecords(studentId: string) {
  return prisma.gpaRecord.findMany({
    where: { studentId },
    orderBy: [{ yearLabel: "desc" }, { term: "asc" }],
  });
}

/** Simple GPA from grade records when no GpaRecord rows exist (grades 9–12) */
export async function computeGpaFromGrades(studentId: string) {
  const grades = await prisma.gradeRecord.findMany({
    where: { studentId },
    include: {
      assessment: { select: { maxScore: true, weight: true } },
    },
  });

  if (grades.length === 0) return null;

  let weightedSum = 0;
  let totalWeight = 0;
  for (const g of grades) {
    const pct = (g.score / g.assessment.maxScore) * 100;
    const w = g.assessment.weight || 1;
    weightedSum += pct * w;
    totalWeight += w;
  }

  const average = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return Math.round(average * 25) / 100;
}

export async function getStudentFeeStatus(studentId: string) {
  return prisma.payment.findMany({
    where: { studentId },
    include: { feeStructure: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export function showGpaPortal(gradeBand: GradeBand, gradeLevel: number) {
  return (
    gradeBand === GradeBand.SENIOR_HIGH ||
    gradeBand === GradeBand.JUNIOR_HIGH ||
    gradeLevel >= 9
  );
}
