"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { registerHrManager } from "@/lib/actions/registration";
import type { ActionResult } from "@/lib/actions/registration";

type Branch = { id: string; name: string; city: string };

const initialState: ActionResult = { success: false, error: "" };

export function HrManagerApplyForm({ branches }: { branches: Branch[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => registerHrManager(formData),
    initialState
  );

  useEffect(() => {
    if (state.success) router.push("/register/success?type=hr-manager");
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

      {!state.success && state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Submitting…" : "Submit HR Manager application"}
      </Button>
    </form>
  );
}
