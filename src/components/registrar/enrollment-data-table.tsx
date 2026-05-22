"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { UserRole } from "@prisma/client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatGradeLevel } from "@/lib/grade-utils";
import type { EnrollmentRecordRow } from "@/lib/services/registrar-records";
import {
  deleteEnrollmentRecord,
  resetEnrollmentOtp,
  updateEnrollmentRecord,
} from "@/lib/actions/registrar-records";

type SortKey =
  | "name"
  | "email"
  | "role"
  | "createdAt"
  | "otpStatus"
  | "studentId";

type SortDir = "asc" | "desc";

function otpLabel(row: EnrollmentRecordRow) {
  if (row.pendingOtp) return row.pendingOtp;
  if (row.mustChangePassword) return "—";
  return "Password set";
}

function otpStatus(row: EnrollmentRecordRow) {
  if (row.pendingOtp) return "pending";
  if (row.mustChangePassword) return "expired";
  return "active";
}

export function EnrollmentDataTable({
  records,
  showBranch = false,
}: {
  records: EnrollmentRecordRow[];
  showBranch?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [otpFilter, setOtpFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<EnrollmentRecordRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pageSize = 15;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = records.filter((r) => {
      if (statusFilter === "active" && !r.isActive) return false;
      if (statusFilter === "inactive" && r.isActive) return false;
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (otpFilter !== "all" && otpStatus(r) !== otpFilter) return false;
      if (!q) return true;
      const haystack = [
        r.firstName,
        r.lastName,
        r.email,
        r.phone,
        r.studentId,
        r.employeeId,
        r.className,
        r.department,
        ROLE_LABELS[r.role],
        r.branchName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "role":
          cmp = a.role.localeCompare(b.role);
          break;
        case "studentId":
          cmp = (a.studentId ?? "").localeCompare(b.studentId ?? "");
          break;
        case "otpStatus":
          cmp = otpStatus(a).localeCompare(otpStatus(b));
          break;
        case "createdAt":
        default:
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [records, search, roleFilter, otpFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateEnrollmentRecord(formData);
      if (result.success) {
        setMessage(result.message);
        setEditing(null);
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Deactivate ${name}? They will not be able to sign in.`)) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await deleteEnrollmentRecord(id);
      if (result.success) setMessage(result.message);
      else setError(result.error);
    });
  }

  function handleResetOtp(id: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await resetEnrollmentOtp(id);
      if (result.success) {
        setMessage(
          result.data
            ? `${result.message} New OTP: ${result.data.otp}`
            : result.message
        );
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="min-w-[200px] flex-1">
        <Field label="Search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Name, email, ID, class…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </Field>
        </div>
        <Field label="Role">
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All roles</option>
            {Object.values(UserRole)
              .filter(
                (r) =>
                  !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(r)
              )
              .map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="OTP status">
          <Select
            value={otpFilter}
            onChange={(e) => {
              setOtpFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="pending">OTP visible</option>
            <option value="active">Password set</option>
            <option value="expired">Awaiting reset</option>
          </Select>
        </Field>
        <Field label="Account">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
            <option value="all">All</option>
          </Select>
        </Field>
        <p className="pb-2 text-sm text-slate-500 lg:ml-auto">
          {filtered.length} record{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-3">
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium hover:text-slate-900"
                  onClick={() => toggleSort("name")}
                >
                  Name <SortIcon column="name" />
                </button>
              </th>
              <th className="px-3 py-3">
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium hover:text-slate-900"
                  onClick={() => toggleSort("email")}
                >
                  Email <SortIcon column="email" />
                </button>
              </th>
              <th className="px-3 py-3 font-medium">One-time password</th>
              <th className="px-3 py-3">
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium hover:text-slate-900"
                  onClick={() => toggleSort("role")}
                >
                  Role <SortIcon column="role" />
                </button>
              </th>
              <th className="px-3 py-3 font-medium">Details</th>
              {showBranch && <th className="px-3 py-3 font-medium">Branch</th>}
              <th className="px-3 py-3">
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium hover:text-slate-900"
                  onClick={() => toggleSort("createdAt")}
                >
                  Enrolled <SortIcon column="createdAt" />
                </button>
              </th>
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={showBranch ? 8 : 7}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  No records match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className={!row.isActive ? "bg-slate-50 opacity-70" : ""}>
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {row.firstName} {row.lastName}
                    {!row.isActive && (
                      <span className="ml-1 text-xs text-slate-400">(inactive)</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{row.email}</td>
                  <td className="px-3 py-3">
                    {row.pendingOtp ? (
                      <span className="font-mono font-semibold tracking-wider text-indigo-700">
                        {row.pendingOtp}
                      </span>
                    ) : (
                      <span className="text-slate-400">{otpLabel(row)}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {ROLE_LABELS[row.role]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {row.phone && <div>{row.phone}</div>}
                    {row.studentId && <div>ID: {row.studentId}</div>}
                    {row.gradeLevel != null && (
                      <div>{formatGradeLevel(row.gradeLevel)}</div>
                    )}
                    {row.className && <div>Class: {row.className}</div>}
                    {row.employeeId && <div>Emp: {row.employeeId}</div>}
                    {row.department && <div>{row.department}</div>}
                  </td>
                  {showBranch && (
                    <td className="px-3 py-3 text-slate-600">{row.branchName ?? "—"}</td>
                  )}
                  <td className="px-3 py-3 text-slate-500">
                    {new Date(row.createdAt).toLocaleDateString("en-ET", {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.role === UserRole.STUDENT && row.studentRecordId && (
                        <Link
                          href={`/registrar/students/${row.studentRecordId}`}
                          className="inline-flex h-8 items-center rounded-lg border border-indigo-200 bg-indigo-50 px-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                          title="Grades & assessments"
                        >
                          Grades
                        </Link>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => setEditing(row)}
                        title="Update"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => handleResetOtp(row.id)}
                        title="New OTP"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={pending || !row.isActive}
                        onClick={() =>
                          handleDelete(row.id, `${row.firstName} ${row.lastName}`)
                        }
                        title="Deactivate"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-slate-500">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Update record</h3>
            <p className="mt-1 text-sm text-slate-500">{ROLE_LABELS[editing.role]}</p>
            <form onSubmit={handleUpdate} className="mt-4 space-y-3">
              <input type="hidden" name="userId" value={editing.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First name *">
                  <Input name="firstName" defaultValue={editing.firstName} required />
                </Field>
                <Field label="Last name *">
                  <Input name="lastName" defaultValue={editing.lastName} required />
                </Field>
              </div>
              <Field label="Email *">
                <Input name="email" type="email" defaultValue={editing.email} required />
              </Field>
              <Field label="Phone">
                <Input name="phone" type="tel" defaultValue={editing.phone ?? ""} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  value="true"
                  defaultChecked={editing.isActive}
                  className="rounded border-slate-300"
                />
                Account active (can sign in)
              </label>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
