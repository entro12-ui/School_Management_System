"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { enrollHrTraining, saveHrTraining } from "@/lib/actions/hr";
import { HrFeedback } from "./hr-feedback";

export function HrTrainingManager({
  branchId,
  trainings,
  employees,
  canWrite,
}: {
  branchId: string;
  trainings: {
    id: string;
    title: string;
    description: string | null;
    startDate: Date | null;
    endDate: Date | null;
    _count: { enrollments: number };
    enrollments: {
      employee: { firstName: string; lastName: string };
      status: string;
      completionPercentage?: number;
    }[];
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
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
            action={(fd) => run(() => saveHrTraining(fd))}
          >
            <h2 className="font-semibold">Add training</h2>
            <input type="hidden" name="branchId" value={branchId} />
            <Field label="Title">
              <Input name="title" required />
            </Field>
            <Field label="Description">
              <Input name="description" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start">
                <Input name="startDate" type="date" />
              </Field>
              <Field label="End">
                <Input name="endDate" type="date" />
              </Field>
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              Save training
            </Button>
          </form>

          <form
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
            action={(fd) => run(() => enrollHrTraining(fd))}
          >
            <h2 className="font-semibold">Enroll employee</h2>
            <Field label="Training">
              <Select name="trainingId" required>
                {trainings.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Employee">
              <Select name="employeeId" required>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" size="sm" disabled={pending}>
              Enroll
            </Button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {trainings.map((t) => (
          <article key={t.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">{t.title}</h3>
            <p className="text-sm text-slate-500">{t._count.enrollments} enrolled</p>
            {t.enrollments.length > 0 && (
              <ul className="mt-2 text-sm text-slate-600">
                {t.enrollments.map((e, i) => (
                  <li key={i}>
                    {e.employee.firstName} {e.employee.lastName} — {e.status}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
