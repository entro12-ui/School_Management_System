"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { recordHrAttendance } from "@/lib/actions/hr";
import { HrFeedback } from "./hr-feedback";

export function HrAttendanceManager({
  records,
  employees,
  canWrite,
}: {
  records: {
    id: string;
    attendanceDate: Date;
    checkIn: Date | null;
    checkOut: Date | null;
    method: string;
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
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-3"
          action={(fd) => run(() => recordHrAttendance(fd))}
        >
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
          <Field label="Date">
            <Input name="attendanceDate" type="date" required />
          </Field>
          <Field label="Check in">
            <Input name="checkIn" type="time" />
          </Field>
          <Field label="Check out">
            <Input name="checkOut" type="time" />
          </Field>
          <Field label="Overtime (minutes)">
            <Input name="overtimeMinutes" type="number" min={0} defaultValue={0} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={pending}>
              Record attendance
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">In / Out</th>
              <th className="px-4 py-3">Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.attendanceDate.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-3">
                  {r.employee.firstName} {r.employee.lastName}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {r.checkIn ? formatTime(r.checkIn) : "—"} /{" "}
                  {r.checkOut ? formatTime(r.checkOut) : "—"}
                </td>
                <td className="px-4 py-3">{r.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatTime(d: Date) {
  return d.toISOString().slice(11, 16);
}
