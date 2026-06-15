import { PortalShell } from "@/components/layout/portal-shell";
import { InspectionCreateForm } from "@/components/inspection/inspection-create-form";
import { InspectionRunTable } from "@/components/inspection/inspection-run-table";
import { requireBranchAdmin } from "@/lib/auth/branch-session";
import { BRANCH_NAV } from "@/lib/nav/branch-nav";
import {
  getBranchAcademicYears,
  listInspectionRunsForBranch,
} from "@/lib/services/inspection";
import { loadFrameworkFromFile } from "@/lib/inspection/framework-server";

export const dynamic = "force-dynamic";

export default async function BranchInspectionPage() {
  const { branchId, branchName } = await requireBranchAdmin();
  const [runs, academicYears, framework] = await Promise.all([
    listInspectionRunsForBranch(branchId),
    getBranchAcademicYears(branchId),
    loadFrameworkFromFile(),
  ]);

  const counts = {
    standards: framework.standards.length,
    indicators: framework.indicators.length,
    criteria: framework.criteria.length,
  };

  return (
    <PortalShell title="Branch Admin" subtitle={branchName} nav={BRANCH_NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Internal inspection</h1>
        <p className="text-slate-500">
          MOE checklist — {counts.standards} standards, {counts.indicators} indicators,
          {counts.criteria} criteria ({framework.version.ethiopianCalendarYear} E.C.)
        </p>
      </div>

      <div className="mb-8">
        <InspectionCreateForm branchId={branchId} academicYears={academicYears} />
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Inspection history</h2>
      </div>

      <InspectionRunTable runs={runs} />
    </PortalShell>
  );
}
