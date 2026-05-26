"use client";

import { AttendanceStatus } from "@prisma/client";
import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700",
  ABSENT: "bg-red-50 text-red-700",
  LATE: "bg-amber-50 text-amber-700",
  EXCUSED: "bg-slate-100 text-slate-600",
};

export type AttendanceRow = {
  id: string;
  studentId: string;
  name: string;
  gradeLevel: number;
  className: string;
  status: AttendanceStatus | null;
};

export function AttendanceDataTable({ rows }: { rows: AttendanceRow[] }) {
  const columns = useMemo<DataTableColumn<AttendanceRow>[]>(
    () => [
      {
        id: "studentId",
        header: "Student ID",
        sortable: true,
        sortValue: (r) => r.studentId,
        cell: (r) => <span className="font-mono text-xs text-slate-500">{r.studentId}</span>,
      },
      {
        id: "name",
        header: "Name",
        sortable: true,
        sortValue: (r) => r.name,
        cell: (r) => <span className="font-medium text-slate-900">{r.name}</span>,
      },
      {
        id: "grade",
        header: "Grade",
        sortable: true,
        sortValue: (r) => r.gradeLevel,
        cell: (r) => (r.gradeLevel === 0 ? "KG" : `Grade ${r.gradeLevel}`),
      },
      {
        id: "class",
        header: "Class",
        sortable: true,
        sortValue: (r) => r.className,
        cell: (r) => r.className,
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        sortValue: (r) => r.status ?? "",
        cell: (r) =>
          r.status ? (
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                STATUS_STYLES[r.status]
              )}
            >
              {r.status}
            </span>
          ) : (
            <span className="text-xs text-slate-400">Not recorded</span>
          ),
      },
    ],
    []
  );

  return (
    <DataTable
      data={rows}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search name, ID, class…"
      getSearchText={(r) =>
        [r.studentId, r.name, r.className, String(r.gradeLevel)].join(" ")
      }
      filters={[
        {
          id: "status",
          label: "Status",
          options: [
            { value: "PRESENT", label: "Present" },
            { value: "ABSENT", label: "Absent" },
            { value: "LATE", label: "Late" },
            { value: "EXCUSED", label: "Excused" },
            { value: "none", label: "Not recorded" },
          ],
          predicate: (r, v) => (v === "none" ? !r.status : r.status === v),
        },
      ]}
      emptyMessage="No students match your filters."
      recordLabel="student"
    />
  );
}
