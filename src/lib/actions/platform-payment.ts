"use server";

import { revalidatePath } from "next/cache";
import {
  buildChapaCallbackUrl,
  buildChapaReturnUrl,
  initializeChapaTransaction,
} from "@/lib/chapa/client";
import { isChapaConfigured } from "@/lib/chapa/config";
import {
  chapaPlatformPaymentDescription,
  chapaPlatformPaymentTitle,
} from "@/lib/chapa/errors";
import { resolveChapaPhone } from "@/lib/chapa/phone";
import { formatPlatformAmount } from "@/lib/platform/billing";
import { prisma } from "@/lib/prisma";
import {
  createPlatformPaymentRecord,
  finalizePlatformChapaTransaction,
  platformPaymentSummary,
} from "@/lib/services/platform-payments";

export type PlatformPaymentActionResult =
  | { success: true; checkoutUrl: string; txRef: string; amount: string }
  | { success: false; error: string };

/** Public: start Chapa checkout for an approved school signup. */
export async function startSchoolSignupPayment(
  signupRequestId: string
): Promise<PlatformPaymentActionResult> {
  if (!isChapaConfigured()) {
    return {
      success: false,
      error: "Online payments are not configured yet. Contact support to complete activation.",
    };
  }

  const record = await createPlatformPaymentRecord(signupRequestId);
  if (!record.ok) return { success: false, error: record.error };

  const signup = await prisma.schoolSignupRequest.findUniqueOrThrow({
    where: { id: signupRequestId },
  });

  const summary = platformPaymentSummary(signup.estimatedStudents);
  const returnPath = `/register/school/account/${signupRequestId}`;
  const email = signup.contactEmail.trim().toLowerCase();

  const init = await initializeChapaTransaction({
    amount: record.payment.amount.toString(),
    email,
    first_name: signup.contactFirstName,
    last_name: signup.contactLastName,
    phone_number: resolveChapaPhone(signup.phone),
    tx_ref: record.payment.txRef,
    callback_url: buildChapaCallbackUrl(),
    return_url: buildChapaReturnUrl(returnPath, record.payment.txRef),
    customization: {
      title: chapaPlatformPaymentTitle(),
      description: chapaPlatformPaymentDescription(
        summary.studentCount,
        summary.pricePerStudent
      ),
    },
    meta: {
      type: "platform_subscription",
      signupRequestId,
    },
  });

  if (!init.ok) {
    if (init.error.includes("valid email")) {
      return {
        success: false,
        error:
          "The contact email on this application is not valid for Chapa. Update it to a standard address like name@gmail.com and try again.",
      };
    }
    return { success: false, error: init.error };
  }

  return {
    success: true,
    checkoutUrl: init.checkoutUrl,
    txRef: record.payment.txRef,
    amount: formatPlatformAmount(summary.totalAmount),
  };
}

export async function confirmSchoolSignupPayment(txRef: string) {
  const result = await finalizePlatformChapaTransaction(txRef);
  if (!result) {
    return { ok: false as const, error: "Payment session not found." };
  }
  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/platform");
  revalidatePath("/platform/schools");
  revalidatePath("/platform/organizations");
  revalidatePath("/register/school");
  revalidatePath(`/register/school/account/${result.signupRequestId}`);

  return {
    ok: true as const,
    message: result.message,
    alreadyProcessed: result.alreadyProcessed ?? false,
    signupRequestId: result.signupRequestId,
    accountSetupPath: result.accountSetupPath,
  };
}
