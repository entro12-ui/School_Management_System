import { PortalShell } from "@/components/layout/portal-shell";
import { InventoryBranchPicker } from "@/components/inventory/inventory-branch-picker";
import { InventoryCategoriesManager } from "@/components/inventory/inventory-categories-manager";
import { auth } from "@/lib/auth";
import { INVENTORY_NAV } from "@/lib/nav/inventory-nav";
import {
  canManageInventory,
  getInventoryCategories,
  getInventoryPageBranch,
} from "@/lib/services/inventory";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryCategoriesPage({
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

  const categories = await getInventoryCategories(branchId);

  return (
    <PortalShell title="Categories" subtitle={branch?.name} nav={INVENTORY_NAV}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Categories</h1>
      {isSuperAdmin && (
        <InventoryBranchPicker branchId={branchId} branches={branches} basePath="/inventory/categories" />
      )}
      <InventoryCategoriesManager branchId={branchId} categories={categories} />
    </PortalShell>
  );
}
