import { AcademicTerm, PaymentStatus, UserRole } from "@prisma/client";
import { formatGradeLevel } from "@/lib/grade-utils";
import { prisma } from "@/lib/prisma";
import {
  formatSemesterLabel,
  SEMESTER_ORDER,
} from "@/lib/semester-fees";

export type SemesterPaymentCell = {
  paymentId: string | null;
  term: AcademicTerm;
  label: string;
  amount: number;
  paidAmount: number;
  status: PaymentStatus | "LOCKED" | "NOT_INVOICED";
  dueDate: string | null;
  paidAt: string | null;
  reference: string | null;
  locked: boolean;
};

export type StudentPaymentRow = {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  gradeLabel: string;
  className: string;
  branchName: string;
  semesters: SemesterPaymentCell[];
  allPaid: boolean;
  canAdvance: boolean;
};

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export async function getFinancePaymentsSheet(branchId?: string) {
  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      branch: { select: { name: true } },
      class: { select: { name: true } },
      payments: {
        where: branchId
          ? {
              academicYear: { branchId, isCurrent: true },
            }
          : {
              academicYear: { isCurrent: true },
            },
        orderBy: { term: "asc" },
      },
    },
    orderBy: [{ gradeLevel: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
  });

  const rows: StudentPaymentRow[] = students.map((s) => {
    const yearPayments = s.payments;
    const sem1Payment = yearPayments.find((p) => p.term === AcademicTerm.SEMESTER_1);
    const sem1Paid = sem1Payment?.status === PaymentStatus.PAID;

    const semesters: SemesterPaymentCell[] = SEMESTER_ORDER.map((term) => {
      const payment = yearPayments.find((p) => p.term === term);
      const prevPaid = term === AcademicTerm.SEMESTER_1 ? true : sem1Paid;

      if (!payment) {
        return {
          paymentId: null,
          term,
          label: formatSemesterLabel(term),
          amount: 0,
          paidAmount: 0,
          status: (prevPaid ? "NOT_INVOICED" : "LOCKED") as SemesterPaymentCell["status"],
          dueDate: null,
          paidAt: null,
          reference: null,
          locked: !prevPaid,
        };
      }

      return {
        paymentId: payment.id,
        term,
        label: formatSemesterLabel(term),
        amount: Number(payment.amount),
        paidAmount: Number(payment.paidAmount),
        status: payment.status,
        dueDate: toIso(payment.dueDate),
        paidAt: toIso(payment.paidAt),
        reference: payment.reference,
        locked: !prevPaid,
      };
    });

    const sem1 = semesters.find((x) => x.term === AcademicTerm.SEMESTER_1);
    const sem2 = semesters.find((x) => x.term === AcademicTerm.SEMESTER_2);
    const sem1Ok = sem1?.status === PaymentStatus.PAID;
    const sem2Ok =
      sem2?.status === PaymentStatus.PAID ||
      sem2?.status === "NOT_INVOICED" ||
      sem2?.status === "LOCKED";

    return {
      studentId: s.id,
      studentCode: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      gradeLabel: formatGradeLevel(s.gradeLevel),
      className: s.class?.name ?? "Unassigned",
      branchName: s.branch.name,
      semesters,
      allPaid: sem1Ok && sem2Ok,
      canAdvance: sem1Ok && sem2?.status === "NOT_INVOICED",
    };
  });

  return rows;
}

export async function getFinanceDashboardStats(branchId?: string) {
  const where = branchId ? { branchId } : {};

  const [students, paid, pending, partial] = await Promise.all([
    prisma.student.count({ where: { ...where, isActive: true } }),
    prisma.payment.count({ where: { ...where, status: PaymentStatus.PAID } }),
    prisma.payment.count({
      where: { ...where, status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] } },
    }),
    prisma.payment.count({ where: { ...where, status: PaymentStatus.PARTIAL } }),
  ]);

  const outstanding = await prisma.payment.findMany({
    where: {
      ...where,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
    },
    select: { amount: true, paidAmount: true },
  });

  const totalOutstanding = outstanding.reduce(
    (sum, p) => sum + Number(p.amount) - Number(p.paidAmount),
    0
  );

  return { students, paid, pending, partial, totalOutstanding };
}

export async function getFeeStructures(branchId?: string) {
  return prisma.feeStructure.findMany({
    where: branchId ? { branchId } : {},
    include: { branch: { select: { name: true } } },
    orderBy: [{ branchId: "asc" }, { gradeBand: "asc" }, { term: "asc" }],
  });
}

export function canManageFinance(role: UserRole): boolean {
  return (
    role === UserRole.FINANCE_OFFICER ||
    role === UserRole.BRANCH_ADMIN ||
    role === UserRole.SUPER_ADMIN
  );
}
