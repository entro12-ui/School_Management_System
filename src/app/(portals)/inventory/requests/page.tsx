import { PortalShell } from "@/components/layout/portal-shell";
import { InventoryBranchPicker } from "@/components/inventory/inventory-branch-picker";
import { InventoryRequestsManager } from "@/components/inventory/inventory-requests-manager";
import { auth } from "@/lib/auth";
import { INVENTORY_NAV } from "@/lib/nav/inventory-nav";
import {
  canManageInventory,
  canRequestInventory,
  getInventoryItems,
  getInventoryLocations,
  getInventoryPageBranch,
  getInventoryRequests,
} from "@/lib/services/inventory";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canRequestInventory(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, branch, isSuperAdmin } = await getInventoryPageBranch(
    session.user,
    params.branchId
  );
  if (!branchId) redirect("/inventory");

  const canManage = canManageInventory(session.user.role);
  const [requests, items, locations] = await Promise.all([
    getInventoryRequests(
      branchId,
      canManage ? undefined : session.user.id
    ),
    getInventoryItems(branchId),
    getInventoryLocations(branchId),
  ]);

  return (
    <PortalShell title="Requests" subtitle={branch?.name} nav={INVENTORY_NAV}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Item requests</h1>
      {isSuperAdmin && (
        <InventoryBranchPicker branchId={branchId} branches={branches} basePath="/inventory/requests" />
      )}
      <InventoryRequestsManager
        branchId={branchId}
        requests={requests}
        items={items}
        locations={locations}
        canManage={canManage}
        canSubmit={canRequestInventory(session.user.role)}
      />
    </PortalShell>
  );
}
