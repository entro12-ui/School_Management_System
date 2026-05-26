"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HrEmploymentType, HrEmployeeStatus, UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/input";
import { deleteHrEmployee, getNextHrEmployeeCode, saveHrEmployee } from "@/lib/actions/hr";
import { HrEmployeeDocumentFields } from "@/components/hr/hr-employee-document-fields";
import {
  HrEmployeeDocumentsList,
  type EmployeeDocumentItem,
} from "@/components/hr/hr-employee-documents-list";
import {
  ACADEMIC_DESIGNATION_TITLES,
  DEPARTMENT_FOR_PORTAL_ROLE,
  designationTitlesForPortalRole,
} from "@/lib/hr/staff-designations";
import {
  HR_EMPLOYEE_DIRECT_PORTAL_ROLES,
  portalRoleLabel,
} from "@/lib/hr/portal-roles";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { HrFeedback } from "./hr-feedback";

type EmployeeRow = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  employmentType: HrEmploymentType;
  status: HrEmployeeStatus;
  department: { id: string; name: string } | null;
  designation: { id: string; title: string } | null;
  joiningDate: Date | null;
  user: { id: string; email: string; role: string } | null;
  documents: EmployeeDocumentItem[];
};

type SubjectOption = { id: string; name: string; gradeBand: string };

const GENERAL_STAFF = "GENERAL" as const;
type StaffCategory = UserRole | typeof GENERAL_STAFF;

