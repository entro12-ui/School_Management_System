"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startSchoolSignupPayment } from "@/lib/actions/platform-payment";

export function SchoolSignupPayButton({
  signupRequestId,
  amountLabel,
}: {
  signupRequestId: string;
  amountLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handlePay() {
    setError(null);
    startTransition(async () => {
      const result = await startSchoolSignupPayment(signupRequestId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      window.location.href = result.checkoutUrl;
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <Button className="w-full" disabled={pending} onClick={handlePay}>
        {pending ? "Opening Chapa…" : `Pay ${amountLabel} ETB with Chapa`}
      </Button>
    </div>
  );
}
