"use server";

import { SchoolSignupStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { canManagePlatform } from "@/lib/auth/organization-scope";
import { sendSchoolPaymentLinkEmail } from "@/lib/mail/school-payment-link";
import { buildSchoolPaymentLink } from "@/lib/mail/send";
import { prisma } from "@/lib/prisma";
import { schoolSignupSchema } from "@/lib/validations/school-signup";

export type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string };

async function emailAvailable(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({ where: { email: normalized } });
  if (existingUser) return false;

  const pending = await prisma.schoolSignupRequest.findFirst({
    where: {
      contactEmail: normalized,
      status: { in: [SchoolSignupStatus.PENDING, SchoolSignupStatus.APPROVED] },
    },
  });
  return !pending;
}

async function notifySchoolPaymentLink(signup: {
  id: string;
  schoolName: string;
  contactEmail: string;
  contactFirstName: string;
  estimatedStudents: number;
}) {
  const mail = await sendSchoolPaymentLinkEmail({
    signupRequestId: signup.id,
    schoolName: signup.schoolName,
    contactEmail: signup.contactEmail,
    contactFirstName: signup.contactFirstName,
    estimatedStudents: signup.estimatedStudents,
  });

  const paymentLink = buildSchoolPaymentLink(signup.id);

  if (!mail.ok) {
    return {
      sent: false as const,
      paymentLink,
      note: `Approved, but email failed: ${mail.error}. Share the payment link manually.`,
    };
  }

  if (mail.sent) {
    return {
      sent: true as const,
      paymentLink,
      note: `Approved and payment link emailed to ${signup.contactEmail}.`,
    };
  }

  return {
    sent: false as const,
    paymentLink,
    note: `Approved. Email not sent — add SMTP or RESEND settings to .env and restart, then click "Email payment link". Link: ${paymentLink}`,
  };
}

/** Public: school applies to join the EduSync SMS platform. */
export async function registerSchoolSignup(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schoolSignupSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const data = parsed.data;
  const available = await emailAvailable(data.contactEmail);
  if (!available) {
    return {
      success: false,
      error: "This email already has a pending application or an active account.",
    };
  }

  const signup = await prisma.schoolSignupRequest.create({
    data: {
      schoolName: data.schoolName,
      city: data.city,
      address: data.address || null,
      phone: data.phone || null,
      contactEmail: data.contactEmail.toLowerCase().trim(),
      contactFirstName: data.contactFirstName,
      contactLastName: data.contactLastName,
      estimatedStudents: data.estimatedStudents,
    },
  });

  revalidatePath("/platform");
  revalidatePath("/platform/schools");

  return {
    success: true,
    message:
      "Application submitted. Our platform team will review it and send payment instructions.",
    data: { id: signup.id },
  };
}

/** Platform owner approves a school signup — unlocks payment. */
export async function approveSchoolSignup(signupRequestId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !canManagePlatform(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const signup = await prisma.schoolSignupRequest.findUnique({
    where: { id: signupRequestId },
  });
  if (!signup || signup.status !== SchoolSignupStatus.PENDING) {
    return { success: false, error: "Application not found or already processed." };
  }

  await prisma.schoolSignupRequest.update({
    where: { id: signupRequestId },
    data: {
      status: SchoolSignupStatus.APPROVED,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
  });

  const notify = await notifySchoolPaymentLink(signup);

  revalidatePath("/platform");
  revalidatePath("/platform/schools");
  revalidatePath(`/register/school/pay/${signupRequestId}`);

  return {
    success: true,
    message: notify.note,
  };
}

/** Platform owner resends the Chapa payment link to the school contact. */
export async function resendSchoolPaymentLink(signupRequestId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !canManagePlatform(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const signup = await prisma.schoolSignupRequest.findUnique({
    where: { id: signupRequestId },
  });
  if (!signup || signup.status !== SchoolSignupStatus.APPROVED) {
    return {
      success: false,
      error: "Payment link can only be sent for approved applications awaiting payment.",
    };
  }

  const notify = await notifySchoolPaymentLink(signup);
  return { success: true, message: notify.note };
}

/** Platform owner rejects a school signup. */
export async function rejectSchoolSignup(
  signupRequestId: string,
  reason: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !canManagePlatform(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }
  if (!reason.trim()) {
    return { success: false, error: "Please provide a rejection reason." };
  }

  const signup = await prisma.schoolSignupRequest.findUnique({
    where: { id: signupRequestId },
  });
  if (!signup || signup.status !== SchoolSignupStatus.PENDING) {
    return { success: false, error: "Application not found or already processed." };
  }

  await prisma.schoolSignupRequest.update({
    where: { id: signupRequestId },
    data: {
      status: SchoolSignupStatus.REJECTED,
      rejectionReason: reason.trim(),
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
  });

  revalidatePath("/platform");
  revalidatePath("/platform/schools");

  return { success: true, message: "Application rejected." };
}
