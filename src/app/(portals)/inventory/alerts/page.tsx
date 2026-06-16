import { PortalShell } from "@/components/layout/portal-shell";
import { InventoryAlertsPanel } from "@/components/inventory/inventory-alerts-panel";
import { InventoryBranchPicker } from "@/components/inventory/inventory-branch-picker";
import { auth } from "@/lib/auth";
import { INVENTORY_NAV } from "@/lib/nav/inventory-nav";
import {
  canManageInventory,
  getInventoryAlerts,
  getInventoryPageBranch,
} from "@/lib/services/inventory";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canManageInventory(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, branch, isSuperAdmin } = await getInventoryPageBranch(
    session.user,
    params.branchId
  );
  if (!branchId) redirect("/inventory");

  const alerts = await getInventoryAlerts(branchId);

  return (
    <PortalShell title="Alerts" subtitle={branch?.name} nav={INVENTORY_NAV}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Inventory alerts</h1>
      {isSuperAdmin && (
        <InventoryBranchPicker branchId={branchId} branches={branches} basePath="/inventory/alerts" />
      )}
      <InventoryAlertsPanel alerts={alerts} branchId={isSuperAdmin ? branchId : ""} />
    </PortalShell>
  );
}
