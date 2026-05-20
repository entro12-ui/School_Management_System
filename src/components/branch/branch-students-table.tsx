"use client";

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatGradeLevel } from "@/lib/grade-utils";
import { formatCurrency } from "@/lib/utils";

export type BranchStudentRow = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  className: string;
  guardianName: string;
  outstanding: number;
};

export function BranchStudentsTable({ students }: { students: BranchStudentRow[] }) {
  const columns = useMemo<DataTableColumn<BranchStudentRow>[]>(
    () => [
      {
        id: "studentId",
        header: "ID",
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
        id: "grade",
        header: "Grade",
        sortable: true,
        sortValue: (r) => r.gradeLevel,
        cell: (r) => formatGradeLevel(r.gradeLevel),
      },
      {
        id: "class",
        header: "Class",
        sortable: true,
        sortValue: (r) => r.className,
        cell: (r) => r.className,
      },
      {
        id: "guardian",
        header: "Guardian",
        sortable: true,
        sortValue: (r) => r.guardianName,
        cell: (r) => <span className="text-slate-600">{r.guardianName}</span>,
      },
      {
        id: "fees",
        header: "Fees",
        sortable: true,
        sortValue: (r) => r.outstanding,
        cell: (r) =>
          r.outstanding > 0 ? (
            <span className="text-amber-700">{formatCurrency(r.outstanding)} due</span>
          ) : (
            <span className="text-emerald-700">Clear</span>
          ),
      },
    ],
    []
  );

  return (
    <DataTable
      data={students}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search name, ID, class, guardian…"
      getSearchText={(r) =>
        [r.studentId, r.firstName, r.lastName, r.className, r.guardianName, formatGradeLevel(r.gradeLevel)].join(" ")
      }
      filters={[
        {
          id: "fees",
          label: "Fees",
          options: [
            { value: "due", label: "Outstanding" },
            { value: "clear", label: "Clear" },
          ],
          predicate: (r, v) =>
            v === "due" ? r.outstanding > 0 : r.outstanding <= 0,
        },
      ]}
      emptyMessage="No students match your search."
      recordLabel="student"
    />
  );
}
