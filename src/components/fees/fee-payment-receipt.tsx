"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { FeePaymentReceipt } from "@/lib/services/fee-receipts";

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function FeePaymentReceiptCard({
  receipt,
  studentName,
}: {
  receipt: FeePaymentReceipt;
  studentName: string;
}) {
  const primaryRef =
    receipt.transactions.find((t) => t.status === "SUCCESS" || t.status === "APPROVED")
      ?.reference ??
    receipt.reference;

  function printReceipt() {
    window.print();
  }

  if (receipt.paidAmount <= 0 && receipt.transactions.length === 0) {
    return null;
  }

  return (
    <div className="fee-receipt mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 print:border-slate-300 print:bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 print:text-slate-600">
            Payment receipt
          </p>
          <p className="mt-1 font-semibold text-slate-900">{receipt.feeName}</p>
          <p className="text-sm text-slate-600">{studentName}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="print:hidden"
          onClick={printReceipt}
        >
          <Printer className="h-4 w-4" />
          Print receipt
        </Button>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Amount billed</dt>
          <dd className="font-medium text-slate-900">{formatCurrency(receipt.amount)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Amount paid</dt>
          <dd className="font-medium text-emerald-800">{formatCurrency(receipt.paidAmount)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium text-slate-900">{receipt.status}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Paid on</dt>
          <dd className="font-medium text-slate-900">{formatWhen(receipt.paidAt)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Channel</dt>
          <dd className="font-medium text-slate-900">{receipt.paidChannel ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Reference</dt>
          <dd className="break-all font-mono text-xs text-slate-900">{primaryRef ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Receipt ID</dt>
          <dd className="break-all font-mono text-xs text-slate-700">{receipt.paymentId}</dd>
        </div>
      </dl>

      {receipt.transactions.length > 0 && (
        <div className="mt-4 border-t border-emerald-200 pt-3 print:border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Transaction history
          </p>
          <ul className="mt-2 space-y-2">
            {receipt.transactions.map((tx) => (
              <li
                key={tx.id}
                className="rounded-lg bg-white/80 px-3 py-2 text-sm print:border print:border-slate-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-900">{tx.label}</span>
                  <span className="font-medium text-slate-900">{formatCurrency(tx.amount)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatWhen(tx.recordedAt)} · {tx.status}
                  {tx.reference ? ` · Ref ${tx.reference}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
