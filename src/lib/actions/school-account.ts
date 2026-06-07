"use server";

import { revalidatePath } from "next/cache";
import { confirmSchoolSignupPayment } from "@/lib/actions/platform-payment";
import { completeSchoolSuperAdminAccount } from "@/lib/services/platform-provisioning";
import { schoolSuperAdminAccountSchema } from "@/lib/validations/school-account";

export type SchoolAccountActionResult =
  | { success: true; message: string; email: string }
  | { success: false; error: string };

export async function createSchoolSuperAdminAccount(
  formData: FormData
): Promise<SchoolAccountActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schoolSuperAdminAccountSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  try {
    const result = await completeSchoolSuperAdminAccount({
      signupRequestId: parsed.data.signupRequestId,
      password: parsed.data.password,
    });

    revalidatePath("/platform");
    revalidatePath("/platform/schools");
    revalidatePath("/platform/organizations");
    revalidatePath(`/register/school/account/${parsed.data.signupRequestId}`);

    return {
      success: true,
      message: "Super admin account created. You can sign in and manage your school.",
      email: result.email,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not create account.",
    };
  }
}

export async function confirmPaymentForAccountSetup(txRef: string) {
  return confirmSchoolSignupPayment(txRef);
}
