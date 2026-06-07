import { Suspense } from "react";
import { PortalShell } from "@/components/layout/portal-shell";
import { ChildTabs } from "@/components/parent/child-tabs";
import { NoChildrenMessage } from "@/components/parent/no-children";
import { ChapaPaymentReturnHandler } from "@/components/fees/chapa-payment-return-handler";
import { CancelChapaCheckoutButton } from "@/components/fees/cancel-chapa-checkout-button";
import { FeePaymentReceiptCard } from "@/components/fees/fee-payment-receipt";
import { OnlinePaymentOptions } from "@/components/fees/online-payment-options";
import { ParentFeesTable } from "@/components/parent/parent-fees-table";
import { auth } from "@/lib/auth";
import { isChapaConfigured } from "@/lib/chapa/config";
import { PARENT_NAV } from "@/lib/nav/parent-nav";
import {
  getChildFeesForParent,
  getChildForParent,
  getChildrenForParent,
} from "@/lib/services/parent";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ParentFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const { children } = await getChildrenForParent(session.user.id);

  if (children.length === 0) {
    return (
      <PortalShell title="Parent Portal" subtitle="Fees" nav={PARENT_NAV}>
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Fees</h1>
        <NoChildrenMessage />
      </PortalShell>
    );
  }

  const childId = params.childId ?? children[0].id;
  const child = await getChildForParent(session.user.id, childId);
  if (!child) redirect("/parent/fees");

  const { payments, totals } = await getChildFeesForParent(child.id);
  const chapaEnabled = isChapaConfigured();
  const returnPath = `/parent/fees?childId=${child.id}`;

  return (
    <PortalShell
      title="Parent Portal"
      subtitle={`${child.firstName} ${child.lastName}`}
      nav={PARENT_NAV}
    >
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Fees & payments</h1>
      <p className="mb-6 text-slate-500">
        Pay with Chapa, upload a bank receipt for finance to approve, or pay cash at the school
        office. Semester 2 opens after Semester 1 is fully paid.
      </p>

      <Suspense fallback={null}>
        <div className="mb-6">
          <ChapaPaymentReturnHandler />
        </div>
      </Suspense>

      <ChildTabs linkedChildren={children} activeChildId={child.id} basePath="/parent/fees" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total billed</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totals.totalDue)}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Paid</p>
          <p className="text-xl font-bold text-emerald-900">{formatCurrency(totals.totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm text-red-800">Outstanding</p>
          <p className="text-xl font-bold text-red-900">
            {formatCurrency(totals.outstanding)}
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No fee records yet for {child.firstName}.
        </p>
      ) : (
        <>
          <div className="mb-6 space-y-4">
            {payments
              .filter((p) => p.canPayOnline)
              .map((p) => (
                <article
                  key={p.id}
                  className="rounded-xl border border-indigo-100 bg-white p-4"
                >
                  <p className="text-sm font-medium text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    Outstanding {formatCurrency(p.outstanding)}
                  </p>
                  {p.pendingChapa && (
                    <div className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                      <p>Chapa checkout in progress for this invoice.</p>
                      <CancelChapaCheckoutButton paymentId={p.id} />
                    </div>
                  )}
                  <OnlinePaymentOptions
                    paymentId={p.id}
                    feeName={p.name}
                    outstanding={p.outstanding}
                    returnPath={returnPath}
                    chapaEnabled={chapaEnabled}
                  />
                </article>
              ))}
            {payments
              .filter((p) => p.status === "PAID" || p.paidAmount > 0)
              .map((p) => (
                <FeePaymentReceiptCard
                  key={`receipt-${p.id}`}
                  receipt={p.receipt}
                  studentName={`${child.firstName} ${child.lastName}`}
                />
              ))}

            {payments.some((p) => p.pendingProof) && (
              <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
                A payment receipt is awaiting finance review. You will be notified when it is
                approved.
              </p>
            )}
          </div>

          <ParentFeesTable
            payments={payments.map((p) => ({
              id: p.id,
              name: p.name,
              amount: p.amount,
              paidAmount: p.paidAmount,
              status: p.status,
              dueDate: p.dueDate?.toISOString() ?? null,
              paidAt: p.paidAt?.toISOString() ?? null,
              reference: p.reference,
              paidChannel: p.paidChannel,
              scholarship: p.scholarship,
            }))}
          />
        </>
      )}
    </PortalShell>
  );
}
