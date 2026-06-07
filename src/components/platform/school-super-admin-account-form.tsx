"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  confirmPaymentForAccountSetup,
  createSchoolSuperAdminAccount,
  type SchoolAccountActionResult,
} from "@/lib/actions/school-account";

type AccountContext = {
  id: string;
  schoolName: string;
  contactEmail: string;
  contactFirstName: string;
  contactLastName: string;
  status: string;
  hasPaid: boolean;
  hasAccount: boolean;
};

const initialState: SchoolAccountActionResult = { success: false, error: "" };

export function SchoolSuperAdminAccountForm({ signup }: { signup: AccountContext }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txRef = searchParams.get("chapa_tx");
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [confirmingPayment, startConfirmPayment] = useTransition();
  const [state, formAction, pending] = useActionState(
    async (_prev: SchoolAccountActionResult, formData: FormData) =>
      createSchoolSuperAdminAccount(formData),
    initialState
  );

  useEffect(() => {
    if (!txRef) return;

    startConfirmPayment(async () => {
      const result = await confirmPaymentForAccountSetup(txRef);
      if (!result.ok) {
        setPaymentError(result.error);
        return;
      }
      setPaymentMessage(result.message);
      setPaymentConfirmed(true);
      router.replace(`/register/school/account/${signup.id}`);
      router.refresh();
    });
  }, [txRef, signup.id, router]);

  const registeredEmail = state.success ? state.email : undefined;

  useEffect(() => {
    if (registeredEmail) {
      router.push(`/login?registered=${encodeURIComponent(registeredEmail)}`);
    }
  }, [registeredEmail, router]);

  if (signup.hasAccount || signup.status === "PROVISIONED") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        Your super admin account is ready.{" "}
        <Link href="/login" className="font-medium underline">
          Sign in
        </Link>{" "}
        to manage {signup.schoolName}.
      </div>
    );
  }

  if (txRef && confirmingPayment) {
    return (
      <p className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        Confirming your subscription payment…
      </p>
    );
  }

  if (paymentError) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{paymentError}</p>
    );
  }

  const canCreateAccount =
    paymentConfirmed ||
    signup.status === "PAID" ||
    (signup.hasPaid && signup.status !== "PROVISIONED");

  if (!canCreateAccount) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Payment is required before you can create your super admin account.{" "}
        <Link href={`/register/school/pay/${signup.id}`} className="font-medium underline">
          Go to payment page
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentMessage && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {paymentMessage}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Create super admin account</h2>
        <p className="mt-2 text-sm text-slate-600">
          Payment for <strong>{signup.schoolName}</strong> is complete. Set the password for your
          school super admin login.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="signupRequestId" value={signup.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input value={signup.contactFirstName} readOnly disabled />
            </Field>
            <Field label="Last name">
              <Input value={signup.contactLastName} readOnly disabled />
            </Field>
          </div>

          <Field label="Login email">
            <Input value={signup.contactEmail} readOnly disabled />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password *">
              <PasswordInput name="password" minLength={8} required autoComplete="new-password" />
            </Field>
            <Field label="Confirm password *">
              <PasswordInput
                name="confirmPassword"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </Field>
          </div>

          {!state.success && state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account…" : "Create super admin account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
