import {
  AcademicTerm,
  GradeBand,
  PaymentStatus,
  type Prisma,
  type Student,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Tuition is billed every 5 months (one semester). */
export const SEMESTER_DURATION_MONTHS = 5;

export const SEMESTER_ORDER: AcademicTerm[] = [
  AcademicTerm.SEMESTER_1,
  AcademicTerm.SEMESTER_2,
];

export function formatSemesterLabel(term: AcademicTerm): string {
  if (term === AcademicTerm.SEMESTER_1) return "Semester 1";
  if (term === AcademicTerm.SEMESTER_2) return "Semester 2";
  return term.replace(/_/g, " ");
}

export function previousSemester(term: AcademicTerm): AcademicTerm | null {
  if (term === AcademicTerm.SEMESTER_2) return AcademicTerm.SEMESTER_1;
  return null;
}

export function semesterDueDate(yearStart: Date, term: AcademicTerm): Date {
  const due = new Date(yearStart);
  if (term === AcademicTerm.SEMESTER_2) {
    due.setMonth(due.getMonth() + SEMESTER_DURATION_MONTHS);
  }
  return due;
}

export function resolvePaymentStatus(
  amount: number,
  paidAmount: number,
  dueDate?: Date | null
): PaymentStatus {
  if (paidAmount >= amount) return PaymentStatus.PAID;
  if (paidAmount > 0) return PaymentStatus.PARTIAL;
  if (dueDate && dueDate < new Date()) return PaymentStatus.OVERDUE;
  return PaymentStatus.PENDING;
}

export async function getCurrentAcademicYear(branchId: string) {
  return prisma.academicYear.findFirst({
    where: { branchId, isCurrent: true },
    orderBy: { startDate: "desc" },
  });
}

export async function resolveSemesterFee(
  student: Pick<Student, "branchId" | "gradeBand" | "gradeLevel" | "stream">,
  term: AcademicTerm
) {
  let fee = await prisma.feeStructure.findFirst({
    where: {
      branchId: student.branchId,
      isActive: true,
      gradeBand: student.gradeBand,
      gradeLevel: null,
      term,
    },
  });

  if (!fee) {
    fee = await prisma.feeStructure.findFirst({
      where: {
        branchId: student.branchId,
        isActive: true,
        gradeBand: student.gradeBand,
        gradeLevel: student.gradeLevel,
        term,
      },
    });
  }

  if (!fee) {
    fee = await prisma.feeStructure.findFirst({
      where: {
        branchId: student.branchId,
        isActive: true,
        gradeBand: student.gradeBand,
        gradeLevel: null,
        term: null,
      },
    });
  }

  if (fee) return { feeStructureId: fee.id, amount: Number(fee.amount), name: fee.name };

  const defaults: Record<GradeBand, number> = {
    KG: 22500,
    PRIMARY: 28000,
    JUNIOR_HIGH: 32000,
    SENIOR_HIGH: 38000,
  };

  return {
    feeStructureId: null as string | null,
    amount: defaults[student.gradeBand] ?? 30000,
    name: `${formatSemesterLabel(term)} tuition`,
  };
}

export async function isPreviousSemesterPaid(
  studentId: string,
  academicYearId: string,
  term: AcademicTerm
): Promise<boolean> {
  const prev = previousSemester(term);
  if (!prev) return true;

  const payment = await prisma.payment.findUnique({
    where: {
      studentId_academicYearId_term: { studentId, academicYearId, term: prev },
    },
  });

  return payment?.status === PaymentStatus.PAID;
}

export async function ensureSemesterPayment(
  studentId: string,
  term: AcademicTerm,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;

  const student = await db.student.findUniqueOrThrow({
    where: { id: studentId },
  });

  const year =
    (await getCurrentAcademicYear(student.branchId)) ??
    (await db.academicYear.findFirst({
      where: { branchId: student.branchId },
      orderBy: { startDate: "desc" },
    }));

  if (!year) {
    throw new Error("No academic year configured for this branch.");
  }

  const canOpen = await isPreviousSemesterPaid(studentId, year.id, term);
  if (!canOpen) {
    throw new Error(
      `${formatSemesterLabel(term)} cannot be opened until the previous semester is fully paid.`
    );
  }

  const existing = await db.payment.findUnique({
    where: {
      studentId_academicYearId_term: {
        studentId,
        academicYearId: year.id,
        term,
      },
    },
  });

  if (existing) return existing;

  const { feeStructureId, amount, name } = await resolveSemesterFee(student, term);
  const dueDate = semesterDueDate(year.startDate, term);

  return db.payment.create({
    data: {
      branchId: student.branchId,
      studentId,
      academicYearId: year.id,
      term,
      feeStructureId,
      amount,
      paidAmount: 0,
      status: PaymentStatus.PENDING,
      dueDate,
      notes: name,
    },
  });
}

export async function syncSemesterInvoicesForBranch(branchId: string) {
  const year = await getCurrentAcademicYear(branchId);
  if (!year) return { created: 0 };

  const students = await prisma.student.findMany({
    where: { branchId, isActive: true },
    select: {
      id: true,
      branchId: true,
      gradeBand: true,
      gradeLevel: true,
      stream: true,
    },
  });

  if (students.length === 0) return { created: 0 };

  const existing = await prisma.payment.findMany({
    where: {
      branchId,
      academicYearId: year.id,
      term: AcademicTerm.SEMESTER_1,
      studentId: { in: students.map((s) => s.id) },
    },
    select: { studentId: true },
  });
  const invoiced = new Set(existing.map((e) => e.studentId));

  const feeCache = new Map<
    string,
    Awaited<ReturnType<typeof resolveSemesterFee>>
  >();
  const dueDate = semesterDueDate(year.startDate, AcademicTerm.SEMESTER_1);

  const toCreate: {
    branchId: string;
    studentId: string;
    academicYearId: string;
    term: AcademicTerm;
    feeStructureId: string | null;
    amount: number;
    paidAmount: number;
    status: PaymentStatus;
    dueDate: Date;
    notes: string;
  }[] = [];

  for (const student of students) {
    if (invoiced.has(student.id)) continue;

    const feeKey = `${student.gradeBand}:${student.gradeLevel}:${student.stream ?? ""}`;
    if (!feeCache.has(feeKey)) {
      feeCache.set(feeKey, await resolveSemesterFee(student, AcademicTerm.SEMESTER_1));
    }
    const fee = feeCache.get(feeKey)!;

    toCreate.push({
      branchId,
      studentId: student.id,
      academicYearId: year.id,
      term: AcademicTerm.SEMESTER_1,
      feeStructureId: fee.feeStructureId,
      amount: fee.amount,
      paidAmount: 0,
      status: PaymentStatus.PENDING,
      dueDate,
      notes: fee.name,
    });
  }

  if (toCreate.length > 0) {
    await prisma.payment.createMany({ data: toCreate });
  }

  return { created: toCreate.length };
}

export async function openNextSemesterIfEligible(studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  const year = await getCurrentAcademicYear(student.branchId);
  if (!year) return null;

  const sem1 = await prisma.payment.findUnique({
    where: {
      studentId_academicYearId_term: {
        studentId,
        academicYearId: year.id,
        term: AcademicTerm.SEMESTER_1,
      },
    },
  });

  if (sem1?.status !== PaymentStatus.PAID) return null;

  return ensureSemesterPayment(studentId, AcademicTerm.SEMESTER_2);
}