export function HrEmployeesManager({
  branchId,
  employees,
  subjects,
  canWrite,
}: {
  branchId: string;
  employees: EmployeeRow[];
  subjects: SubjectOption[];
  canWrite: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [staffCategory, setStaffCategory] = useState<StaffCategory>(UserRole.TEACHER);
  const [designationTitle, setDesignationTitle] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [grantPortal, setGrantPortal] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const isTeacher = staffCategory === UserRole.TEACHER;
  const isGeneral = staffCategory === GENERAL_STAFF;
  const portalRole = isGeneral ? undefined : (staffCategory as UserRole);

  const departmentName = isGeneral
    ? null
    : DEPARTMENT_FOR_PORTAL_ROLE[staffCategory as UserRole] ?? "Administration";

  const designationOptions = useMemo(() => {
    if (isGeneral) return [];
    return designationTitlesForPortalRole(staffCategory as UserRole);
  }, [staffCategory, isGeneral]);

  useEffect(() => {
    if (!showForm) return;
    let cancelled = false;
    (async () => {
      const res = await getNextHrEmployeeCode(
        branchId,
        isGeneral ? undefined : String(staffCategory)
      );
      if (!cancelled && "code" in res) setEmployeeCode(res.code);
    })();
    return () => {
      cancelled = true;
    };
  }, [showForm, branchId, staffCategory, isGeneral]);

  useEffect(() => {
    if (isGeneral) {
      setDesignationTitle("");
    } else if (designationOptions.length >= 1) {
      setDesignationTitle(designationOptions[0]);
    }
  }, [staffCategory, isGeneral, isTeacher, designationOptions]);

  useEffect(() => {
    setGrantPortal(!isGeneral);
  }, [isGeneral]);

  function run(action: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        setMessage(res.message ?? "Saved");
        setShowForm(false);
        router.refresh();
      } else setError(res.error ?? "Failed");
    });
  }

  const columns: DataTableColumn<EmployeeRow>[] = [
    {
      id: "code",
      header: "Code",
      sortable: true,
      sortValue: (r) => r.employeeCode,
      cell: (r) => <span className="font-mono text-xs">{r.employeeCode}</span>,
    },
    {
      id: "name",
      header: "Name",
      sortable: true,
      sortValue: (r) => `${r.lastName} ${r.firstName}`,
      cell: (r) => (
        <span className="font-medium">
          {r.firstName} {r.lastName}
        </span>
      ),
    },
    {
      id: "dept",
      header: "Department",
      cell: (r) => r.department?.name ?? "—",
    },
    {
      id: "desig",
      header: "Designation",
      cell: (r) => r.designation?.title ?? "—",
    },
    {
      id: "portal",
      header: "Portal",
      cell: (r) =>
        r.user?.role ? (
          <span className="text-xs text-slate-600">
            {ROLE_LABELS[r.user.role as keyof typeof ROLE_LABELS] ?? r.user.role}
          </span>
        ) : (
          "—"
        ),
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{r.status}</span>
      ),
    },
    {
      id: "files",
      header: "Files",
      cell: (r) => (
        <HrEmployeeDocumentsList
          employeeId={r.id}
          employeeName={`${r.firstName} ${r.lastName}`}
          documents={r.documents}
          canWrite={canWrite}
          onDeleted={() => router.refresh()}
        />
      ),
    },
    ...(canWrite
      ? [
          {
            id: "actions",
            header: "",
            cell: (r: EmployeeRow) => (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Remove ${r.firstName} ${r.lastName}?`)) return;
                  run(() => deleteHrEmployee(r.id));
                }}
              >
                Remove
              </Button>
            ),
          } as DataTableColumn<EmployeeRow>,
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <HrFeedback message={message} error={error} />

      {canWrite && (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ Add employee"}
          </Button>
        </div>
      )}

      {showForm && canWrite && (
        <form
          encType="multipart/form-data"
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
          action={(fd) => run(() => saveHrEmployee(fd))}
        >
          <input type="hidden" name="branchId" value={branchId} />
          <input type="hidden" name="employeeCode" value={employeeCode} />

          <Field label="Staff role">
            <Select
              value={staffCategory}
              onChange={(e) => {
                const v = e.target.value;
                setStaffCategory(
                  v === GENERAL_STAFF ? GENERAL_STAFF : (v as UserRole)
                );
              }}
              required
            >
              {HR_EMPLOYEE_DIRECT_PORTAL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {portalRoleLabel(r)}
                </option>
              ))}
              <option value={GENERAL_STAFF}>General employee (no portal)</option>
            </Select>
          </Field>

          <Field label="Employee code (auto)">
            <Input value={employeeCode} readOnly className="bg-slate-50 font-mono text-sm" />
          </Field>

          {departmentName && (
            <div className="sm:col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Department: <strong>{departmentName}</strong>
              {isTeacher && " — academic staff"}
              {!isTeacher && " — administration & support"}
            </div>
          )}

          {isTeacher ? (
            <Field label="Academic designation">
              <Select
                name="designationTitle"
                value={designationTitle}
                onChange={(e) => setDesignationTitle(e.target.value)}
                required
              >
                <option value="">Select teaching role…</option>
                {ACADEMIC_DESIGNATION_TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          ) : isGeneral ? (
            <Field label="Job title">
              <Input
                name="designationTitle"
                placeholder="e.g. Security Officer, Driver"
                required
              />
            </Field>
          ) : (
            <Field label="Job designation">
              <Select
                name="designationTitle"
                value={designationTitle}
                onChange={(e) => setDesignationTitle(e.target.value)}
                required
              >
                {designationOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {isTeacher && subjects.length > 0 && (
            <div className="sm:col-span-2">
              <Field label="Subjects taught (optional)">
                <select
                  name="subjectIds"
                  multiple
                  className="min-h-[100px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.gradeBand})
                    </option>
                  ))}
                </select>
              </Field>
              <p className="mt-1 text-xs text-slate-500">
                Hold Ctrl/Cmd to select multiple subjects.
              </p>
            </div>
          )}

          <Field label="Email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="First name">
            <Input name="firstName" required />
          </Field>
          <Field label="Last name">
            <Input name="lastName" required />
          </Field>
          <Field label="Phone">
            <Input name="phone" />
          </Field>
          <Field label="Employment type">
            <Select name="employmentType" defaultValue="FULL_TIME">
              {Object.values(HrEmploymentType).map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="ACTIVE">
              {Object.values(HrEmployeeStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Joining date">
            <Input name="joiningDate" type="date" />
          </Field>

          <div className="sm:col-span-2 rounded-lg border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            New <strong>HR Managers</strong> must{" "}
            <Link href="/register/hr-manager" className="font-medium underline">
              apply online
            </Link>{" "}
            and be approved by branch or super admin before they can sign in.
          </div>

          <HrEmployeeDocumentFields />

          {!isGeneral && (
            <div className="sm:col-span-2 space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="grantPortalAccess"
                  className="rounded"
                  checked={grantPortal}
                  onChange={(e) => setGrantPortal(e.target.checked)}
                />
                Create school portal login as {portalRoleLabel(portalRole!)}
              </label>
              {grantPortal && (
                <input type="hidden" name="portalRole" value={portalRole} />
              )}
            </div>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending || !employeeCode}>
              Save employee
            </Button>
          </div>
        </form>
      )}

      <DataTable
        data={employees}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search employees…"
        getSearchText={(r) =>
          `${r.employeeCode} ${r.firstName} ${r.lastName} ${r.email}`
        }
        emptyMessage="No employees yet."
      />
    </div>
  );
}
