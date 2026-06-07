import { ChapaTransactionStatus, PaymentProofStatus } from "@prisma/client";

export type FeeTransactionLine = {
  id: string;
  kind: "chapa" | "bank_receipt" | "cash";
  label: string;
  amount: number;
  reference: string | null;
  status: string;
  recordedAt: string | null;
};

export type FeePaymentReceipt = {
  paymentId: string;
  feeName: string;
  amount: number;
  paidAmount: number;
  status: string;
  paidAt: string | null;
  reference: string | null;
  paidChannel: string | null;
  transactions: FeeTransactionLine[];
};

type PaymentWithRelations = {
  id: string;
  amount: unknown;
  paidAmount: unknown;
  status: string;
  paidAt: Date | null;
  reference: string | null;
  paidChannel: string | null;
  chapaTransactions: {
    id: string;
    txRef: string;
    chapaRefId: string | null;
    amount: unknown;
    status: ChapaTransactionStatus;
    completedAt: Date | null;
    createdAt: Date;
  }[];
  proofs: {
    id: string;
    amount: unknown;
    reference: string | null;
    status: PaymentProofStatus;
    reviewedAt: Date | null;
    createdAt: Date;
  }[];
};

export function buildFeePaymentReceipt(
  payment: PaymentWithRelations,
  feeName: string
): FeePaymentReceipt {
  const transactions: FeeTransactionLine[] = [];

  for (const chapa of payment.chapaTransactions) {
    transactions.push({
      id: chapa.id,
      kind: "chapa",
      label: "Chapa online payment",
      amount: Number(chapa.amount),
      reference: chapa.chapaRefId ?? chapa.txRef,
      status: chapa.status,
      recordedAt: (chapa.completedAt ?? chapa.createdAt).toISOString(),
    });
  }

  for (const proof of payment.proofs) {
    transactions.push({
      id: proof.id,
      kind: "bank_receipt",
      label: "Bank receipt (finance approved)",
      amount: Number(proof.amount),
      reference: proof.reference,
      status: proof.status,
      recordedAt: (proof.reviewedAt ?? proof.createdAt).toISOString(),
    });
  }

  if (
    payment.paidChannel === "CASH" &&
    payment.status === "PAID" &&
    !transactions.some((t) => t.kind === "chapa" || t.kind === "bank_receipt")
  ) {
    transactions.push({
      id: `${payment.id}-cash`,
      kind: "cash",
      label: "Cash at finance office",
      amount: Number(payment.paidAmount),
      reference: payment.reference,
      status: "PAID",
      recordedAt: payment.paidAt?.toISOString() ?? null,
    });
  }

  transactions.sort((a, b) => {
    const at = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
    const bt = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
    return bt - at;
  });

  return {
    paymentId: payment.id,
    feeName,
    amount: Number(payment.amount),
    paidAmount: Number(payment.paidAmount),
    status: payment.status,
    paidAt: payment.paidAt?.toISOString() ?? null,
    reference: payment.reference,
    paidChannel: payment.paidChannel,
    transactions,
  };
}
