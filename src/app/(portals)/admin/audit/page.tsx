import { AuditLogTable } from "@/components/shared/audit-log-table";
import { PortalShell } from "@/components/layout/portal-shell";
import { ADMIN_NAV } from "@/lib/nav/admin-nav";
import { getAuditLogs } from "@/lib/services/admin";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const logs = await getAuditLogs();

  const rows = logs.map((log) => ({
    id: log.id,
    action: log.action,
    actorName: log.actor
      ? `${log.actor.firstName} ${log.actor.lastName} (${ROLE_LABELS[log.actor.role]})`
      : "—",
    entity: log.entity ?? "",
    entityId: log.entityId ?? "",
    branchName: log.branch?.name,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <PortalShell title="Super Admin" subtitle="Audit logs" nav={ADMIN_NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit logs</h1>
        <p className="text-slate-500">
          System activity across branches — registrations, enrollments, and admin actions.
        </p>
      </div>

      {logs.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No audit entries yet.
        </p>
      ) : (
        <AuditLogTable logs={rows} showBranch />
      )}
    </PortalShell>
  );
}
