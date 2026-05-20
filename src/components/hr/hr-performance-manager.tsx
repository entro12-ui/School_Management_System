"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { saveHrPerformanceReview } from "@/lib/actions/hr";
import { HrFeedback } from "./hr-feedback";

export function HrPerformanceManager({
  reviews,
  employees,
  canWrite,
}: {
  reviews: {
    id: string;
    reviewPeriod: string;
    kpiScore: number | null;
    promotionRecommended: boolean;
    employee: { firstName: string; lastName: string; employeeCode: string };
  }[];
  employees: { id: string; label: string }[];
  canWrite: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) setMessage(res.message ?? "Saved");
      else setError(res.error ?? "Failed");
    });
  }

  return (
    <div className="space-y-6">
      <HrFeedback message={message} error={error} />

      {canWrite && (
        <form
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
          action={(fd) => run(() => saveHrPerformanceReview(fd))}
        >
          <Field label="Employee">
            <Select name="employeeId" required>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Review period">
            <Input name="reviewPeriod" required placeholder="2025 Q1" />
          </Field>
          <Field label="KPI score">
            <Input name="kpiScore" type="number" min={0} max={100} />
          </Field>
          <Field label="Feedback">
            <Input name="feedback" />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="promotionRecommended" />
            Promotion recommended
          </label>
          <Button type="submit" disabled={pending}>
            Save review
          </Button>
        </form>
      )}

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-sm">
        {reviews.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <span className="font-medium">
              {r.employee.firstName} {r.employee.lastName}
            </span>
            <span className="ml-2 text-slate-500">{r.reviewPeriod}</span>
            {r.kpiScore != null && (
              <span className="ml-2 text-indigo-600">KPI {r.kpiScore}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
