"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { confirmChapaPayment } from "@/lib/actions/chapa-payment";

export function ChapaPaymentReturnHandler() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("chapa_tx");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!txRef) return;

    startTransition(async () => {
      const result = await confirmChapaPayment(txRef);
      if (result.success && "message" in result) {
        setMessage(result.message);
      } else if (!result.success) {
        setError(result.error ?? "Could not confirm payment.");
      }
    });
  }, [txRef]);

  if (!txRef) return null;

  if (pending) {
    return (
      <p className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        Confirming your Chapa payment…
      </p>
    );
  }

  if (message) {
    return (
      <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
    );
  }

  return null;
}
