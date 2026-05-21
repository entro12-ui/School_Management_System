"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { submitOnlinePaymentProof } from "@/lib/actions/payment-proof";
import { formatCurrency } from "@/lib/utils";

export function PaymentProofSubmitForm({
  paymentId,
  feeName,
  outstanding,
}: {
  paymentId: string;
  feeName: string;
  outstanding: number;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Pay online — upload receipt
      </Button>
    );
  }

  return (
    <form
      encType="multipart/form-data"
      className="mt-3 space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        const fd = new FormData(e.currentTarget);
        fd.set("paymentId", paymentId);
        startTransition(async () => {
          const res = await submitOnlinePaymentProof(fd);
          if (res.success) {
            setMessage(res.message);
            setOpen(false);
          } else setError(res.error ?? "Failed");
        });
      }}
    >
      <p className="text-sm font-medium text-indigo-950">{feeName}</p>
      <p className="text-xs text-indigo-800">
        Outstanding: {formatCurrency(outstanding)} — upload bank receipt or payment screenshot.
      </p>

      <Field label="Amount paid (ETB) *">
        <Input
          name="amount"
          type="number"
          min={1}
          max={outstanding}
          step={1}
          defaultValue={outstanding}
          required
        />
      </Field>

      <Field label="Transaction / reference #">
        <Input name="reference" placeholder="Bank ref, Telebirr, CBE…" />
      </Field>

      <Field label="Invoice / receipt file *">
        <Input
          name="invoice"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
          required
        />
      </Field>

      <Field label="Notes (optional)">
        <Input name="notes" placeholder="Payment date, bank name…" />
      </Field>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Uploading…" : "Submit for finance review"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
