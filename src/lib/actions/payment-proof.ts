"use server";

import {
  AcademicTerm,
  FeePaymentChannel,
  PaymentStatus,
  UserRole,
} from "@prisma/client";
import { PAYMENT_PROOF_STATUS } from "@/lib/finance/payment-proof-constants";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  openNextSemesterIfEligible,
  resolvePaymentStatus,
} from "@/lib/semester-fees";
import {
  assertCanSubmitForPayment,
  canReviewProofs,
} from "@/lib/services/payment-proofs";
import { canManageFinance } from "@/lib/services/finance";
import { savePaymentInvoice } from "@/lib/upload-payment-invoice";
import {
  rejectPaymentProofSchema,
  submitPaymentProofSchema,
} from "@/lib/validations/payment-proof";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

function revalidatePaymentPaths() {
  revalidatePath("/finance");
  revalidatePath("/finance/payments");
  revalidatePath("/finance/receipts");
  revalidatePath("/parent/fees");
  revalidatePath("/student/fees");
}

export async function submitOnlinePaymentProof(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sign in required." };

  const role = session.user.role;
  if (role !== UserRole.STUDENT && role !== UserRole.PARENT) {
    return { success: false, error: "Only students or parents can upload payment receipts." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = submitPaymentProofSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const gate = await assertCanSubmitForPayment(
    session.user.id,
    role,
    parsed.data.paymentId
  );
  if (!gate.ok) return { success: false, error: gate.error };

  const file = formData.get("invoice");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Upload your bank receipt or payment screenshot." };
  }

  const remaining = gate.payment.amount - gate.payment.paidAmount;
  if (parsed.data.amount > remaining + 0.01) {
    return {
      success: false,
      error: `Amount cannot exceed outstanding balance (${remaining.toLocaleString()} ETB).`,
    };
  }

  try {
    const invoiceUrl = await savePaymentInvoice(parsed.data.paymentId, file);

    await prisma.paymentProof.create({
      data: {
        paymentId: parsed.data.paymentId,
        submittedById: session.user.id,
        amount: parsed.data.amount,
        channel: FeePaymentChannel.ONLINE,
        reference: parsed.data.reference?.trim() || null,
        notes: parsed.data.notes?.trim() || null,
        invoiceUrl,
      },
    });

    revalidatePaymentPaths();
    return {
      success: true,
      message:
        "Payment receipt submitted. Finance will review your invoice and confirm online payment.",
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not upload invoice.",
    };
  }
}

export async function approveOnlinePaymentProof(
  proofId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !canReviewProofs(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const proof = await prisma.paymentProof.findUnique({
    where: { id: proofId },
    include: { payment: true },
  });

  if (!proof || proof.status !== PAYMENT_PROOF_STATUS.PENDING_REVIEW) {
    return { success: false, error: "Receipt not found or already processed." };
  }

  if (
    session.user.role !== UserRole.SUPER_ADMIN &&
    session.user.branchId !== proof.payment.branchId
  ) {
    return { success: false, error: "You cannot approve receipts for another branch." };
  }

  const payment = proof.payment;
  const total = Number(payment.amount);
  const newPaid = Math.min(total, Number(payment.paidAmount) + Number(proof.amount));
  const status = resolvePaymentStatus(total, newPaid, payment.dueDate);
  const fullyPaid = status === PaymentStatus.PAID;

  await prisma.$transaction(async (tx) => {
    await tx.paymentProof.update({
      where: { id: proofId },
      data: {
        status: PAYMENT_PROOF_STATUS.APPROVED,
        reviewedById: session.user!.id,
        reviewedAt: new Date(),
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        paidAmount: newPaid,
        status,
        paidAt: fullyPaid ? new Date() : payment.paidAt,
        paidChannel: fullyPaid
          ? FeePaymentChannel.ONLINE
          : payment.paidChannel,
        reference: proof.reference?.trim() || payment.reference,
      },
    });
  });

  if (fullyPaid && payment.term === AcademicTerm.SEMESTER_1) {
    await openNextSemesterIfEligible(payment.studentId);
  }

  revalidatePaymentPaths();
  return {
    success: true,
    message: fullyPaid
      ? "Online payment approved — semester marked fully paid."
      : `Online payment approved (${newPaid.toLocaleString()} ETB recorded).`,
  };
}

export async function rejectOnlinePaymentProof(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !canReviewProofs(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = rejectPaymentProofSchema.safeParse({
    proofId: formData.get("proofId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const proof = await prisma.paymentProof.findUnique({
    where: { id: parsed.data.proofId },
    include: { payment: true },
  });

  if (!proof || proof.status !== PAYMENT_PROOF_STATUS.PENDING_REVIEW) {
    return { success: false, error: "Receipt not found or already processed." };
  }

  if (
    session.user.role !== UserRole.SUPER_ADMIN &&
    session.user.branchId !== proof.payment.branchId
  ) {
    return { success: false, error: "Unauthorized for this branch." };
  }

  await prisma.paymentProof.update({
    where: { id: proof.id },
    data: {
      status: PAYMENT_PROOF_STATUS.REJECTED,
      rejectionReason: parsed.data.reason.trim(),
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  revalidatePaymentPaths();
  return { success: true, message: "Receipt rejected. Parent/student can upload again." };
}

export async function markSemesterPaidCash(paymentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { success: false, error: "Payment not found." };

  if (
    session.user.role !== UserRole.SUPER_ADMIN &&
    session.user.branchId !== payment.branchId
  ) {
    return { success: false, error: "Unauthorized for this branch." };
  }

  const total = Number(payment.amount);

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      paidAmount: total,
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      paidChannel: FeePaymentChannel.CASH,
    },
  });

  if (payment.term === AcademicTerm.SEMESTER_1) {
    await openNextSemesterIfEligible(payment.studentId);
  }

  revalidatePaymentPaths();
  return { success: true, message: "Marked as fully paid (cash at office)." };
}
