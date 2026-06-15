import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalShell } from "@/components/layout/portal-shell";
import { InspectionChecklist } from "@/components/inspection/inspection-checklist";
import { requireBranchAdmin } from "@/lib/auth/branch-session";
import { BRANCH_NAV } from "@/lib/nav/branch-nav";
import { getInspectionRunDetail } from "@/lib/services/inspection";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BranchInspectionRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { branchId, branchName } = await requireBranchAdmin();
  const { runId } = await params;

  const detail = await getInspectionRunDetail(runId);
  if (!detail || detail.run.branchId !== branchId) notFound();

  const { run, framework, summary } = detail;
  const readOnly =
    run.status === "FINALIZED" || run.status === "SUBMITTED";

  const scoreMap = Object.fromEntries(
    Object.entries(detail.scoreMap).map(([k, v]) => [
      k,
      {
        criterionKey: v.criterionKey,
        score: v.score,
        comment: v.comment,
      },
    ])
  );

  return (
    <PortalShell title="Branch Admin" subtitle={branchName} nav={BRANCH_NAV}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspection checklist</h1>
          <p className="text-slate-500">
            {new Date(run.inspectionDate).toLocaleDateString("en-ET", {
              dateStyle: "long",
            })}
            · {run.status.replace("_", " ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/branch/inspection">
            <Button variant="outline">All inspections</Button>
          </Link>
          <Link href={`/branch/inspection/${runId}/report`}>
            <Button variant="secondary">View report</Button>
          </Link>
        </div>
      </div>

      <InspectionChecklist
        runId={runId}
        framework={framework}
        summary={summary}
        scoreMap={scoreMap}
        readOnly={readOnly}
        status={run.status}
      />
    </PortalShell>
  );
}
