"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { assignClassHomeroom } from "@/lib/actions/branch";
import { formatGradeLevel } from "@/lib/grade-utils";

type TeacherOption = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  currentHomeroom: string | null;
  usesOtp: boolean;
};

type ClassRow = {
  id: string;
  name: string;
  gradeLevel: number;
  academicYear: string;
  studentCount: number;
  homeroomTeacherId: string | null;
  homeroomTeacherName: string | null;
};

export function ClassHomeroomTable({
  classes,
  teachers,
}: {
  classes: ClassRow[];
  teachers: TeacherOption[];
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

  const unassignedCount = classes.filter((c) => !c.homeroomTeacherId).length;

  const columns = useMemo<DataTableColumn<ClassRow>[]>(
    () => [
      {
        id: "name",
        header: "Class",
        sortable: true,
        sortValue: (c) => c.name,
        cell: (c) => <span className="font-medium text-slate-900">{c.name}</span>,
      },
      {
        id: "grade",
        header: "Grade",
        sortable: true,
        sortValue: (c) => c.gradeLevel,
        cell: (c) => formatGradeLevel(c.gradeLevel),
      },
      {
        id: "year",
        header: "Year",
        sortable: true,
        sortValue: (c) => c.academicYear,
        cell: (c) => c.academicYear,
      },
      {
        id: "students",
        header: "Students",
        sortable: true,
        sortValue: (c) => c.studentCount,
        cell: (c) => c.studentCount,
      },
      {
        id: "homeroom",
        header: "Homeroom teacher",
        sortable: true,
        sortValue: (c) => c.homeroomTeacherName ?? "",
        cell: (c) =>
          teachers.length === 0 ? (
            <span className="text-slate-400">Enroll teachers first</span>
          ) : (
            <select
              className="w-full max-w-xs rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              defaultValue={c.homeroomTeacherId ?? ""}
              disabled={pending}
              onChange={(e) => run(() => assignClassHomeroom(c.id, e.target.value))}
            >
              <option value="">Not assigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.currentHomeroom && t.currentHomeroom !== c.name
                    ? ` (now: ${t.currentHomeroom})`
                    : ""}
                </option>
              ))}
            </select>
          ),
      },
    ],
    [teachers, pending]
  );

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      )}

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-950">
        <p className="font-medium">Register teachers first, then assign homeroom</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-indigo-900/90">
          <li>
            <Link href="/registrar/enroll" className="font-medium underline">
              Enroll each teacher
            </Link>{" "}
            at the registrar (one account per teacher).
          </li>
          <li>
            Teacher signs in with the one-time password (they can set a permanent password later).
          </li>
          <li>Pick one teacher per class below — OTP accounts are allowed.</li>
        </ol>
        <p className="mt-2 text-xs text-indigo-800">
          One teacher cannot be homeroom for every class — each section needs its own registered
          teacher.
        </p>
      </section>

      {teachers.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No registered teachers yet.{" "}
          <Link href="/registrar/enroll" className="font-medium text-indigo-700 underline">
            Enroll teachers
          </Link>{" "}
          before assigning homeroom.
        </p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Registered teachers ({teachers.length})
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {teachers.map((t) => (
              <li key={t.id}>
                {t.name} · {t.employeeId}
                {t.usesOtp && (
                  <span className="text-amber-700"> — OTP login (password change optional)</span>
                )}
                {t.currentHomeroom ? (
                  <span className="text-slate-400"> — homeroom: {t.currentHomeroom}</span>
                ) : (
                  !t.usesOtp && <span className="text-emerald-600"> — available</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {unassignedCount > 0 && teachers.length > 0 && (
        <p className="text-sm text-slate-600">
          {unassignedCount} class{unassignedCount === 1 ? "" : "es"} still need a homeroom teacher.
        </p>
      )}

      <DataTable
        data={classes}
        columns={columns}
        rowKey={(c) => c.id}
        searchPlaceholder="Search class, grade, teacher…"
        getSearchText={(c) =>
          [c.name, formatGradeLevel(c.gradeLevel), c.academicYear, c.homeroomTeacherName ?? ""].join(
            " "
          )
        }
        filters={[
          {
            id: "assigned",
            label: "Homeroom",
            options: [
              { value: "yes", label: "Assigned" },
              { value: "no", label: "Not assigned" },
            ],
            predicate: (c, v) =>
              v === "yes" ? Boolean(c.homeroomTeacherId) : !c.homeroomTeacherId,
          },
        ]}
        emptyMessage="No classes match your search."
        recordLabel="class"
      />
    </div>
  );
}
