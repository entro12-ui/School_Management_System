import { AuditLogTable } from "@/components/shared/audit-log-table";
import { PortalShell } from "@/components/layout/portal-shell";
import { requireBranchAdmin } from "@/lib/auth/branch-session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { BRANCH_NAV } from "@/lib/nav/branch-nav";
import { getBranchAuditLogs } from "@/lib/services/branch-admin";

export const dynamic = "force-dynamic";

export default async function BranchAuditPage() {
  const { branchId, branchName } = await requireBranchAdmin();
  const logs = await getBranchAuditLogs(branchId);

  const rows = logs.map((log) => ({
    id: log.id,
    action: log.action,
    actorName: log.actor
      ? `${log.actor.firstName} ${log.actor.lastName} (${ROLE_LABELS[log.actor.role]})`
      : "System",
    entity: log.entity ?? "",
    entityId: log.entityId ?? "",
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <PortalShell title="Branch Admin" subtitle={branchName} nav={BRANCH_NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
        <p className="text-slate-500">
          Activity at your branch only — enrollments, payments, and approvals.
        </p>
      </div>

      {logs.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No audit entries for this branch yet.
        </p>
      ) : (
        <AuditLogTable logs={rows} />
      )}
    </PortalShell>
  );
}
