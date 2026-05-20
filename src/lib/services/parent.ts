import { prisma } from "@/lib/prisma";
import { formatGradeLevel } from "@/lib/grade-utils";
import { formatSemesterLabel } from "@/lib/semester-fees";
import {
  computeGpaFromGrades,
  getStudentGpaRecords,
  getStudentGrades,
  showGpaPortal,
} from "@/lib/services/student";

export async function getParentProfileByUserId(userId: string) {
  return prisma.parentProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

export async function getChildrenForParent(parentUserId: string) {
  const parent = await getParentProfileByUserId(parentUserId);
  if (!parent) return { parent: null, children: [] };

  const children = await prisma.student.findMany({
    where: { guardianId: parent.id, isActive: true },
    include: {
      branch: { select: { name: true } },
      class: {
        include: { academicYear: { select: { name: true } } },
      },
    },
    orderBy: [{ gradeLevel: "asc" }, { firstName: "asc" }],
  });

  return {
    parent,
    children: children.map((c) => ({
      id: c.id,
      studentId: c.studentId,
      firstName: c.firstName,
      lastName: c.lastName,
      gradeLevel: c.gradeLevel,
      gradeLabel: formatGradeLevel(c.gradeLevel),
      gradeBand: c.gradeBand,
      className: c.class?.name ?? "Unassigned",
      branchName: c.branch.name,
      academicYear: c.class?.academicYear?.name ?? "—",
    })),
  };
}

export async function getChildForParent(parentUserId: string, studentId: string) {
  const { parent, children } = await getChildrenForParent(parentUserId);
  if (!parent) return null;

  const child = children.find((c) => c.id === studentId);
  if (!child) return null;

  const student = await prisma.student.findFirst({
    where: { id: studentId, guardianId: parent.id, isActive: true },
    include: {
      branch: true,
      class: { include: { academicYear: { select: { name: true } } } },
    },
  });

  if (!student) return null;

  return {
    ...child,
    classId: student.classId,
    stream: student.stream,
    gradeBand: student.gradeBand,
    academicYear: student.class?.academicYear?.name ?? "—",
  };
}

export async function getChildGradesForParent(studentId: string, classId?: string | null) {
  const grades = await getStudentGrades(studentId, classId);
  return grades.map((g) => ({
    id: g.id,
    title: g.assessment.title,
    type: g.assessment.type.replace("_", " "),
    subject: g.assessment.subject.name,
    className: g.assessment.class.name,
    score: g.score,
    maxScore: g.assessment.maxScore,
    percent: Math.round((g.score / g.assessment.maxScore) * 100),
    date: g.assessment.date,
    remarks: g.remarks,
  }));
}

export async function getChildAttendanceForParent(studentId: string, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      date: { gte: since },
    },
    orderBy: { date: "desc" },
    take: 120,
  });

  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const excused = records.filter((r) => r.status === "EXCUSED").length;

  return {
    records: records.map((r) => ({
      id: r.id,
      date: r.date,
      status: r.status,
      checkIn: r.checkIn,
    })),
    summary: { present, absent, late, excused, total: records.length },
  };
}

export async function getChildFeesForParent(studentId: string) {
  const payments = await prisma.payment.findMany({
    where: { studentId },
    include: {
      feeStructure: { select: { name: true } },
      academicYear: { select: { name: true } },
    },
    orderBy: [{ academicYear: { startDate: "desc" } }, { term: "asc" }],
  });

  let totalDue = 0;
  let totalPaid = 0;
  let outstanding = 0;

  for (const p of payments) {
    const amount = Number(p.amount);
    const paid = Number(p.paidAmount);
    totalDue += amount;
    totalPaid += paid;
    if (p.status !== "PAID") {
      outstanding += amount - paid;
    }
  }

  return {
    payments: payments.map((p) => ({
      id: p.id,
      name: `${formatSemesterLabel(p.term)} · ${p.academicYear.name}${
        p.feeStructure?.name ? ` · ${p.feeStructure.name}` : ""
      }`,
      amount: Number(p.amount),
      paidAmount: Number(p.paidAmount),
      status: p.status,
      dueDate: p.dueDate,
      paidAt: p.paidAt,
      scholarship: p.scholarship,
      reference: p.reference,
      term: p.term,
    })),
    totals: { totalDue, totalPaid, outstanding },
  };
}

export async function getChildResultsSummary(studentId: string, gradeBand: string, gradeLevel: number, classId?: string | null) {
  const grades = await getChildGradesForParent(studentId, classId);
  const gpaRecords = await getStudentGpaRecords(studentId);
  const computedGpa = await computeGpaFromGrades(studentId);
  const showGpa = showGpaPortal(gradeBand as import("@prisma/client").GradeBand, gradeLevel);

  return { grades, gpaRecords, computedGpa, showGpa };
}

export async function getParentDashboardStats(childrenIds: string[]) {
  if (childrenIds.length === 0) {
    return { recentGrades: 0, outstanding: 0, absencesThisMonth: 0 };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [recentGrades, payments, absences] = await Promise.all([
    prisma.gradeRecord.count({
      where: {
        studentId: { in: childrenIds },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.payment.findMany({
      where: {
        studentId: { in: childrenIds },
        status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      },
    }),
    prisma.attendanceRecord.count({
      where: {
        studentId: { in: childrenIds },
        status: "ABSENT",
        date: { gte: monthStart },
      },
    }),
  ]);

  const outstanding = payments.reduce(
    (sum, p) => sum + Number(p.amount) - Number(p.paidAmount),
    0
  );

  return { recentGrades, outstanding, absencesThisMonth: absences };
}
