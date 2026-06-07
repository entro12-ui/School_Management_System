"use server";

import { ChapaTransactionStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { assertUserCanAccessBranch } from "@/lib/auth/super-admin-scope";
import { formatChapaAmount } from "@/lib/chapa/amount";
import {
  buildChapaCallbackUrl,
  buildChapaReturnUrl,
  buildChapaTxRef,
  initializeChapaTransaction,
} from "@/lib/chapa/client";
import { isChapaConfigured, getChapaPublicKey } from "@/lib/chapa/config";
import { chapaPaymentDescription, chapaPaymentTitle } from "@/lib/chapa/errors";
import { resolveChapaPhone } from "@/lib/chapa/phone";
import { PAYMENT_PROOF_STATUS } from "@/lib/finance/payment-proof-constants";
import { prisma } from "@/lib/prisma";
import { finalizeChapaTransaction } from "@/lib/services/payment-settlement";
import { assertCanSubmitForPayment } from "@/lib/services/payment-proofs";
import { canManageFinance } from "@/lib/services/finance";

export type ChapaPaymentSession = {
  txRef: string;
  amount: string;
  publicKey: string;
  callbackUrl: string;
  returnPath: string;
  mobile: string;
};

export type ChapaActionResult =
  | { success: true; session: ChapaPaymentSession }
  | { success: true; checkoutUrl: string }
  | { success: true; message: string; alreadyProcessed?: boolean }
  | { success: false; error: string };

function revalidatePaymentPaths() {
  revalidatePath("/finance");
  revalidatePath("/finance/payments");
  revalidatePath("/finance/receipts");
  revalidatePath("/finance/chapa");
  revalidatePath("/parent/fees");
  revalidatePath("/student/fees");
}

async function loadPayableInvoice(paymentId: string, userId: string, role: UserRole) {
  const gate = await assertCanSubmitForPayment(userId, role, paymentId);
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const pendingChapa = await prisma.chapaTransaction.findFirst({
    where: {
      paymentId,
      status: ChapaTransactionStatus.PENDING,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (pendingChapa) {
    return {
      ok: false as const,
      error:
        "A Chapa checkout is already in progress for this invoice. Finish or wait an hour and try again.",
    };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      student: { select: { firstName: true, lastName: true } },
      academicYear: { select: { name: true } },
      feeStructure: { select: { name: true } },
    },
  });
  if (!payment) return { ok: false as const, error: "Invoice not found." };

  const outstanding = Math.max(0, Number(payment.amount) - Number(payment.paidAmount));
  if (outstanding <= 0) {
    return { ok: false as const, error: "Nothing is outstanding on this invoice." };
  }

  const pendingProof = await prisma.paymentProof.findFirst({
    where: {
      paymentId,
      status: PAYMENT_PROOF_STATUS.PENDING_REVIEW,
    },
  });
  if (pendingProof) {
    return {
      ok: false as const,
      error: "A payment receipt is already awaiting finance review for this semester.",
    };
  }

  return { ok: true as const, payment, outstanding };
}

export async function prepareChapaPayment(input: {
  paymentId: string;
  returnPath: string;
}): Promise<ChapaActionResult> {
  const publicKey = getChapaPublicKey();
  if (!isChapaConfigured() || !publicKey) {
    return {
      success: false,
      error: "Online card payments are not configured yet. Upload a receipt or pay at the office.",
    };
  }

  const session = await auth();
  if (!session?.user) return { success: false, error: "Sign in required." };

  const role = session.user.role;
  if (role !== UserRole.STUDENT && role !== UserRole.PARENT) {
    return { success: false, error: "Only students or parents can pay fees online." };
  }

  const invoice = await loadPayableInvoice(input.paymentId, session.user.id, role);
  if (!invoice.ok) return { success: false, error: invoice.error };

  const payer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });

  const txRef = buildChapaTxRef(input.paymentId);
  const amount = formatChapaAmount(invoice.outstanding);
  const mobile = resolveChapaPhone(payer?.phone);

  await prisma.chapaTransaction.create({
    data: {
      paymentId: input.paymentId,
      txRef,
      amount: invoice.outstanding,
      initiatedById: session.user.id,
    },
  });

  return {
    success: true,
    session: {
      txRef,
      amount,
      publicKey,
      callbackUrl: buildChapaCallbackUrl(),
      returnPath: input.returnPath,
      mobile,
    },
  };
}

