"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { runHrPayroll, saveHrSalary } from "@/lib/actions/hr";
import { formatCurrency } from "@/lib/utils";
import { HrFeedback } from "./hr-feedback";

export function HrPayrollManager({
  branchId,
  salaries,
  records,
  employees,
  payrollMonth,
  canWrite,
  canRun,
}: {
  branchId: string;
  salaries: {
    employeeId: string;
    baseSalary: number;
    allowances: number;
    employee: { firstName: string; lastName: string; employeeCode: string };
  }[];
  records: {
    payrollMonth: string;
    grossSalary: number;
    netSalary: number;
    employee: { firstName: string; lastName: string; employeeCode: string };
  }[];
  employees: { id: string; label: string }[];
  payrollMonth: string;
  canWrite: boolean;
  canRun: boolean;
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
    <div className="space-y-8">
      <HrFeedback message={message} error={error} />

      {canWrite && (
        <form
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-3"
          action={(fd) => run(() => saveHrSalary(fd))}
        >
          <h2 className="sm:col-span-2 lg:col-span-3 font-semibold text-slate-900">
            Salary structure
          </h2>
          <Field label="Employee">
            <Select name="employeeId" required>
              <option value="">Select…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Base salary">
            <Input name="baseSalary" type="number" min={0} step="0.01" required />
          </Field>
          <Field label="Allowances">
            <Input name="allowances" type="number" min={0} defaultValue={0} />
          </Field>
          <Field label="Tax %">
            <Input name="taxPercentage" type="number" min={0} max={100} defaultValue={15} />
          </Field>
          <Field label="Pension %">
            <Input name="pensionPercentage" type="number" min={0} max={100} defaultValue={7} />
          </Field>
          <Button type="submit" disabled={pending}>
            Save salary
          </Button>
        </form>
      )}

      {canRun && (
        <form
          className="flex flex-wrap items-end gap-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4"
          action={(fd) => run(() => runHrPayroll(fd))}
        >
          <input type="hidden" name="branchId" value={branchId} />
          <Field label="Payroll month (YYYY-MM)">
            <Input name="payrollMonth" defaultValue={payrollMonth} required />
          </Field>
          <Button type="submit" disabled={pending}>
            Run payroll for branch
          </Button>
        </form>
      )}

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">Salary structures</h2>
        <ul className="space-y-2 text-sm">
          {salaries.map((s) => (
            <li key={s.employeeId} className="rounded-lg border border-slate-100 px-4 py-2">
              {s.employee.firstName} {s.employee.lastName} — base{" "}
              {formatCurrency(s.baseSalary)}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">Recent payroll records</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Gross</th>
                <th className="px-4 py-3">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">{r.payrollMonth}</td>
                  <td className="px-4 py-3">
                    {r.employee.firstName} {r.employee.lastName}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(r.grossSalary)}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(r.netSalary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
