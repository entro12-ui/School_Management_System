"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import {
  confirmChapaPayment,
  cancelPendingChapaPayment,
  prepareChapaPayment,
  type ChapaPaymentSession,
} from "@/lib/actions/chapa-payment";
import { CHAPA_TEST_PHONE } from "@/lib/chapa/phone";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const CHAPA_INLINE_SCRIPT = "https://js.chapa.co/v1/inline.js";

function loadChapaInlineScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Chapa checkout is only available in the browser."));
  }

  if (window.ChapaCheckout) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${CHAPA_INLINE_SCRIPT}"]`
  );
  if (existing) {
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Could not load Chapa checkout.")),
        { once: true }
      );
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHAPA_INLINE_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Chapa checkout."));
    document.body.appendChild(script);
  });
}

export function ChapaPayButton({
  paymentId,
  feeName,
  outstanding,
  returnPath,
  enabled = true,
}: {
  paymentId: string;
  feeName: string;
  outstanding: number;
  returnPath: string;
  enabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<ChapaPaymentSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const checkoutRef = useRef<{ initialize: (containerId?: string) => void } | null>(null);
  const containerId = `chapa-inline-${paymentId}`;

  useEffect(() => {
    if (!open || !session) return;

    let cancelled = false;

    startTransition(async () => {
      try {
        await loadChapaInlineScript();
        if (cancelled || !window.ChapaCheckout) return;

        const returnUrl = new URL(returnPath, window.location.origin);
        returnUrl.searchParams.set("chapa_tx", session.txRef);

        checkoutRef.current = new window.ChapaCheckout({
          publicKey: session.publicKey,
          amount: session.amount,
          currency: "ETB",
          tx_ref: session.txRef,
          mobile: session.mobile,
          callbackUrl: session.callbackUrl,
          returnUrl: returnUrl.toString(),
          availablePaymentMethods: ["telebirr", "cbebirr", "ebirr", "mpesa"],
          showPaymentMethodsNames: true,
          customizations: {
            buttonText: `Pay ${formatCurrency(outstanding)}`,
            successMessage: "Payment received. Updating your fee balance…",
          },
          onSuccessfulPayment: async () => {
            const result = await confirmChapaPayment(session.txRef);
            if (result.success && "message" in result) {
              setMessage(result.message);
              setOpen(false);
              window.location.href = returnUrl.toString();
              return;
            }
            if (!result.success) {
              setError(result.error ?? "Payment succeeded but could not be confirmed.");
            }
          },
          onPaymentFailure: (failureMessage) => {
            setError(failureMessage || "Payment failed. Try again with a Chapa test number.");
          },
        });

        checkoutRef.current.initialize(containerId);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not open Chapa checkout."
          );
        }
      }
    });

    return () => {
      cancelled = true;
      checkoutRef.current = null;
      const container = document.getElementById(containerId);
      if (container) container.innerHTML = "";
    };
  }, [open, session, containerId, outstanding, returnPath]);

  if (!enabled) return null;

  function openCheckout() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await prepareChapaPayment({ paymentId, returnPath });
      if (result.success && "session" in result) {
        setSession(result.session);
        setOpen(true);
        return;
      }
      if (!result.success) {
        setError(result.error ?? "Could not start payment.");
      }
    });
  }

  return (
    <div>
      <Button type="button" size="sm" disabled={pending} onClick={openCheckout}>
        {pending ? "Opening Chapa…" : `Pay ${formatCurrency(outstanding)} with Chapa`}
      </Button>
      <p className="mt-1 text-xs text-slate-500">
        {feeName} — pay with Telebirr, CBE Birr, Ebirr, or M-Pesa in the popup (no redirect).
      </p>

      {message && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {open && session ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-slate-100"
              onClick={() => {
                startTransition(async () => {
                  await cancelPendingChapaPayment(paymentId);
                });
                setOpen(false);
                setSession(null);
              }}
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="pr-8 text-base font-semibold text-slate-900">Pay with Chapa</h3>
            <p className="mt-1 text-sm text-slate-500">
              {feeName} · {formatCurrency(outstanding)}
            </p>

            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <p className="font-semibold">Test mode</p>
              <p className="mt-1">
                Use phone <span className="font-mono">{CHAPA_TEST_PHONE}</span> for Telebirr / CBE
                Birr / Ebirr, or <span className="font-mono">0700123456</span> for M-Pesa. Stay on
                this popup — do not use the old hosted checkout page.
              </p>
            </div>

            <div id={containerId} className="mt-4 min-h-[220px]" />

            {pending && (
              <p className="mt-3 text-sm text-slate-500">Loading Chapa payment form…</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
