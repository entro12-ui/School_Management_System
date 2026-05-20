import { PortalShell } from "@/components/layout/portal-shell";
import { auth } from "@/lib/auth";
import { navForUser } from "@/lib/nav/portal-nav";
import { canManageFinance, getFinanceDashboardStats } from "@/lib/services/finance";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function FinanceReportsPage() {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) redirect("/login");

  const branchId =
    session.user.role === UserRole.SUPER_ADMIN ? undefined : session.user.branchId ?? undefined;

  const stats = await getFinanceDashboardStats(branchId);

  return (
    <PortalShell
      title={session.user.role === UserRole.BRANCH_ADMIN ? "Branch Admin" : "Finance"}
      subtitle={session.user.branchName ?? "Collection summary"}
      nav={navForUser(session.user.role, "finance")}
    >
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Collection report</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Active students</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{stats.students}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Semesters fully paid</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700">{stats.paid}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Outstanding balance</p>
          <p className="mt-1 text-3xl font-bold text-red-700">
            {formatCurrency(stats.totalOutstanding)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Pending / partial invoices</p>
          <p className="mt-1 text-3xl font-bold text-amber-700">
            {stats.pending + stats.partial}
          </p>
        </div>
      </div>
    </PortalShell>
  );
}
