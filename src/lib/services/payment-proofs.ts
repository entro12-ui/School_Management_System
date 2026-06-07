import { PaymentStatus, UserRole, ChapaTransactionStatus } from "@prisma/client";
import {
  PAYMENT_PROOF_STATUS,
  type PaymentProofStatusValue,
} from "@/lib/finance/payment-proof-constants";
import { prisma } from "@/lib/prisma";
import { formatSemesterLabel } from "@/lib/semester-fees";
import { formatGradeLevel } from "@/lib/grade-utils";
import { canManageFinance } from "@/lib/services/finance";

export type PaymentProofRow = {
  id: string;
  paymentId: string;
  amount: number;
  reference: string | null;
  invoiceUrl: string;
  notes: string | null;
  status: PaymentProofStatusValue;
  rejectionReason: string | null;
  createdAt: string;
  studentCode: string;
  studentName: string;
  gradeLabel: string;
  branchName: string;
  semesterLabel: string;
  feeAmount: number;
  feePaid: number;
  feeStatus: PaymentStatus;
  submitterName: string;
};

export async function getPendingPaymentProofs(branchId?: string) {
  const proofs = await prisma.paymentProof.findMany({
    where: {
      status: PAYMENT_PROOF_STATUS.PENDING_REVIEW,
      ...(branchId ? { payment: { branchId } } : {}),
    },
    include: {
      payment: {
        include: {
          student: { include: { branch: { select: { name: true } } } },
          academicYear: { select: { name: true } },
        },
      },
      submittedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return proofs.map((p) => {
    const s = p.payment.student;
    return {
      id: p.id,
      paymentId: p.paymentId,
      amount: Number(p.amount),
      reference: p.reference,
      invoiceUrl: p.invoiceUrl,
      notes: p.notes,
      status: p.status,
      rejectionReason: p.rejectionReason,
      createdAt: p.createdAt.toISOString(),
      studentCode: s.studentId,
      studentName: `${s.firstName} ${s.lastName}`,
      gradeLabel: formatGradeLevel(s.gradeLevel),
      branchName: s.branch.name,
      semesterLabel: `${formatSemesterLabel(p.payment.term)} · ${p.payment.academicYear.name}`,
      feeAmount: Number(p.payment.amount),
      feePaid: Number(p.payment.paidAmount),
      feeStatus: p.payment.status,
      submitterName: `${p.submittedBy.firstName} ${p.submittedBy.lastName}`,
    };
  });
}

export async function getPaymentProofsForStudent(studentId: string) {
  return prisma.paymentProof.findMany({
    where: { payment: { studentId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      paymentId: true,
      amount: true,
      status: true,
      invoiceUrl: true,
      reference: true,
      rejectionReason: true,
      createdAt: true,
      reviewedAt: true,
    },
  });
}

export async function assertCanSubmitForPayment(
  userId: string,
  role: UserRole,
  paymentId: string
): Promise<
  | { ok: true; payment: { id: string; studentId: string; amount: number; paidAmount: number; status: PaymentStatus } }
  | { ok: false; error: string }
> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { student: { select: { userId: true, guardian: { select: { userId: true } } } } },
  });

  if (!payment) return { ok: false, error: "Invoice not found." };
  if (payment.status === PaymentStatus.PAID) {
    return { ok: false, error: "This semester is already fully paid." };
  }

  const isStudent = role === UserRole.STUDENT && payment.student.userId === userId;
  const isParent =
    role === UserRole.PARENT && payment.student.guardian?.userId === userId;

  if (!isStudent && !isParent) {
    return { ok: false, error: "You cannot submit payment for this student." };
  }

  const pending = await prisma.paymentProof.findFirst({
    where: {
      paymentId,
      status: PAYMENT_PROOF_STATUS.PENDING_REVIEW,
    },
  });
  if (pending) {
    return {
      ok: false,
      error: "A payment receipt is already awaiting finance review for this semester.",
    };
  }

  const pendingChapa = await prisma.chapaTransaction.findFirst({
    where: {
      paymentId,
      status: ChapaTransactionStatus.PENDING,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (pendingChapa) {
    return {
      ok: false,
      error:
        "A Chapa checkout is in progress for this semester. Complete it or wait before trying again.",
    };
  }

  return {
    ok: true,
    payment: {
      id: payment.id,
      studentId: payment.studentId,
      amount: Number(payment.amount),
      paidAmount: Number(payment.paidAmount),
      status: payment.status,
    },
  };
}

export function canReviewProofs(role: UserRole) {
  return canManageFinance(role);
}
