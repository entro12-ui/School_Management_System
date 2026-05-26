import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { NoChildrenMessage } from "@/components/parent/no-children";
import { auth } from "@/lib/auth";
import { PARENT_NAV } from "@/lib/nav/parent-nav";
import {
  getChildrenForParent,
  getParentDashboardStats,
} from "@/lib/services/parent";
import { DashboardGraphs } from "@/components/dashboard/dashboard-graphs";
import { getParentDashboardCharts } from "@/lib/services/dashboard-charts";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";
import { BarChart3, ClipboardList, TrendingUp, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { children } = await getChildrenForParent(session.user.id);
  const childIds = children.map((c) => c.id);
  const [stats, charts] = await Promise.all([
    getParentDashboardStats(childIds),
    getParentDashboardCharts(childIds),
  ]);

  return (
    <PortalShell title="Parent Portal" subtitle="Your children's progress" nav={PARENT_NAV}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Parent dashboard</h1>
        <p className="text-slate-500">
          View results, attendance, and fees for your linked children only.
        </p>
      </div>

      {children.length === 0 ? (
        <NoChildrenMessage />
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Children"
              value={String(children.length)}
              subtitle="Linked to your account"
              icon={TrendingUp}
            />
            <StatCard
              title="New grades (30 days)"
              value={String(stats.recentGrades)}
              icon={BarChart3}
            />
            <StatCard
              title="Outstanding fees"
              value={formatCurrency(stats.outstanding)}
              icon={Wallet}
            />
            <StatCard
              title="Absences this month"
              value={String(stats.absencesThisMonth)}
              icon={ClipboardList}
            />
          </div>

          <DashboardGraphs charts={charts} />

          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Your children</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {children.map((child) => (
                <article
                  key={child.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-semibold text-slate-900">
                    {child.firstName} {child.lastName}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {child.studentId} · {child.gradeLabel} · {child.className}
                  </p>
                  <p className="text-xs text-slate-400">{child.branchName}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/parent/results?childId=${child.id}`}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                      Results
                    </Link>
                    <Link
                      href={`/parent/attendance?childId=${child.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Attendance
                    </Link>
                    <Link
                      href={`/parent/fees?childId=${child.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Fees
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </PortalShell>
  );
}
