"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { assignHrRole, initHrRbac } from "@/lib/actions/hr";
import { HR_MANAGER_ROLE_NAME } from "@/lib/hr/permissions";
import { HrFeedback } from "./hr-feedback";

export function HrSettingsManager({
  hrUsers,
  roles,
  canManageRoles,
  isPortalAdmin,
}: {
  hrUsers: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    hrUserRoles: { role: { name: string } }[];
    hrEmployee: { employeeCode: string } | null;
  }[];
  roles: { name: string; description: string | null; _count: { userRoles: number } }[];
  canManageRoles: boolean;
  isPortalAdmin: boolean;
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

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-6 text-sm text-indigo-950">
        <p className="font-semibold">HR Manager</p>
        <p className="mt-1">
          Users with the <strong>{HR_MANAGER_ROLE_NAME}</strong> role can manage employees,
          payroll, leave approvals, recruitment, and assign HR roles to other staff.
          Branch and super admins always have full HR access.
        </p>
      </div>

      {isPortalAdmin && (
        <form action={() => run(() => initHrRbac())}>
          <Button type="submit" variant="secondary" disabled={pending}>
            Initialize HR roles & permissions
          </Button>
        </form>
      )}

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">HR roles</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {roles.map((r) => (
            <li
              key={r.name}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <span className="font-medium">{r.name}</span>
              {r.description && (
                <p className="text-slate-500">{r.description}</p>
              )}
              <p className="text-xs text-slate-400">{r._count.userRoles} user(s)</p>
            </li>
          ))}
        </ul>
      </section>

      {canManageRoles && (
        <section>
          <h2 className="mb-4 font-semibold text-slate-900">Assign HR role</h2>
          <form
            className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4"
            action={(fd) => run(() => assignHrRole(fd))}
          >
            <Field label="HR user">
              <Select name="userId" required>
                {hrUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Role">
              <Select name="roleName" defaultValue={HR_MANAGER_ROLE_NAME}>
                {roles.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={pending}>
              Assign role
            </Button>
          </form>

          <ul className="mt-6 space-y-2 text-sm">
            {hrUsers.map((u) => (
              <li key={u.id} className="rounded-lg border border-slate-100 px-4 py-2">
                {u.firstName} {u.lastName} —{" "}
                {u.hrUserRoles.map((r) => r.role.name).join(", ") || "No HR role"}
                {u.hrEmployee && (
                  <span className="ml-2 font-mono text-xs text-slate-400">
                    {u.hrEmployee.employeeCode}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