export async function startChapaCardCheckout(input: {
  paymentId: string;
  returnPath: string;
}): Promise<ChapaActionResult> {
  if (!isChapaConfigured()) {
    return {
      success: false,
      error: "Online card payments are not configured yet. Upload a receipt or pay at the office.",
    };
  }

  const session = await auth();
  if (!session?.user) return { success: false, error: "Sign in required." };

  const role = session.user.role;
  if (role !== UserRole.STUDENT && role !== UserRole.PARENT) {
    return { success: false, error: "Only students or parents can pay fees online." };
  }

  const invoice = await loadPayableInvoice(input.paymentId, session.user.id, role);
  if (!invoice.ok) return { success: false, error: invoice.error };

  const { payment, outstanding } = invoice;
  const txRef = buildChapaTxRef(input.paymentId);
  const returnUrl = buildChapaReturnUrl(input.returnPath, txRef);
  const callbackUrl = buildChapaCallbackUrl();
  const feeLabel = payment.feeStructure?.name ?? `${payment.term} · ${payment.academicYear.name}`;

  const payer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, firstName: true, lastName: true, phone: true },
  });

  const initialized = await initializeChapaTransaction({
    amount: formatChapaAmount(outstanding),
    email: payer?.email ?? session.user.email ?? "payments@edusync.et",
    first_name: payer?.firstName ?? payment.student.firstName,
    last_name: payer?.lastName ?? payment.student.lastName,
    phone_number: resolveChapaPhone(payer?.phone),
    tx_ref: txRef,
    callback_url: callbackUrl,
    return_url: returnUrl,
    customization: {
      title: chapaPaymentTitle(),
      description: chapaPaymentDescription(feeLabel),
    },
  });

  if (!initialized.ok) {
    return { success: false, error: initialized.error };
  }

  await prisma.chapaTransaction.create({
    data: {
      paymentId: input.paymentId,
      txRef,
      amount: outstanding,
      initiatedById: session.user.id,
    },
  });

  return { success: true, checkoutUrl: initialized.checkoutUrl };
}

export async function confirmChapaPayment(txRef: string): Promise<ChapaActionResult> {
  if (!txRef.trim()) {
    return { success: false, error: "Missing payment reference." };
  }

  const session = await auth();
  if (!session?.user) return { success: false, error: "Sign in required." };

  const transaction = await prisma.chapaTransaction.findUnique({
    where: { txRef },
    include: {
      payment: {
        include: {
          student: { select: { userId: true, guardian: { select: { userId: true } } } },
        },
      },
    },
  });

  if (!transaction) {
    return { success: false, error: "Payment session not found." };
  }

  const role = session.user.role;
  const isStudent =
    role === UserRole.STUDENT && transaction.payment.student.userId === session.user.id;
  const isParent =
    role === UserRole.PARENT &&
    transaction.payment.student.guardian?.userId === session.user.id;
  const isFinanceStaff = canManageFinance(role);

  if (!isStudent && !isParent && !isFinanceStaff) {
    return { success: false, error: "You cannot confirm this payment." };
  }

  const result = await finalizeChapaTransaction(txRef);
  if (!result.ok) {
    return { success: false, error: result.error };
  }

  revalidatePaymentPaths();
  return {
    success: true,
    message: result.message,
    alreadyProcessed: result.alreadyProcessed,
  };
}

export async function cancelPendingChapaPayment(paymentId: string): Promise<ChapaActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sign in required." };

  const role = session.user.role;
  if (role !== UserRole.STUDENT && role !== UserRole.PARENT) {
    return { success: false, error: "Only students or parents can cancel a fee checkout." };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      student: { select: { userId: true, guardian: { select: { userId: true } } } },
    },
  });
  if (!payment) return { success: false, error: "Invoice not found." };

  const isStudent = role === UserRole.STUDENT && payment.student.userId === session.user.id;
  const isParent =
    role === UserRole.PARENT && payment.student.guardian?.userId === session.user.id;
  if (!isStudent && !isParent) {
    return { success: false, error: "You cannot cancel this checkout." };
  }

  const cancelled = await prisma.chapaTransaction.updateMany({
    where: {
      paymentId,
      status: ChapaTransactionStatus.PENDING,
    },
    data: {
      status: ChapaTransactionStatus.FAILED,
      completedAt: new Date(),
    },
  });

  if (cancelled.count === 0) {
    return { success: false, error: "No in-progress Chapa checkout found for this invoice." };
  }

  revalidatePaymentPaths();
  return {
    success: true,
    message: "Checkout cancelled. You can start a new Chapa payment.",
  };
}

export async function reverifyChapaTransactionForFinance(txRef: string): Promise<ChapaActionResult> {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const transaction = await prisma.chapaTransaction.findUnique({
    where: { txRef },
    include: { payment: { select: { branchId: true } } },
  });
  if (!transaction) {
    return { success: false, error: "Transaction not found." };
  }

  const access = await assertUserCanAccessBranch(session.user, transaction.payment.branchId);
  if (!access.ok) return { success: false, error: access.error };

  const result = await finalizeChapaTransaction(txRef);
  if (!result.ok) {
    return { success: false, error: result.error };
  }

  revalidatePaymentPaths();
  revalidatePath("/finance/chapa");
  return {
    success: true,
    message: result.alreadyProcessed
      ? `Already recorded. Invoice reference: ${transaction.chapaRefId ?? txRef}.`
      : result.message,
  };
}
