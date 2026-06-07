"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { confirmSchoolSignupPayment } from "@/lib/actions/platform-payment";

function PlatformPaymentReturnInner() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("chapa_tx");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{
    email: string;
    oneTimePassword: string;
  } | null>(null);
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
      if (result.provision) {
        setCredentials({
          email: result.provision.email,
          oneTimePassword: result.provision.oneTimePassword,
        });
      }
    });
  }, [txRef]);

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
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
        {credentials && (
          <div className="rounded-lg border border-emerald-200 bg-white px-4 py-4 text-sm">
            <p className="font-semibold text-slate-900">Your super admin login</p>
            <p className="mt-2 text-slate-600">
              Email: <strong className="text-slate-900">{credentials.email}</strong>
            </p>
            <p className="mt-1 text-slate-600">
              One-time password:{" "}
              <strong className="font-mono text-slate-900">{credentials.oneTimePassword}</strong>
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Save these credentials now. Sign in and set your permanent password, then add
              branches from the admin portal.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Sign in to your school
            </Link>
          </div>
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
