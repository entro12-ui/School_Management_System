import { PortalShell } from "@/components/layout/portal-shell";
import { HrBranchPicker } from "@/components/hr/hr-branch-picker";
import { HrSettingsManager } from "@/components/hr/hr-settings-manager";
import { auth } from "@/lib/auth";
import { hrNavForRole } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  ensureHrRbacDefaults,
  getHrAccessFlags,
  getHrPageBranch,
  getHrRolesAndUsers,
  isHrPortalAdmin,
} from "@/lib/services/hr";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HrSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canAccessHr(session.user.role)) redirect("/login");

  await ensureHrRbacDefaults();

  const params = await searchParams;
  const { branchId, branches, isSuperAdmin } = await getHrPageBranch(session.user, params.branchId);

  const [{ roles, hrUsers }, access] = await Promise.all([
    getHrRolesAndUsers(branchId ?? undefined),
    getHrAccessFlags(session.user.id, session.user.role),
  ]);

  return (
    <PortalShell title="Human Resources" subtitle="Roles & access" nav={hrNavForRole(session.user.role)}>
      {isSuperAdmin && branchId && (
        <HrBranchPicker branchId={branchId} branches={branches} basePath="/hr/settings" />
      )}
      <h1 className="mb-6 text-2xl font-bold text-slate-900">HR roles & manager access</h1>
      <HrSettingsManager
        hrUsers={hrUsers}
        roles={roles}
        canManageRoles={access.canManageRoles}
        isPortalAdmin={isHrPortalAdmin(session.user.role)}
      />
    </PortalShell>
  );
}
