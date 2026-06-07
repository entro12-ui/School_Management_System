"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { createSchoolBranch, type ActionResult } from "@/lib/actions/organization";

const initialState: ActionResult = { success: false, error: "" };

export function CreateBranchForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => createSchoolBranch(formData),
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Add a branch / campus</h2>
        <p className="text-sm text-slate-500">
          Create additional campuses under your school organization.
        </p>
      </div>

      <Field label="Branch name *">
        <Input name="name" required placeholder="e.g. Bole Campus" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Branch code *">
          <Input name="code" required placeholder="e.g. BFA-BOLE" className="uppercase" />
        </Field>
        <Field label="City *">
          <Input name="city" required />
        </Field>
      </div>

      <Field label="Address">
        <Input name="address" />
      </Field>

      <Field label="Phone">
        <Input name="phone" type="tel" />
      </Field>

      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      )}
      {!state.success && state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create branch"}
      </Button>
    </form>
  );
}
