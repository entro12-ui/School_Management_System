import { PortalShell } from "@/components/layout/portal-shell";
import { InventoryBranchPicker } from "@/components/inventory/inventory-branch-picker";
import { InventoryPurchaseOrdersManager } from "@/components/inventory/inventory-purchase-orders-manager";
import { auth } from "@/lib/auth";
import { INVENTORY_NAV } from "@/lib/nav/inventory-nav";
import {
  canManageInventory,
  getInventoryItems,
  getInventoryLocations,
  getInventoryPageBranch,
  getInventoryPurchaseOrders,
  getInventorySuppliers,
} from "@/lib/services/inventory";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryPurchaseOrdersPage({
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

  const [orders, suppliers, items, locations] = await Promise.all([
    getInventoryPurchaseOrders(branchId),
    getInventorySuppliers(branchId),
    getInventoryItems(branchId),
    getInventoryLocations(branchId),
  ]);

  return (
    <PortalShell title="Purchase orders" subtitle={branch?.name} nav={INVENTORY_NAV}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Purchase orders</h1>
      {isSuperAdmin && (
        <InventoryBranchPicker
          branchId={branchId}
          branches={branches}
          basePath="/inventory/purchase-orders"
        />
      )}
      <InventoryPurchaseOrdersManager
        branchId={branchId}
        orders={orders}
        suppliers={suppliers}
        items={items}
        locations={locations}
      />
    </PortalShell>
  );
}
