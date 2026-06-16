import { PortalShell } from "@/components/layout/portal-shell";
import { InventoryBranchPicker } from "@/components/inventory/inventory-branch-picker";
import { InventoryReportsPanel } from "@/components/inventory/inventory-reports-panel";
import { auth } from "@/lib/auth";
import { INVENTORY_NAV } from "@/lib/nav/inventory-nav";
import {
  getAssetAllocationReport,
  getPurchaseHistoryReport,
  getStockReport,
  getUsageReport,
} from "@/lib/services/inventory-reports";
import {
  canViewInventoryReports,
  getInventoryPageBranch,
} from "@/lib/services/inventory";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canViewInventoryReports(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, branch, isSuperAdmin } = await getInventoryPageBranch(
    session.user,
    params.branchId
  );
  if (!branchId) redirect("/inventory");

  const [stockReport, usageReport, assetReport, purchaseReport] = await Promise.all([
    getStockReport(branchId),
    getUsageReport(branchId),
    getAssetAllocationReport(branchId),
    getPurchaseHistoryReport(branchId),
  ]);

  return (
    <PortalShell title="Reports" subtitle={branch?.name} nav={INVENTORY_NAV}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Inventory reports</h1>
      {isSuperAdmin && (
        <InventoryBranchPicker branchId={branchId} branches={branches} basePath="/inventory/reports" />
      )}
      <InventoryReportsPanel
        branchId={branchId}
        stockReport={stockReport}
        usageReport={usageReport}
        assetReport={assetReport}
        purchaseReport={purchaseReport}
      />
    </PortalShell>
  );
}
