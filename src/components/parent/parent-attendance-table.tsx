"use client";

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-emerald-50 text-emerald-800",
  ABSENT: "bg-red-50 text-red-800",
  LATE: "bg-amber-50 text-amber-800",
  EXCUSED: "bg-slate-100 text-slate-600",
};

export type ParentAttendanceRow = {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
};

export function ParentAttendanceTable({ records }: { records: ParentAttendanceRow[] }) {
  const columns = useMemo<DataTableColumn<ParentAttendanceRow>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        sortable: true,
        sortValue: (r) => new Date(r.date).getTime(),
        cell: (r) =>
          new Date(r.date).toLocaleDateString("en-ET", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        sortValue: (r) => r.status,
        cell: (r) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              STATUS_STYLES[r.status] ?? "bg-slate-100"
            }`}
          >
            {r.status}
          </span>
        ),
      },
      {
        id: "checkIn",
        header: "Check-in",
        cell: (r) =>
          r.checkIn
            ? new Date(r.checkIn).toLocaleTimeString("en-ET", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
      },
    ],
    []
  );

  return (
    <DataTable
      data={records}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search date, status…"
      getSearchText={(r) => [r.status, r.date].join(" ")}
      filters={[
        {
          id: "status",
          label: "Status",
          options: Object.keys(STATUS_STYLES).map((s) => ({ value: s, label: s })),
          predicate: (r, v) => r.status === v,
        },
      ]}
      emptyMessage="No records match your search."
      recordLabel="record"
    />
  );
}
