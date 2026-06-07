"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { confirmSchoolSignupPayment } from "@/lib/actions/platform-payment";

function PlatformPaymentReturnInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txRef = searchParams.get("chapa_tx");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountSetupPath, setAccountSetupPath] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!txRef) return;

    startTransition(async () => {
      const result = await confirmSchoolSignupPayment(txRef);
      if (!result) {
        setError("Payment session not found.");
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message);
      if (result.accountSetupPath) {
        setAccountSetupPath(result.accountSetupPath);
        router.replace(result.accountSetupPath);
      }
    });
  }, [txRef, router]);

  if (!txRef) return null;

  if (pending) {
    return (
      <p className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        Confirming your subscription payment…
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
    );
  }

  if (message) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
        {accountSetupPath && (
          <Link
            href={accountSetupPath}
            className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Create super admin account
          </Link>
        )}
      </div>
    );
  }

  return null;
}

export function PlatformPaymentReturnHandler() {
  return (
    <Suspense fallback={null}>
      <PlatformPaymentReturnInner />
    </Suspense>
  );
}
