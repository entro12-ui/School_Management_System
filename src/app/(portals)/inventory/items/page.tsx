import { PortalShell } from "@/components/layout/portal-shell";
import { InventoryBranchPicker } from "@/components/inventory/inventory-branch-picker";
import { InventoryItemsManager } from "@/components/inventory/inventory-items-manager";
import { auth } from "@/lib/auth";
import { INVENTORY_NAV } from "@/lib/nav/inventory-nav";
import {
  canManageInventory,
  getInventoryCategories,
  getInventoryItems,
  getInventoryPageBranch,
} from "@/lib/services/inventory";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryItemsPage({
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

  const [items, categories] = await Promise.all([
    getInventoryItems(branchId),
    getInventoryCategories(branchId),
  ]);

  return (
    <PortalShell title="Items" subtitle={branch?.name} nav={INVENTORY_NAV}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Item catalog</h1>
      {isSuperAdmin && (
        <InventoryBranchPicker branchId={branchId} branches={branches} basePath="/inventory/items" />
      )}
      <InventoryItemsManager branchId={branchId} items={items} categories={categories} />
    </PortalShell>
  );
}
