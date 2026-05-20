import { PortalShell } from "@/components/layout/portal-shell";
import { ChildTabs } from "@/components/parent/child-tabs";
import { NoChildrenMessage } from "@/components/parent/no-children";
import { ParentFeesTable } from "@/components/parent/parent-fees-table";
import { auth } from "@/lib/auth";
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

  return (
    <PortalShell
      title="Parent Portal"
      subtitle={`${child.firstName} ${child.lastName}`}
      nav={PARENT_NAV}
    >
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Fees & payments</h1>
      <p className="mb-6 text-slate-500">
        Semester tuition for {child.firstName} (every 5 months). Semester 2 appears only after
        Semester 1 is fully paid at the finance office.
      </p>

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
        <ParentFeesTable
          payments={payments.map((p) => ({
            id: p.id,
            name: p.name,
            amount: p.amount,
            paidAmount: p.paidAmount,
            status: p.status,
            dueDate: p.dueDate?.toISOString() ?? null,
            scholarship: p.scholarship,
          }))}
        />
      )}
    </PortalShell>
  );
}
