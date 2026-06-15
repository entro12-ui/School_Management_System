import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalShell } from "@/components/layout/portal-shell";
import { InspectionChecklist } from "@/components/inspection/inspection-checklist";
import { InspectionReportPanel } from "@/components/inspection/inspection-report-panel";
import { auth } from "@/lib/auth";
import { assertSuperAdminCanAccessBranch } from "@/lib/auth/super-admin-scope";
import { ADMIN_NAV } from "@/lib/nav/admin-nav";
import { getInspectionRunDetail } from "@/lib/services/inspection";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminInspectionRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const { runId } = await params;
  const { view } = await searchParams;

  const detail = await getInspectionRunDetail(runId);
  if (!detail) notFound();

  const access = await assertSuperAdminCanAccessBranch(
    session.user,
    detail.run.branchId
  );
  if (!access.ok) notFound();

  const { run, framework, summary } = detail;
  const showReport = view === "report";

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
    <PortalShell
      title="Super Admin"
      subtitle={detail.run.branch.name}
      nav={ADMIN_NAV}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {showReport ? "Inspection report" : "Inspection checklist"}
          </h1>
          <p className="text-slate-500">
            {detail.run.branch.name} ·{" "}
            {new Date(run.inspectionDate).toLocaleDateString("en-ET", {
              dateStyle: "long",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inspection">
            <Button variant="outline">All inspections</Button>
          </Link>
          {showReport ? (
            <Link href={`/admin/inspection/${runId}`}>
              <Button variant="secondary">Checklist</Button>
            </Link>
          ) : (
            <Link href={`/admin/inspection/${runId}?view=report`}>
              <Button variant="secondary">Report</Button>
            </Link>
          )}
        </div>
      </div>

      {showReport ? (
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
          isSuperAdmin={true}
          exportBaseUrl={`/api/inspection/${runId}/export`}
        />
      ) : (
        <InspectionChecklist
          runId={runId}
          framework={framework}
          summary={summary}
          scoreMap={scoreMap}
          readOnly={run.status === "FINALIZED"}
          status={run.status}
        />
      )}
    </PortalShell>
  );
}
