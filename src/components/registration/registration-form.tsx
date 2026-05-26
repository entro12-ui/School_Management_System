"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/registration";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Branch = { id: string; name: string; city: string };

const initialState: ActionResult = { success: false, error: "" };

export function RegistrationForm({
  action,
  branches,
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  branches: Branch[];
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => action(formData),
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.push("/register/success");
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Branch *">
        <Select name="branchId" required defaultValue="">
          <option value="" disabled>
            Select your branch
          </option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} — {b.city}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name *">
          <Input name="firstName" required />
        </Field>
        <Field label="Last name *">
          <Input name="lastName" required />
        </Field>
      </div>

      <Field label="Email *">
        <Input name="email" type="email" required />
      </Field>

      <Field label="Phone">
        <Input name="phone" type="tel" />
      </Field>

      {children}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password *">
          <Input name="password" type="password" minLength={8} required />
        </Field>
        <Field label="Confirm password *">
          <Input name="confirmPassword" type="password" minLength={8} required />
        </Field>
      </div>

      {!state.success && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Submitting…" : "Submit for approval"}
      </Button>
    </form>
  );
}
