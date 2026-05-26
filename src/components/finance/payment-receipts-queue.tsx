"use client";

import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  approveOnlinePaymentProof,
  rejectOnlinePaymentProof,
} from "@/lib/actions/payment-proof";
import type { PaymentProofRow } from "@/lib/services/payment-proofs";
import { formatCurrency } from "@/lib/utils";

export function PaymentReceiptsQueue({ proofs }: { proofs: PaymentProofRow[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        setMessage(res.message ?? "Done");
        setRejectingId(null);
        setRejectReason("");
      } else setError(res.error ?? "Failed");
    });
  }

  if (proofs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
        No online payment receipts waiting for review.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      )}

      {proofs.map((p) => (
        <article
          key={p.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{p.studentName}</h3>
              <p className="font-mono text-xs text-slate-500">{p.studentCode}</p>
              <p className="mt-1 text-sm text-slate-600">
                {p.semesterLabel} · {p.gradeLabel} · {p.branchName}
              </p>
              <p className="mt-2 text-sm">
                Submitted by <strong>{p.submitterName}</strong> on{" "}
                {new Date(p.createdAt).toLocaleString("en-ET")}
              </p>
              <p className="mt-2 text-lg font-semibold text-indigo-700">
                Claimed: {formatCurrency(p.amount)}
              </p>
              <p className="text-sm text-slate-500">
                Fee balance: {formatCurrency(p.feePaid)} / {formatCurrency(p.feeAmount)} (
                {p.feeStatus})
              </p>
              {p.reference && (
                <p className="text-sm text-slate-600">Ref: {p.reference}</p>
              )}
              {p.notes && <p className="text-sm text-slate-500">{p.notes}</p>}
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <a
                href={p.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <ExternalLink className="h-4 w-4" />
                View invoice
              </a>

              {rejectingId === p.id ? (
                <div className="w-full min-w-[240px] space-y-2">
                  <Field label="Rejection reason">
                    <Input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Amount mismatch"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={pending}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("proofId", p.id);
                        fd.set("reason", rejectReason);
                        run(() => rejectOnlinePaymentProof(fd));
                      }}
                    >
                      Confirm reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => approveOnlinePaymentProof(p.id))}
                  >
                    Approve online payment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => setRejectingId(p.id)}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
