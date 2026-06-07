"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { registerSchoolSignup, type ActionResult } from "@/lib/actions/school-signup";
import { PLATFORM_STUDENT_PRICE_ETB } from "@/lib/platform/billing";

const initialState: ActionResult<{ id: string }> = { success: false, error: "" };

export function SchoolSignupForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult<{ id: string }>, formData: FormData) =>
      registerSchoolSignup(formData),
    initialState
  );

  const signupId = state.success ? state.data?.id : undefined;

  useEffect(() => {
    if (signupId) {
      router.push(`/register/school/submitted?id=${signupId}`);
    }
  }, [signupId, router]);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="School name *">
        <Input name="schoolName" required placeholder="e.g. Bright Future Academy" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City *">
          <Input name="city" required />
        </Field>
        <Field label="Phone">
          <Input name="phone" type="tel" />
        </Field>
      </div>

      <Field label="Address">
        <Input name="address" />
      </Field>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Subscription is billed at{" "}
        <strong className="text-slate-900">{PLATFORM_STUDENT_PRICE_ETB} ETB per student</strong>{" "}
        after our team approves your application. You will create your super admin account after
        payment.
      </div>

      <Field label="Estimated active students *">
        <Input
          name="estimatedStudents"
          type="number"
          min={1}
          required
          placeholder="e.g. 250"
        />
      </Field>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Primary contact (school owner)
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name *">
          <Input name="contactFirstName" required />
        </Field>
        <Field label="Last name *">
          <Input name="contactLastName" required />
        </Field>
      </div>

      <Field label="Contact email *">
        <Input name="contactEmail" type="email" required />
      </Field>

      {!state.success && state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Submitting…" : "Apply for EduSync SMS"}
      </Button>
    </form>
  );
}
