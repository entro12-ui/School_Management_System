import { ChapaTransactionStatus, PaymentStatus } from "@prisma/client";
import { PAYMENT_PROOF_STATUS } from "@/lib/finance/payment-proof-constants";
import { buildFeePaymentReceipt } from "@/lib/services/fee-receipts";
import { prisma } from "@/lib/prisma";
import { formatSemesterLabel } from "@/lib/semester-fees";

const receiptProofSelect = {
  id: true,
  amount: true,
  reference: true,
  status: true,
  reviewedAt: true,
  createdAt: true,
} as const;

const receiptChapaSelect = {
  id: true,
  txRef: true,
  chapaRefId: true,
  amount: true,
  status: true,
  completedAt: true,
  createdAt: true,
} as const;

function isPendingChapa(
  rows: { status: ChapaTransactionStatus; createdAt: Date }[]
) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return rows.some(
    (row) => row.status === ChapaTransactionStatus.PENDING && row.createdAt >= hourAgo
  );
}

export async function getStudentFees(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!student) return null;

  const payments = await prisma.payment.findMany({
    where: { studentId: student.id },
    include: {
      academicYear: { select: { name: true } },
      feeStructure: { select: { name: true } },
      proofs: { select: receiptProofSelect },
      chapaTransactions: {
        select: receiptChapaSelect,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ academicYear: { startDate: "desc" } }, { term: "asc" }],
  });

  let totalDue = 0;
  let totalPaid = 0;
  let outstanding = 0;

  const rows = payments.map((p) => {
    const amount = Number(p.amount);
    const paidAmount = Number(p.paidAmount);
    const balance = Math.max(0, amount - paidAmount);
    totalDue += amount;
    totalPaid += paidAmount;
    if (p.status !== PaymentStatus.PAID) outstanding += balance;

    const feeName = `${formatSemesterLabel(p.term)} · ${p.academicYear.name}${
      p.feeStructure?.name ? ` · ${p.feeStructure.name}` : ""
    }`;
    const pendingProof = p.proofs.some((proof) => proof.status === PAYMENT_PROOF_STATUS.PENDING_REVIEW);
    const pendingChapa = isPendingChapa(p.chapaTransactions);

    return {
      id: p.id,
      name: feeName,
      amount,
      paidAmount,
      outstanding: balance,
      status: p.status,
      dueDate: p.dueDate?.toISOString() ?? null,
      paidAt: p.paidAt?.toISOString() ?? null,
      paidChannel: p.paidChannel,
      reference: p.reference,
      pendingProof,
      pendingChapa,
      canPayOnline:
        balance > 0 &&
        p.status !== PaymentStatus.PAID &&
        !pendingProof &&
        !pendingChapa,
      receipt: buildFeePaymentReceipt(p, feeName),
    };
  });

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    payments: rows,
    totals: { totalDue, totalPaid, outstanding },
  };
}
