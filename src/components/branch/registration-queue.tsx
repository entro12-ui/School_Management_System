"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  approveRegistration,
  rejectRegistration,
} from "@/lib/actions/registration";
import type { RegistrationRequest } from "@prisma/client";
import { REGISTRATION_ROLE_LABELS } from "@/lib/registration/roles";
import { Check, X } from "lucide-react";

type RequestWithBranch = RegistrationRequest & {
  branch?: { name: string; city: string };
};

export function RegistrationQueue({
  requests,
  showBranch = false,
}: {
  requests: RequestWithBranch[];
  showBranch?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otpReveal, setOtpReveal] = useState<{
    email: string;
    oneTimePassword: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function handleApprove(id: string) {
    setMessage(null);
    setError(null);
    setOtpReveal(null);
    startTransition(async () => {
      const result = await approveRegistration(id);
      if (result.success) {
        setMessage(result.message);
        if (result.data) {
          setOtpReveal({
            email: result.data.email,
            oneTimePassword: result.data.oneTimePassword,
          });
        }
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleReject(id: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await rejectRegistration(id, rejectReason);
      if (result.success) {
        setRejectingId(null);
        setRejectReason("");
        setMessage(result.message);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">No pending registrar or HR Manager applications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {otpReveal && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-900">One-time password — copy now</p>
          <p className="mt-1 text-sm text-emerald-800">{otpReveal.email}</p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-emerald-900">
            {otpReveal.oneTimePassword}
          </p>
          <p className="mt-2 text-xs text-emerald-700">
            Share securely with the applicant. They sign in once, then set a permanent password.
          </p>
        </div>
      )}

      {message && !otpReveal && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {requests.map((req) => (
        <article
          key={req.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">
                  {req.firstName} {req.lastName}
                </h3>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {REGISTRATION_ROLE_LABELS[req.role]}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{req.email}</p>
              {showBranch && req.branch && (
                <p className="text-sm text-indigo-600">
                  {req.branch.name} · {req.branch.city}
                </p>
              )}
              {req.phone && <p className="text-sm text-slate-500">{req.phone}</p>}
              <p className="mt-2 text-sm text-slate-500">
                Applied{" "}
                {new Date(req.createdAt).toLocaleDateString("en-ET", { dateStyle: "medium" })}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              {rejectingId === req.id ? (
                <div className="w-full min-w-[240px] space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection…"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={pending}
                      onClick={() => handleReject(req.id)}
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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => handleApprove(req.id)}
                  >
                    <Check className="h-4 w-4" />
                    Approve & generate OTP
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => setRejectingId(req.id)}
                  >
                    <X className="h-4 w-4" />
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
