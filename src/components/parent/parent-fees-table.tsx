"use client";

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-800",
  PENDING: "bg-amber-50 text-amber-800",
  PARTIAL: "bg-orange-50 text-orange-800",
  OVERDUE: "bg-red-50 text-red-800",
};

export type ParentFeeRow = {
  id: string;
  name: string;
  amount: number;
  paidAmount: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  reference: string | null;
  paidChannel: string | null;
  scholarship: boolean;
};

export function ParentFeesTable({ payments }: { payments: ParentFeeRow[] }) {
  const columns = useMemo<DataTableColumn<ParentFeeRow>[]>(
    () => [
      {
        id: "name",
        header: "Fee",
        sortable: true,
        sortValue: (r) => r.name,
        cell: (r) => (
          <>
            <span className="font-medium text-slate-900">{r.name}</span>
            {r.scholarship && (
              <span className="ml-1 text-xs text-indigo-600">(scholarship)</span>
            )}
          </>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        sortable: true,
        sortValue: (r) => r.amount,
        cell: (r) => formatCurrency(r.amount),
      },
      {
        id: "paid",
        header: "Paid",
        sortable: true,
        sortValue: (r) => r.paidAmount,
        cell: (r) => formatCurrency(r.paidAmount),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        sortValue: (r) => r.status,
        cell: (r) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              STATUS_STYLES[r.status] ?? ""
            }`}
          >
            {r.status}
          </span>
        ),
      },
      {
        id: "reference",
        header: "Reference",
        sortable: true,
        sortValue: (r) => r.reference ?? "",
        cell: (r) =>
          r.reference ? (
            <span className="font-mono text-xs text-slate-600">{r.reference}</span>
          ) : (
            "—"
          ),
      },
      {
        id: "paidAt",
        header: "Paid on",
        sortable: true,
        sortValue: (r) => (r.paidAt ? new Date(r.paidAt).getTime() : 0),
        cell: (r) =>
          r.paidAt
            ? new Date(r.paidAt).toLocaleDateString("en-ET", { dateStyle: "medium" })
            : "—",
      },
      {
        id: "due",
        header: "Due",
        sortable: true,
        sortValue: (r) => (r.dueDate ? new Date(r.dueDate).getTime() : 0),
        cell: (r) =>
          r.dueDate
            ? new Date(r.dueDate).toLocaleDateString("en-ET", { dateStyle: "medium" })
            : "—",
      },
    ],
    []
  );

  return (
    <DataTable
      data={payments}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search fee name, status…"
      getSearchText={(r) => [r.name, r.status].join(" ")}
      filters={[
        {
          id: "status",
          label: "Status",
          options: [...new Set(payments.map((p) => p.status))].map((s) => ({
            value: s,
            label: s,
          })),
          predicate: (r, v) => r.status === v,
        },
      ]}
      emptyMessage="No payments match your search."
      recordLabel="payment"
    />
  );
}
