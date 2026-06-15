import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalShell } from "@/components/layout/portal-shell";
import { InspectionReportPanel } from "@/components/inspection/inspection-report-panel";
import { requireBranchAdmin } from "@/lib/auth/branch-session";
import { BRANCH_NAV } from "@/lib/nav/branch-nav";
import { getInspectionRunDetail } from "@/lib/services/inspection";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BranchInspectionReportPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { branchId, branchName } = await requireBranchAdmin();
  const { runId } = await params;

  const detail = await getInspectionRunDetail(runId);
  if (!detail || detail.run.branchId !== branchId) notFound();

  const { run, summary } = detail;

  return (
    <PortalShell title="Branch Admin" subtitle={branchName} nav={BRANCH_NAV}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspection report</h1>
          <p className="text-slate-500">
            School director view — read-only report for{" "}
            {new Date(run.inspectionDate).toLocaleDateString("en-ET", {
              dateStyle: "long",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/branch/inspection">
            <Button variant="outline">All inspections</Button>
          </Link>
          {run.status !== "FINALIZED" && run.status !== "SUBMITTED" && (
            <Link href={`/branch/inspection/${runId}`}>
              <Button variant="secondary">Continue checklist</Button>
            </Link>
          )}
        </div>
      </div>

      <InspectionReportPanel
        runId={runId}
        summary={summary}
        initial={{
          strengths: run.strengths,
          gaps: run.gaps,
          recommendations: run.recommendations,
          inspectorComments: run.inspectorComments,
          finalOutcome: run.finalOutcome,
        }}
        status={run.status}
        isSuperAdmin={false}
        exportBaseUrl={`/api/inspection/${runId}/export`}
      />
    </PortalShell>
  );
}
