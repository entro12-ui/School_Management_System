"use server";

import { AcademicTerm, FeePaymentChannel, PaymentStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { assertUserCanAccessBranch } from "@/lib/auth/super-admin-scope";
import { getOrganizationScope } from "@/lib/auth/organization-scope";
import { prisma } from "@/lib/prisma";
import {
  ensureSemesterPayment,
  openNextSemesterIfEligible,
  resolvePaymentStatus,
  syncSemesterInvoicesForBranch,
} from "@/lib/semester-fees";
import { canManageFinance } from "@/lib/services/finance";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

const recordPaymentSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  reference: z.string().max(80).optional(),
});

function revalidateFinance() {
  revalidatePath("/finance");
  revalidatePath("/finance/payments");
  revalidatePath("/finance/receipts");
  revalidatePath("/parent/fees");
  revalidatePath("/student/fees");
}

export async function syncBranchSemesterInvoices(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  let totalCreated = 0;

  if (session.user.role === UserRole.SUPER_ADMIN && !session.user.branchId) {
    const organizationId = getOrganizationScope(session.user);
    if (!organizationId) {
      return { success: false, error: "Your account is not linked to a school organization." };
    }
    const branches = await prisma.branch.findMany({
      where: { isActive: true, organizationId },
      select: { id: true },
    });
    for (const b of branches) {
      const { created } = await syncSemesterInvoicesForBranch(b.id);
      totalCreated += created;
    }
  } else {
    const branchId = session.user.branchId;
    if (!branchId) {
      return { success: false, error: "No branch assigned." };
    }
    const { created } = await syncSemesterInvoicesForBranch(branchId);
    totalCreated = created;
  }

  const created = totalCreated;
  revalidateFinance();
  return {
    success: true,
    message:
      created > 0
        ? `Created ${created} Semester 1 invoice(s) for registered students.`
        : "All active students already have Semester 1 invoices.",
  };
}

export async function recordSemesterPayment(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = recordPaymentSchema.safeParse({
    paymentId: formData.get("paymentId"),
    amount: formData.get("amount"),
    reference: formData.get("reference") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { paymentId, amount, reference } = parsed.data;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { student: true },
  });

  if (!payment) return { success: false, error: "Payment record not found." };

  const access = await assertUserCanAccessBranch(session.user, payment.branchId);
  if (!access.ok) return { success: false, error: access.error };

  const total = Number(payment.amount);
  const newPaid = Math.min(total, Number(payment.paidAmount) + amount);
  const status = resolvePaymentStatus(total, newPaid, payment.dueDate);
  const fullyPaid = status === PaymentStatus.PAID;

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      paidAmount: newPaid,
      status,
      paidAt: fullyPaid ? new Date() : payment.paidAt,
      paidChannel: fullyPaid ? FeePaymentChannel.CASH : payment.paidChannel,
      reference: reference?.trim() || payment.reference,
    },
  });

  if (fullyPaid && payment.term === AcademicTerm.SEMESTER_1) {
    await openNextSemesterIfEligible(payment.studentId);
  }

  revalidateFinance();
  return {
    success: true,
    message: fullyPaid
      ? "Semester marked as fully paid. Next semester invoice opened when applicable."
      : `Payment recorded (${newPaid.toLocaleString()} ETB of ${total.toLocaleString()} ETB).`,
  };
}

export async function markSemesterFullyPaid(paymentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { success: false, error: "Payment not found." };

  const access = await assertUserCanAccessBranch(session.user, payment.branchId);
  if (!access.ok) return { success: false, error: access.error };

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

  revalidateFinance();
  return { success: true, message: "Semester tuition marked as fully paid (cash)." };
}

export async function createSemesterInvoice(
  studentId: string,
  term: AcademicTerm
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await ensureSemesterPayment(studentId, term);
    revalidateFinance();
    return { success: true, message: "Semester invoice created." };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not create invoice.",
    };
  }
}
