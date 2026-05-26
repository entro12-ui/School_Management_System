"use client";

import { useState, useTransition } from "react";
import { HrLeaveRequestStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import {
  createHrLeaveRequest,
  saveHrLeaveType,
  updateHrLeaveStatus,
} from "@/lib/actions/hr";
import { HrFeedback } from "./hr-feedback";

type EmployeeOpt = { id: string; label: string };

export function HrLeaveManager({
  branchId,
  leaveTypes,
  requests,
  employees,
  canWrite,
  canApprove,
}: {
  branchId: string;
  leaveTypes: { id: string; name: string; maxDays: number }[];
  requests: {
    id: string;
    status: HrLeaveRequestStatus;
    startDate: Date;
    endDate: Date;
    employee: { firstName: string; lastName: string; employeeCode: string };
    leaveType: { name: string };
  }[];
  employees: EmployeeOpt[];
  canWrite: boolean;
  canApprove: boolean;
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
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
            action={(fd) => run(() => saveHrLeaveType(fd))}
          >
            <h2 className="font-semibold text-slate-900">Leave types</h2>
            <input type="hidden" name="branchId" value={branchId} />
            <Field label="Name">
              <Input name="name" required />
            </Field>
            <Field label="Max days">
              <Input name="maxDays" type="number" min={1} defaultValue={10} required />
            </Field>
            <Button type="submit" size="sm" disabled={pending}>
              Add leave type
            </Button>
          </form>

          <form
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
            action={(fd) => run(() => createHrLeaveRequest(fd))}
          >
            <h2 className="font-semibold text-slate-900">New request</h2>
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
            <Field label="Leave type">
              <Select name="leaveTypeId" required>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (max {t.maxDays}d)
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start">
                <Input name="startDate" type="date" required />
              </Field>
              <Field label="End">
                <Input name="endDate" type="date" required />
              </Field>
            </div>
            <Field label="Remarks">
              <Input name="remarks" />
            </Field>
            <Button type="submit" size="sm" disabled={pending}>
              Submit request
            </Button>
          </form>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Status</th>
              {canApprove && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  {r.employee.firstName} {r.employee.lastName}
                  <span className="ml-1 font-mono text-xs text-slate-400">
                    {r.employee.employeeCode}
                  </span>
                </td>
                <td className="px-4 py-3">{r.leaveType.name}</td>
                <td className="px-4 py-3">
                  {r.startDate.toISOString().slice(0, 10)} →{" "}
                  {r.endDate.toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                    {r.status}
                  </span>
                </td>
                {canApprove && (
                  <td className="px-4 py-3">
                    {r.status === "PENDING" && (
                      <div className="flex gap-2">
                        <form action={(fd) => run(() => updateHrLeaveStatus(fd))}>
                          <input type="hidden" name="requestId" value={r.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                            Approve
                          </Button>
                        </form>
                        <form action={(fd) => run(() => updateHrLeaveStatus(fd))}>
                          <input type="hidden" name="requestId" value={r.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <Button type="submit" size="sm" variant="outline" disabled={pending}>
                            Reject
                          </Button>
                        </form>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
