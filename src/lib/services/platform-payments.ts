import {
  PlatformPaymentStatus,
  SchoolSignupStatus,
} from "@prisma/client";
import { verifyChapaTransaction } from "@/lib/chapa/client";
import { prisma } from "@/lib/prisma";
import {
  calculatePlatformSubscriptionAmount,
  formatPlatformAmount,
  PLATFORM_STUDENT_PRICE_ETB,
} from "@/lib/platform/billing";
import { provisionOrganizationFromPayment } from "@/lib/services/platform-provisioning";

export async function finalizePlatformChapaTransaction(txRef: string) {
  const payment = await prisma.platformPayment.findUnique({
    where: { txRef },
    include: { signupRequest: true },
  });

  if (!payment) return null;

  if (payment.status === PlatformPaymentStatus.SUCCESS) {
    return {
      ok: true as const,
      alreadyProcessed: true,
      message: "Platform subscription payment was already recorded.",
      signupRequestId: payment.signupRequestId,
      accountSetupPath: `/register/school/account/${payment.signupRequestId}`,
    };
  }

  const verified = await verifyChapaTransaction(txRef);
  if (!verified.ok) {
    await prisma.platformPayment.update({
      where: { id: payment.id },
      data: { status: PlatformPaymentStatus.FAILED },
    });
    return { ok: false as const, error: verified.error };
  }

  if (verified.status !== "success") {
    await prisma.platformPayment.update({
      where: { id: payment.id },
      data: { status: PlatformPaymentStatus.FAILED },
    });
    return { ok: false as const, error: "Payment was not completed on Chapa." };
  }

  const expected = Number(payment.amount);
  if (Math.abs(verified.amount - expected) > 0.01) {
    return {
      ok: false as const,
      error: `Payment amount mismatch. Expected ${expected} ETB.`,
    };
  }

  let organizationResult: Awaited<ReturnType<typeof provisionOrganizationFromPayment>> | null =
    null;

  await prisma.$transaction(async (tx) => {
    await tx.platformPayment.update({
      where: { id: payment.id },
      data: {
        status: PlatformPaymentStatus.SUCCESS,
        chapaReference: verified.chapaRefId,
        paidAt: new Date(),
      },
    });

    if (
      payment.signupRequest.status !== SchoolSignupStatus.PROVISIONED &&
      payment.signupRequest.status !== SchoolSignupStatus.PAID
    ) {
      organizationResult = await provisionOrganizationFromPayment(payment.signupRequestId, tx);
      await tx.platformPayment.update({
        where: { id: payment.id },
        data: { organizationId: organizationResult.organizationId },
      });
    } else if (payment.signupRequest.organizationId) {
      await tx.platformPayment.update({
        where: { id: payment.id },
        data: { organizationId: payment.signupRequest.organizationId },
      });
    }
  }, { maxWait: 10_000, timeout: 30_000 });

  return {
    ok: true as const,
    alreadyProcessed: false,
    message: "Payment confirmed. Create your super admin account to finish setup.",
    signupRequestId: payment.signupRequestId,
    accountSetupPath: `/register/school/account/${payment.signupRequestId}`,
    organization: organizationResult,
  };
}

export function buildPlatformTxRef(signupRequestId: string) {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `edusync-platform-${signupRequestId.slice(-8)}-${suffix}`;
}

export async function createPlatformPaymentRecord(signupRequestId: string) {
  const signup = await prisma.schoolSignupRequest.findUnique({
    where: { id: signupRequestId },
  });
  if (!signup) return { ok: false as const, error: "Application not found." };
  if (signup.status === SchoolSignupStatus.REJECTED) {
    return { ok: false as const, error: "This application was rejected." };
  }
  if (signup.status === SchoolSignupStatus.PROVISIONED) {
    return { ok: false as const, error: "This school is already active." };
  }
  if (signup.status === SchoolSignupStatus.PAID) {
    return {
      ok: false as const,
      error: "Payment received. Finish setting up your super admin account.",
    };
  }
  if (signup.status !== SchoolSignupStatus.APPROVED) {
    return {
      ok: false as const,
      error: "This application is still awaiting platform review.",
    };
  }

  const pending = await prisma.platformPayment.findFirst({
    where: {
      signupRequestId,
      status: PlatformPaymentStatus.PENDING,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (pending) {
    return { ok: true as const, payment: pending, reused: true as const };
  }

  const amount = calculatePlatformSubscriptionAmount(signup.estimatedStudents);
  const payment = await prisma.platformPayment.create({
    data: {
      signupRequestId,
      txRef: buildPlatformTxRef(signupRequestId),
      amount,
      studentCount: signup.estimatedStudents,
      pricePerStudent: PLATFORM_STUDENT_PRICE_ETB,
      status: PlatformPaymentStatus.PENDING,
    },
  });

  return { ok: true as const, payment, reused: false as const };
}

export function platformPaymentSummary(studentCount: number) {
  const amount = calculatePlatformSubscriptionAmount(studentCount);
  return {
    studentCount,
    pricePerStudent: PLATFORM_STUDENT_PRICE_ETB,
    totalAmount: amount,
    formattedAmount: formatPlatformAmount(amount),
  };
}
