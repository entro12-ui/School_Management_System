import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { requireBranchAdmin } from "@/lib/auth/branch-session";
import { BRANCH_NAV } from "@/lib/nav/branch-nav";
import {
  getBranchGradeLevelBreakdown,
  getBranchOverview,
} from "@/lib/services/branch-admin";
import { getGradeBandBreakdown } from "@/lib/services/dashboard";
import { getFinanceDashboardStats } from "@/lib/services/finance";
import { ClipboardList, Users, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BranchReportsPage() {
  const { branchId, branchName } = await requireBranchAdmin();

  const [overview, finance, gradeLevels, gradeBands] = await Promise.all([
    getBranchOverview(branchId),
    getFinanceDashboardStats(branchId),
    getBranchGradeLevelBreakdown(branchId),
    getGradeBandBreakdown(branchId),
  ]);

  return (
    <PortalShell title="Branch Admin" subtitle={branchName} nav={BRANCH_NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Branch reports</h1>
        <p className="text-slate-500">
          Summary for {overview.branch.name} — export-ready overview for branch leadership.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Students" value={String(overview.counts.students)} icon={Users} />
        <StatCard
          title="Semesters paid"
          value={String(finance.paid)}
          icon={Wallet}
        />
        <StatCard
          title="Outstanding"
          value={overview.metrics.formatted.outstanding}
          icon={Wallet}
        />
        <StatCard
          title="Attendance today"
          value={overview.metrics.formatted.attendance}
          icon={ClipboardList}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Enrollment by grade</h2>
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {gradeLevels.map((g) => (
              <li key={g.gradeLevel} className="flex justify-between text-sm">
                <span className="text-slate-600">{g.label}</span>
                <span className="font-medium">{g.count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">By grade band</h2>
          <ul className="mt-4 space-y-2">
            {gradeBands.map((g) => (
              <li key={g.band} className="flex justify-between text-sm">
                <span className="text-slate-600">{g.band.replace(/_/g, " ")}</span>
                <span className="font-medium">{g.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/finance/payments"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Fee payment sheet
        </Link>
        <Link
          href="/finance/reports"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Finance collection report
        </Link>
        <Link
          href="/branch/students"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Student roster
        </Link>
      </div>
    </PortalShell>
  );
}
