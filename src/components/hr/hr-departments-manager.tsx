"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  deleteHrDepartment,
  deleteHrDesignation,
  saveHrDepartment,
  saveHrDesignation,
} from "@/lib/actions/hr";
import { HrFeedback } from "./hr-feedback";

export function HrDepartmentsManager({
  branchId,
  departments,
  designations,
  canWrite,
}: {
  branchId: string;
  departments: { id: string; name: string; description: string | null; _count: { employees: number } }[];
  designations: { id: string; title: string; salaryGrade: string | null; _count: { employees: number } }[];
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

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 font-semibold text-slate-900">Departments</h2>
          {canWrite && (
            <form
              className="mb-4 space-y-3 border-b border-slate-100 pb-4"
              action={(fd) => run(() => saveHrDepartment(fd))}
            >
              <input type="hidden" name="branchId" value={branchId} />
              <Field label="Name">
                <Input name="name" required placeholder="Administration" />
              </Field>
              <Field label="Description">
                <Input name="description" />
              </Field>
              <Button type="submit" size="sm" disabled={pending}>
                Add department
              </Button>
            </form>
          )}
          <ul className="space-y-2 text-sm">
            {departments.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between border-b border-slate-50 py-2"
              >
                <div>
                  <span className="font-medium">{d.name}</span>
                  <span className="ml-2 text-slate-500">{d._count.employees} staff</span>
                </div>
                {canWrite && d._count.employees === 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    disabled={pending}
                    onClick={() => run(() => deleteHrDepartment(d.id))}
                  >
                    Delete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 font-semibold text-slate-900">Designations</h2>
          {canWrite && (
            <form
              className="mb-4 space-y-3 border-b border-slate-100 pb-4"
              action={(fd) => run(() => saveHrDesignation(fd))}
            >
              <input type="hidden" name="branchId" value={branchId} />
              <Field label="Title">
                <Input name="title" required placeholder="HR Manager" />
              </Field>
              <Field label="Salary grade">
                <Input name="salaryGrade" placeholder="G7" />
              </Field>
              <Button type="submit" size="sm" disabled={pending}>
                Add designation
              </Button>
            </form>
          )}
          <ul className="space-y-2 text-sm">
            {designations.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between border-b border-slate-50 py-2"
              >
                <span>
                  <span className="font-medium">{d.title}</span>
                  {d.salaryGrade && (
                    <span className="ml-2 text-slate-400">Grade {d.salaryGrade}</span>
                  )}
                </span>
                {canWrite && d._count.employees === 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    disabled={pending}
                    onClick={() => run(() => deleteHrDesignation(d.id))}
                  >
                    Delete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
