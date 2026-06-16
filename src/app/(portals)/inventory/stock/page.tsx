import { PortalShell } from "@/components/layout/portal-shell";
import { InventoryBranchPicker } from "@/components/inventory/inventory-branch-picker";
import { InventoryStockManager } from "@/components/inventory/inventory-stock-manager";
import { auth } from "@/lib/auth";
import { INVENTORY_NAV } from "@/lib/nav/inventory-nav";
import {
  canManageInventory,
  getInventoryItems,
  getInventoryLocations,
  getInventoryPageBranch,
  getInventoryTransactions,
} from "@/lib/services/inventory";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryStockPage({
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

  const [items, locations, transactions] = await Promise.all([
    getInventoryItems(branchId),
    getInventoryLocations(branchId),
    getInventoryTransactions(branchId),
  ]);

  return (
    <PortalShell title="Stock" subtitle={branch?.name} nav={INVENTORY_NAV}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Stock management</h1>
      {isSuperAdmin && (
        <InventoryBranchPicker branchId={branchId} branches={branches} basePath="/inventory/stock" />
      )}
      <InventoryStockManager
        branchId={branchId}
        items={items}
        locations={locations}
        transactions={transactions}
      />
    </PortalShell>
  );
}
