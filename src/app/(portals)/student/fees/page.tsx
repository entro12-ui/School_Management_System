import { Suspense } from "react";
import { PortalShell } from "@/components/layout/portal-shell";
import { ChapaPaymentReturnHandler } from "@/components/fees/chapa-payment-return-handler";
import { CancelChapaCheckoutButton } from "@/components/fees/cancel-chapa-checkout-button";
import { FeePaymentReceiptCard } from "@/components/fees/fee-payment-receipt";
import { OnlinePaymentOptions } from "@/components/fees/online-payment-options";
import { auth } from "@/lib/auth";
import { isChapaConfigured } from "@/lib/chapa/config";
import { STUDENT_NAV } from "@/lib/nav/student-nav";
import { getStudentFees } from "@/lib/services/student-fees";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentFeesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getStudentFees(session.user.id);
  if (!data) redirect("/student");

  const chapaEnabled = isChapaConfigured();

  return (
    <PortalShell title="Student Portal" subtitle="Fees" nav={STUDENT_NAV}>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Fees & online payment</h1>
      <p className="mb-6 text-slate-500">
        Pay semester tuition with Chapa or upload a bank receipt for finance to confirm. You can
        also pay cash at the school finance office.
      </p>

      <Suspense fallback={null}>
        <div className="mb-6">
          <ChapaPaymentReturnHandler />
        </div>
      </Suspense>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total billed</p>
          <p className="text-xl font-bold">{formatCurrency(data.totals.totalDue)}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Paid</p>
          <p className="text-xl font-bold text-emerald-900">
            {formatCurrency(data.totals.totalPaid)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">Outstanding</p>
          <p className="text-xl font-bold text-amber-900">
            {formatCurrency(data.totals.outstanding)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.payments.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No fee invoices yet. Contact the finance office.
          </p>
        ) : (
          data.payments.map((p) => (
            <article
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{p.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatCurrency(p.paidAmount)} paid of {formatCurrency(p.amount)}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                    {p.status}
                    {p.paidChannel ? ` · ${p.paidChannel}` : ""}
                  </span>
                </div>
                {p.outstanding > 0 && (
                  <p className="text-lg font-semibold text-amber-700">
                    Due {formatCurrency(p.outstanding)}
                  </p>
                )}
              </div>

              {p.pendingProof && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Receipt submitted — waiting for finance to approve your online payment.
                </p>
              )}

              {p.pendingChapa && (
                <div className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
                  <p>
                    Chapa checkout in progress — you opened a payment but did not finish it. Cancel
                    below to start again.
                  </p>
                  <CancelChapaCheckoutButton paymentId={p.id} />
                </div>
              )}

              {p.canPayOnline && (
                <OnlinePaymentOptions
                  paymentId={p.id}
                  feeName={p.name}
                  outstanding={p.outstanding}
                  returnPath="/student/fees"
                  chapaEnabled={chapaEnabled}
                />
              )}

              {(p.status === "PAID" || p.paidAmount > 0) && (
                <FeePaymentReceiptCard receipt={p.receipt} studentName={data.studentName} />
              )}
            </article>
          ))
        )}
      </div>
    </PortalShell>
  );
}
