import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { InventoryBranchPicker } from "@/components/inventory/inventory-branch-picker";
import { StatCard } from "@/components/dashboard/stat-card";
import { auth } from "@/lib/auth";
import { INVENTORY_NAV } from "@/lib/nav/inventory-nav";
import {
  canManageInventory,
  getInventoryDashboardStats,
  getInventoryPageBranch,
  getInventoryTransactions,
} from "@/lib/services/inventory";
import {
  AlertTriangle,
  ClipboardCheck,
  Package,
  Briefcase,
  Truck,
  BarChart3,
} from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryDashboardPage({
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

  if (!branchId) {
    return (
      <PortalShell title="Inventory" nav={INVENTORY_NAV}>
        <p className="text-slate-500">No branch configured.</p>
      </PortalShell>
    );
  }

  const q = isSuperAdmin ? `?branchId=${branchId}` : "";
  const [stats, recentTx] = await Promise.all([
    getInventoryDashboardStats(branchId),
    getInventoryTransactions(branchId, 5),
  ]);

  return (
    <PortalShell
      title="Inventory"
      subtitle={branch?.name ?? "Stock & assets"}
      nav={INVENTORY_NAV}
    >
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Inventory dashboard</h1>
      <p className="mb-6 text-slate-500">
        Track stock, assets, procurement, and staff requests across all locations.
      </p>

      {isSuperAdmin && (
        <InventoryBranchPicker branchId={branchId} branches={branches} basePath="/inventory" />
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total items" value={String(stats.totalItems)} icon={Package} />
        <StatCard title="Active assets" value={String(stats.assets)} icon={Briefcase} />
        <StatCard
          title="Low stock alerts"
          value={String(stats.lowStockCount)}
          icon={AlertTriangle}
        />
        <StatCard
          title="Pending requests"
          value={String(stats.pendingRequests)}
          icon={ClipboardCheck}
        />
      </div>

      {(stats.lowStockCount > 0 || stats.expiringSoon > 0 || stats.damagedAssets > 0) && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            {stats.lowStockCount} low stock · {stats.expiringSoon} expiring soon ·{" "}
            {stats.damagedAssets} damaged assets · {stats.purchaseOrdersPending} POs pending
          </p>
          <Link href={`/inventory/alerts${q}`} className="mt-2 inline-block text-sm text-indigo-600">
            View all alerts →
          </Link>
        </div>
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { href: `/inventory/items${q}`, icon: Package, title: "Item catalog", desc: "SKUs, categories, thresholds" },
          { href: `/inventory/stock${q}`, icon: ClipboardCheck, title: "Stock movements", desc: "Add, deduct, transfer" },
          { href: `/inventory/assets${q}`, icon: Briefcase, title: "Assets", desc: "Assign to staff & classrooms" },
          { href: `/inventory/requests${q}`, icon: ClipboardCheck, title: "Requests", desc: `${stats.pendingRequests} pending approval` },
          { href: `/inventory/purchase-orders${q}`, icon: Truck, title: "Purchase orders", desc: "Procurement & finance link" },
          { href: `/inventory/reports${q}`, icon: BarChart3, title: "Reports", desc: "Export stock & usage data" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300"
          >
            <item.icon className="h-10 w-10 shrink-0 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-900">{item.title}</h2>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Recent transactions</h2>
        {recentTx.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {recentTx.map((t) => (
              <li key={t.id} className="flex justify-between py-2">
                <span>
                  {t.itemName} — {t.transactionType} ({t.quantity > 0 ? "+" : ""}
                  {t.quantity})
                </span>
                <span className="text-slate-500">{new Date(t.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PortalShell>
  );
}
