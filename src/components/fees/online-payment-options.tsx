"use client";

import { ChapaPayButton } from "@/components/fees/chapa-pay-button";
import { PaymentProofSubmitForm } from "@/components/fees/payment-proof-submit-form";

export function OnlinePaymentOptions({
  paymentId,
  feeName,
  outstanding,
  returnPath,
  chapaEnabled,
}: {
  paymentId: string;
  feeName: string;
  outstanding: number;
  returnPath: string;
  chapaEnabled: boolean;
}) {
  return (
    <div className="mt-3 space-y-3">
      {chapaEnabled ? (
        <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-800">
            Pay instantly
          </p>
          <ChapaPayButton
            paymentId={paymentId}
            feeName={feeName}
            outstanding={outstanding}
            returnPath={returnPath}
          />
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {chapaEnabled ? "Or upload a bank receipt" : "Pay online — upload receipt"}
        </p>
        <PaymentProofSubmitForm
          paymentId={paymentId}
          feeName={feeName}
          outstanding={outstanding}
        />
      </div>
    </div>
  );
}
