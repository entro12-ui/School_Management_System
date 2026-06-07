import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { auth } from "@/lib/auth";
import { getSchoolDataScope } from "@/lib/auth/school-data-scope";
import { navForUser } from "@/lib/nav/portal-nav";
import { canManageFinance, getFinanceDashboardStats } from "@/lib/services/finance";
import { DashboardGraphs } from "@/components/dashboard/dashboard-graphs";
import { getFinanceDashboardCharts } from "@/lib/services/dashboard-charts";
import { formatCurrency } from "@/lib/utils";
import { ClipboardList, Users, Wallet, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function FinancePortalPage() {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) redirect("/login");

  const scope = getSchoolDataScope(session.user);
  const [stats, charts] = await Promise.all([
    getFinanceDashboardStats(scope),
    getFinanceDashboardCharts(scope),
  ]);

  return (
    <PortalShell
      title={session.user.role === UserRole.BRANCH_ADMIN ? "Branch Admin" : "Finance"}
      subtitle={session.user.branchName ?? "Tuition, scholarships & collections"}
      nav={navForUser(session.user.role, "finance")}
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance officer dashboard</h1>
          <p className="text-slate-500">
            Semester tuition every 5 months — students advance only when each semester is paid.
          </p>
        </div>
        <Link
          href="/finance/payments"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Manage payments →
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active students" value={String(stats.students)} icon={Users} />
        <StatCard title="Semesters paid" value={String(stats.paid)} icon={Wallet} />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.totalOutstanding)}
          icon={AlertCircle}
        />
        <StatCard title="Pending / partial" value={String(stats.pending + stats.partial)} icon={ClipboardList} />
      </div>

      <DashboardGraphs charts={charts} />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/finance/payments"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300"
        >
          <h2 className="font-semibold text-slate-900">Student payment sheet</h2>
          <p className="mt-2 text-sm text-slate-600">
            See paid / not paid per semester, record payments, and open Semester 2 after Semester 1
            is cleared.
          </p>
        </Link>
        <Link
          href="/finance/fees"
          className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-sm transition hover:border-indigo-400"
        >
          <h2 className="font-semibold text-slate-900">Semester fee structures</h2>
          <p className="mt-2 text-sm text-slate-600">
            Set tuition by KG, Primary, Junior High, and Senior High — Semester 1 & 2 (every 5
            months).
          </p>
          <span className="mt-3 inline-block text-sm font-medium text-indigo-600">
            Set prices →
          </span>
        </Link>
      </div>
    </PortalShell>
  );
}
