"use client";

import { useMemo, useState, useTransition } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { reverifyChapaTransactionForFinance } from "@/lib/actions/chapa-payment";
import { formatCurrency } from "@/lib/utils";
import type { FinanceChapaTransactionRow } from "@/lib/services/chapa-transactions";

const CHAPA_STATUS_STYLE: Record<string, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-800",
  PENDING: "bg-amber-50 text-amber-800",
  FAILED: "bg-red-50 text-red-800",
};

export function FinanceChapaTransactionsTable({
  rows,
}: {
  rows: FinanceChapaTransactionRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo<DataTableColumn<FinanceChapaTransactionRow>[]>(
    () => [
      {
        id: "when",
        header: "Date",
        sortable: true,
        sortValue: (r) => new Date(r.completedAt ?? r.createdAt).getTime(),
        cell: (r) =>
          new Date(r.completedAt ?? r.createdAt).toLocaleString("en-ET", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
      },
      {
        id: "student",
        header: "Student",
        sortable: true,
        sortValue: (r) => r.studentName,
        cell: (r) => (
          <div>
            <p className="font-medium text-slate-900">{r.studentName}</p>
            <p className="text-xs text-slate-500">
              {r.studentCode} · {r.branchName}
            </p>
          </div>
        ),
      },
      {
        id: "semester",
        header: "Fee",
        sortable: true,
        sortValue: (r) => r.semesterLabel,
        cell: (r) => r.semesterLabel,
      },
      {
        id: "amount",
        header: "Chapa amount",
        sortable: true,
        sortValue: (r) => r.amount,
        cell: (r) => formatCurrency(r.amount),
      },
      {
        id: "chapaStatus",
        header: "Chapa",
        sortable: true,
        sortValue: (r) => r.chapaStatus,
        cell: (r) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              CHAPA_STATUS_STYLE[r.chapaStatus] ?? "bg-slate-100"
            }`}
          >
            {r.chapaStatus}
          </span>
        ),
      },
      {
        id: "paymentStatus",
        header: "Invoice",
        sortable: true,
        sortValue: (r) => r.paymentStatus,
        cell: (r) => (
          <div>
            <p className="font-medium text-slate-900">{r.paymentStatus}</p>
            <p className="text-xs text-slate-500">
              {formatCurrency(r.paidAmount)} / {formatCurrency(r.feeAmount)}
            </p>
          </div>
        ),
      },
      {
        id: "references",
        header: "References",
        sortable: true,
        sortValue: (r) => r.txRef,
        cellClassName: "max-w-[220px]",
        cell: (r) => (
          <div className="space-y-1 font-mono text-xs text-slate-600">
            <p className="break-all">TX: {r.txRef}</p>
            {r.chapaRefId ? <p className="break-all">Chapa: {r.chapaRefId}</p> : null}
            {r.paymentReference ? <p className="break-all">Paid: {r.paymentReference}</p> : null}
          </div>
        ),
      },
      {
        id: "payer",
        header: "Paid by",
        sortable: true,
        sortValue: (r) => r.payerName,
        cell: (r) => (
          <div>
            <p>{r.payerName}</p>
            <p className="text-xs text-slate-500">{r.payerEmail}</p>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (r) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setMessage(null);
              setError(null);
              startTransition(async () => {
                const result = await reverifyChapaTransactionForFinance(r.txRef);
                if (result.success && "message" in result) {
                  setMessage(result.message);
                } else if (!result.success) {
                  setError(result.error ?? "Re-verify failed.");
                }
              });
            }}
          >
            Re-verify
          </Button>
        ),
      },
    ],
    [pending]
  );

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      <DataTable
      data={rows}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search student, reference, tx ref…"
      getSearchText={(r) =>
        [
          r.studentName,
          r.studentCode,
          r.branchName,
          r.semesterLabel,
          r.txRef,
          r.chapaRefId,
          r.paymentReference,
          r.payerName,
          r.payerEmail,
          r.chapaStatus,
          r.paymentStatus,
        ]
          .filter(Boolean)
          .join(" ")
      }
      filters={[
        {
          id: "chapaStatus",
          label: "Chapa status",
          options: [
            { value: "SUCCESS", label: "Success" },
            { value: "PENDING", label: "Pending" },
            { value: "FAILED", label: "Failed" },
          ],
          predicate: (r, v) => r.chapaStatus === v,
        },
        {
          id: "paymentStatus",
          label: "Invoice status",
          options: [...new Set(rows.map((r) => r.paymentStatus))].map((s) => ({
            value: s,
            label: s,
          })),
          predicate: (r, v) => r.paymentStatus === v,
        },
      ]}
      emptyMessage="No Chapa transactions found."
      recordLabel="transaction"
      minWidth="1100px"
      pageSize={15}
    />
    </div>
  );
}
