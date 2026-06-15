import { PortalShell } from "@/components/layout/portal-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { InspectionRunTable } from "@/components/inspection/inspection-run-table";
import { auth } from "@/lib/auth";
import { getOrganizationScope } from "@/lib/auth/organization-scope";
import { ADMIN_NAV } from "@/lib/nav/admin-nav";
import { loadFrameworkFromFile } from "@/lib/inspection/framework-server";
import {
  getOrgInspectionSummary,
  listInspectionRunsForOrganization,
} from "@/lib/services/inspection";
import { ClipboardCheck, School, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminInspectionPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const orgScope = getOrganizationScope(session.user);
  if (!orgScope) redirect("/login");

  const [runs, branchSummary, framework] = await Promise.all([
    listInspectionRunsForOrganization(orgScope),
    getOrgInspectionSummary(orgScope),
    loadFrameworkFromFile(),
  ]);

  const finalizedCount = runs.filter((r) => r.status === "FINALIZED").length;
  const avgPercent =
    runs.filter((r) => r.overallPercent != null).length > 0
      ? Math.round(
          runs
            .filter((r) => r.overallPercent != null)
            .reduce((s, r) => s + (r.overallPercent ?? 0), 0) /
            runs.filter((r) => r.overallPercent != null).length
        )
      : null;

  return (
    <PortalShell
      title="Super Admin"
      subtitle={session.user.organizationName ?? "Organization"}
      nav={ADMIN_NAV}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Inspection oversight</h1>
        <p className="text-slate-500">
          Ministry supervisor view — {framework.version.titleEn} (
          {framework.version.ethiopianCalendarYear} E.C.)
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total inspections"
          value={String(runs.length)}
          icon={ClipboardCheck}
        />
        <StatCard
          title="Finalized"
          value={String(finalizedCount)}
          icon={School}
        />
        <StatCard
          title="Average score"
          value={avgPercent != null ? `${avgPercent}%` : "—"}
          icon={TrendingUp}
        />
      </div>

      {branchSummary.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Branch summary (latest submitted/finalized)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-2 pr-4">Branch</th>
                  <th className="pb-2 pr-4">Latest score</th>
                  <th className="pb-2">Inspections</th>
                </tr>
              </thead>
              <tbody>
                {branchSummary.map((b) => (
                  <tr key={b.branchId} className="border-t border-slate-100">
                    <td className="py-2 pr-4">{b.branchName}</td>
                    <td className="py-2 pr-4">
                      {b.latestPercent != null ? `${b.latestPercent}%` : "—"}
                    </td>
                    <td className="py-2">{b.runCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-slate-900 mb-4">All inspection sessions</h2>
      <InspectionRunTable runs={runs} basePath="/admin/inspection" />
    </PortalShell>
  );
}
