import { ImsItemType } from "@prisma/client";
import { PortalShell } from "@/components/layout/portal-shell";
import { InventoryAssetsManager } from "@/components/inventory/inventory-assets-manager";
import { InventoryBranchPicker } from "@/components/inventory/inventory-branch-picker";
import { auth } from "@/lib/auth";
import { INVENTORY_NAV } from "@/lib/nav/inventory-nav";
import {
  canManageInventory,
  getClassesForAssignment,
  getInventoryAssets,
  getInventoryItems,
  getInventoryLocations,
  getInventoryPageBranch,
  getStaffProfilesForAssignment,
} from "@/lib/services/inventory";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryAssetsPage({
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

  const [assets, items, locations, staffProfiles, classes] = await Promise.all([
    getInventoryAssets(branchId),
    getInventoryItems(branchId),
    getInventoryLocations(branchId),
    getStaffProfilesForAssignment(branchId),
    getClassesForAssignment(branchId),
  ]);

  const assetItems = items.filter((i) => i.itemType === ImsItemType.NON_CONSUMABLE);

  return (
    <PortalShell title="Assets" subtitle={branch?.name} nav={INVENTORY_NAV}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Asset management</h1>
      {isSuperAdmin && (
        <InventoryBranchPicker branchId={branchId} branches={branches} basePath="/inventory/assets" />
      )}
      <InventoryAssetsManager
        branchId={branchId}
        assets={assets}
        assetItems={assetItems}
        locations={locations}
        staffProfiles={staffProfiles.map((s) => ({
          id: s.id,
          employeeId: s.employeeId,
          name: `${s.user.firstName} ${s.user.lastName}`,
        }))}
        classes={classes}
      />
    </PortalShell>
  );
}
