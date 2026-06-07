"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  approveSchoolSignup,
  rejectSchoolSignup,
  resendSchoolPaymentLink,
} from "@/lib/actions/school-signup";
import { PLATFORM_STUDENT_PRICE_ETB } from "@/lib/platform/billing";
import type { SchoolSignupClient } from "@/lib/services/school-signups";
import type { SchoolSignupStatus } from "@prisma/client";
import Link from "next/link";

const STATUS_LABELS: Record<SchoolSignupStatus, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  PAID: "Paid — setup account",
  REJECTED: "Rejected",
  PROVISIONED: "Active",
};

const STATUS_COLORS: Record<SchoolSignupStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  APPROVED: "bg-sky-50 text-sky-800",
  PAID: "bg-indigo-50 text-indigo-800",
  REJECTED: "bg-red-50 text-red-700",
  PROVISIONED: "bg-emerald-50 text-emerald-700",
};

function successfulPayment(payments?: SchoolSignupClient["platformPayments"]) {
  return payments?.find((p) => p.status === "SUCCESS");
}

function paymentLabel(row: SchoolSignupClient) {
  const paid = successfulPayment(row.platformPayments);
  if (paid) {
    return {
      label: "Paid",
      color: "bg-emerald-50 text-emerald-700",
      detail: paid.paidAt
        ? `${paid.amount.toLocaleString()} ETB · ${new Date(paid.paidAt).toLocaleDateString()}`
        : `${paid.amount.toLocaleString()} ETB`,
    };
  }
  if (row.status === "APPROVED") {
    return {
      label: "Not paid",
      color: "bg-amber-50 text-amber-800",
      detail: "Awaiting Chapa payment",
    };
  }
  if (row.status === "PAID") {
    return {
      label: "Paid",
      color: "bg-indigo-50 text-indigo-800",
      detail: "Awaiting super admin account",
    };
  }
  if (row.status === "PROVISIONED") {
    return {
      label: "Paid",
      color: "bg-emerald-50 text-emerald-700",
      detail: "Workspace active",
    };
  }
  if (row.status === "REJECTED") {
    return {
      label: "—",
      color: "bg-slate-100 text-slate-500",
      detail: "Not applicable",
    };
  }
  return {
    label: "Not paid",
    color: "bg-slate-100 text-slate-600",
    detail: "Approve first",
  };
}

export function PlatformSchoolQueue({ requests }: { requests: SchoolSignupClient[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleApprove(id: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await approveSchoolSignup(id);
      if (result.success) setMessage(result.message);
      else setError(result.error);
    });
  }

  function handleReject(id: string) {
    const reason = window.prompt("Rejection reason (required):");
    if (!reason?.trim()) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await rejectSchoolSignup(id, reason);
      if (result.success) setMessage(result.message);
      else setError(result.error);
    });
  }

  function handleResendEmail(id: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await resendSchoolPaymentLink(id);
      if (result.success) setMessage(result.message);
      else setError(result.error);
    });
  }

  function handleCopyLink(id: string) {
    const link = `${window.location.origin}/register/school/pay/${id}`;
    void navigator.clipboard.writeText(link).then(() => {
      setMessage("Payment link copied to clipboard.");
    });
  }

  if (requests.length === 0) {
    return <p className="text-center text-slate-500">No school applications yet.</p>;
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Students</th>
              <th className="px-4 py-3">Fee due</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Application</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((row) => {
              const fee = row.estimatedStudents * PLATFORM_STUDENT_PRICE_ETB;
              const payment = paymentLabel(row);
              const paidRecord = successfulPayment(row.platformPayments);

              return (
                <tr key={row.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.schoolName}</p>
                    <p className="text-slate-500">{row.city}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-900">
                      {row.contactFirstName} {row.contactLastName}
                    </p>
                    <p className="text-slate-500">{row.contactEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-900">{row.estimatedStudents}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {fee.toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${payment.color}`}
                    >
                      {payment.label}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">{payment.detail}</p>
                    {paidRecord?.chapaReference && (
                      <p className="mt-0.5 font-mono text-xs text-slate-400">
                        Ref: {paidRecord.chapaReference}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status]}`}
                    >
                      {STATUS_LABELS[row.status]}
                    </span>
                    {row.rejectionReason && (
                      <p className="mt-1 text-xs text-red-600">{row.rejectionReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      {row.status === "PENDING" && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={pending}
                            onClick={() => handleApprove(row.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => handleReject(row.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {row.status === "PAID" && (
                        <Link
                          href={`/register/school/account/${row.id}`}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                          target="_blank"
                        >
                          Open account setup →
                        </Link>
                      )}
                      {row.status === "APPROVED" && !paidRecord && (
                        <div className="flex flex-col gap-1.5">
                          <Link
                            href={`/register/school/pay/${row.id}`}
                            className="text-xs font-medium text-indigo-600 hover:underline"
                            target="_blank"
                          >
                            Open payment page →
                          </Link>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleResendEmail(row.id)}
                            className="text-left text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
                          >
                            Email payment link
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(row.id)}
                            className="text-left text-xs text-slate-500 hover:text-indigo-600"
                          >
                            Copy payment link
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
