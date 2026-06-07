"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export type TeacherStudentRow = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  className: string;
  gender: string;
  email: string;
};

export function TeacherStudentsTable({ students }: { students: TeacherStudentRow[] }) {
  const columns = useMemo<DataTableColumn<TeacherStudentRow>[]>(
    () => [
      {
        id: "studentId",
        header: "Student ID",
        sortable: true,
        sortValue: (r) => r.studentId,
        cell: (r) => <span className="font-mono text-xs">{r.studentId}</span>,
      },
      {
        id: "name",
        header: "Name",
        sortable: true,
        sortValue: (r) => `${r.lastName} ${r.firstName}`,
        cell: (r) => (
          <span className="font-medium text-slate-900">
            {r.firstName} {r.lastName}
          </span>
        ),
      },
      {
        id: "class",
        header: "Class",
        sortable: true,
        sortValue: (r) => r.className,
        cell: (r) => r.className,
      },
      {
        id: "gender",
        header: "Gender",
        sortable: true,
        sortValue: (r) => r.gender,
        cell: (r) => <span className="capitalize text-slate-500">{r.gender}</span>,
      },
      {
        id: "email",
        header: "Email",
        sortable: true,
        sortValue: (r) => r.email,
        cell: (r) => <span className="text-slate-600">{r.email || "—"}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: (r) => (
          <Link
            href={`/teacher/students/${r.id}`}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Intelligence hub →
          </Link>
        ),
      },
    ],
    []
  );

  const classOptions = [...new Set(students.map((s) => s.className))];

  return (
    <DataTable
      data={students}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search name, ID, class, email…"
      getSearchText={(r) =>
        [r.studentId, r.firstName, r.lastName, r.className, r.email, r.gender].join(" ")
      }
      filters={
        classOptions.length > 1
          ? [
              {
                id: "class",
                label: "Class",
                options: classOptions.map((c) => ({ value: c, label: c })),
                predicate: (r, v) => r.className === v,
              },
            ]
          : []
      }
      emptyMessage="No students match your search."
      recordLabel="student"
    />
  );
}
