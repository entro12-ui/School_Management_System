"use client";

import { useTransition } from "react";
import { cancelPendingChapaPayment } from "@/lib/actions/chapa-payment";
import { Button } from "@/components/ui/button";

export function CancelChapaCheckoutButton({ paymentId }: { paymentId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="mt-2"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await cancelPendingChapaPayment(paymentId);
        });
      }}
    >
      {pending ? "Cancelling…" : "Cancel checkout and try again"}
    </Button>
  );
}
