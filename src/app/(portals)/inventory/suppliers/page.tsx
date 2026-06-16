import { PortalShell } from "@/components/layout/portal-shell";
import { InventoryBranchPicker } from "@/components/inventory/inventory-branch-picker";
import { InventorySuppliersManager } from "@/components/inventory/inventory-suppliers-manager";
import { auth } from "@/lib/auth";
import { INVENTORY_NAV } from "@/lib/nav/inventory-nav";
import {
  canManageInventory,
  getInventoryPageBranch,
  getInventorySuppliers,
} from "@/lib/services/inventory";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventorySuppliersPage({
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

  const suppliers = await getInventorySuppliers(branchId);

  return (
    <PortalShell title="Suppliers" subtitle={branch?.name} nav={INVENTORY_NAV}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Suppliers</h1>
      {isSuperAdmin && (
        <InventoryBranchPicker branchId={branchId} branches={branches} basePath="/inventory/suppliers" />
      )}
      <InventorySuppliersManager branchId={branchId} suppliers={suppliers} />
    </PortalShell>
  );
}
