import {
  AcademicTerm,
  ChapaTransactionStatus,
  FeePaymentChannel,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  openNextSemesterIfEligible,
  resolvePaymentStatus,
} from "@/lib/semester-fees";

export async function applyOnlinePaymentAmount(input: {
  paymentId: string;
  amount: number;
  reference?: string | null;
  channel?: FeePaymentChannel;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
  });

  if (!payment) {
    return { ok: false as const, error: "Payment not found." };
  }

  if (payment.status === PaymentStatus.PAID) {
    return { ok: true as const, alreadyPaid: true, message: "Already fully paid." };
  }

  const total = Number(payment.amount);
  const newPaid = Math.min(total, Number(payment.paidAmount) + input.amount);
  const status = resolvePaymentStatus(total, newPaid, payment.dueDate);
  const fullyPaid = status === PaymentStatus.PAID;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      paidAmount: newPaid,
      status,
      paidAt: fullyPaid ? new Date() : payment.paidAt,
      paidChannel: FeePaymentChannel.ONLINE,
      reference: input.reference?.trim() || payment.reference,
    },
  });

  if (fullyPaid && payment.term === AcademicTerm.SEMESTER_1) {
    await openNextSemesterIfEligible(payment.studentId);
  }

  return {
    ok: true as const,
    alreadyPaid: false,
    fullyPaid,
    paidAmount: newPaid,
    message: fullyPaid
      ? "Payment confirmed — semester marked fully paid."
      : `Payment confirmed (${newPaid.toLocaleString()} ETB recorded).`,
  };
}

export async function finalizeChapaTransaction(txRef: string) {
  const transaction = await prisma.chapaTransaction.findUnique({
    where: { txRef },
    include: { payment: true },
  });

  if (!transaction) {
    return { ok: false as const, error: "Payment session not found." };
  }

  if (transaction.status === ChapaTransactionStatus.SUCCESS) {
    return {
      ok: true as const,
      alreadyProcessed: true,
      message: "This payment was already recorded.",
      paymentId: transaction.paymentId,
    };
  }

  const { verifyChapaTransaction } = await import("@/lib/chapa/client");
  const verified = await verifyChapaTransaction(txRef);

  if (!verified.ok) {
    return { ok: false as const, error: verified.error };
  }

  if (verified.status !== "success") {
    await prisma.chapaTransaction.update({
      where: { id: transaction.id },
      data: {
        status: ChapaTransactionStatus.FAILED,
        chapaRefId: verified.chapaRefId,
        completedAt: new Date(),
      },
    });
    return { ok: false as const, error: "Payment was not successful on Chapa." };
  }

  const expectedAmount = Number(transaction.amount);
  if (Math.abs(verified.amount - expectedAmount) > 0.01) {
    return {
      ok: false as const,
      error: "Paid amount does not match the invoice amount.",
    };
  }

  const settled = await applyOnlinePaymentAmount({
    paymentId: transaction.paymentId,
    amount: verified.amount,
    reference: verified.chapaRefId ?? txRef,
    channel: FeePaymentChannel.ONLINE,
  });

  if (!settled.ok) {
    return settled;
  }

  await prisma.chapaTransaction.update({
    where: { id: transaction.id },
    data: {
      status: ChapaTransactionStatus.SUCCESS,
      chapaRefId: verified.chapaRefId,
      completedAt: new Date(),
    },
  });

  return {
    ok: true as const,
    alreadyProcessed: settled.alreadyPaid,
    message: settled.message,
    paymentId: transaction.paymentId,
  };
}
