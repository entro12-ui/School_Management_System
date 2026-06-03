import { PortalShell } from "@/components/layout/portal-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { getConsolidatedStats, getGradeBandBreakdown } from "@/lib/services/dashboard";
import { getAdminSummary } from "@/lib/services/admin";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  Building2,
  ClipboardList,
  Download,
  GraduationCap,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV } from "@/lib/nav/admin-nav";
import { DashboardGraphs } from "@/components/dashboard/dashboard-graphs";
import { getAdminDashboardCharts } from "@/lib/services/dashboard-charts";
import { StudentPerformanceAnalyticsPanel } from "@/components/admin/student-performance-analytics";
import { getStudentPerformanceAnalytics } from "@/lib/services/student-performance-analytics";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const [stats, gradeBreakdown, charts, adminSummary, performanceAnalytics] = await Promise.all([
    getConsolidatedStats(),
    getGradeBandBreakdown(),
    getAdminDashboardCharts(),
    getAdminSummary(),
    getStudentPerformanceAnalytics(),
  ]);

  return (
    <PortalShell
      title="Super Admin"
      subtitle="Central Office — full system control"
      nav={ADMIN_NAV}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consolidated view</h1>
          <p className="text-slate-500">
            Compare branches · enrollment KG–12 · revenue & outstanding
          </p>
          {adminSummary.pendingRegistrations > 0 && (
            <p className="mt-3 text-sm font-medium text-amber-700">
              {adminSummary.pendingRegistrations} staff application
              {adminSummary.pendingRegistrations === 1 ? "" : "s"} awaiting approval —{" "}
              <Link href="/admin/registrations" className="underline">
                Review now
              </Link>
            </p>
          )}
        </div>
        <Link href="/admin/reports">
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export (PDF / Excel / CSV)
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total enrollment"
          value={String(stats.totals.enrollment)}
          subtitle="KG–12 across all branches"
          icon={Users}
        />
        <StatCard
          title="Avg attendance today"
          value={formatPercent(stats.totals.attendanceRate)}
          icon={ClipboardList}
          trend={{ value: "Real-time sync active", positive: true }}
        />
        <StatCard
          title="Combined revenue"
          value={formatCurrency(stats.totals.revenue)}
          icon={Wallet}
        />
        <StatCard
          title="Outstanding fees"
          value={formatCurrency(stats.totals.outstanding)}
          icon={GraduationCap}
        />
      </div>

      <DashboardGraphs charts={charts} />

      <StudentPerformanceAnalyticsPanel analytics={performanceAnalytics} />

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Branch comparison</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Enrollment</th>
                <th className="px-4 py-3 font-medium">Attendance</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-4 py-3 font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.branches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-500" />
                      {b.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{b.city}</td>
                  <td className="px-4 py-3">{b.enrollment}</td>
                  <td className="px-4 py-3">{formatPercent(b.attendanceRate)}</td>
                  <td className="px-4 py-3">{formatCurrency(b.revenue)}</td>
                  <td className="px-4 py-3">{formatCurrency(b.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Enrollment by grade band</h3>
          <ul className="mt-4 space-y-2">
            {gradeBreakdown.map((g) => (
              <li key={g.band} className="flex justify-between text-sm">
                <span className="text-slate-600">{g.band.replace("_", " ")}</span>
                <span className="font-medium">{g.count} students</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Organization</h3>
          <p className="mt-2 text-sm text-slate-600">
            Explore the live hierarchy — central office, branches, staff roles, and family
            portals.
          </p>
          <Link
            href="/admin/organization"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
          >
            View organization map →
          </Link>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">System modules</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>· Academic — continuous assessment, term & final exams</li>
            <li>· Attendance — biometric/RFID ready, parent SMS alerts</li>
            <li>· Financial — tuition by grade/stream, scholarships</li>
            <li>· Library — catalog, issue/return, fines</li>
            <li>· Exam/Report — report cards KG–12, MoE audit exports</li>
          </ul>
          <Link
            href="/admin/settings"
            className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
          >
            <Settings className="h-4 w-4" />
            Global settings
          </Link>
        </div>
      </section>
    </PortalShell>
  );
}
