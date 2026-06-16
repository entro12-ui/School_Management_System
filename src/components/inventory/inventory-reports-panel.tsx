"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  AssetAllocationRow,
  PurchaseHistoryRow,
  StockReportRow,
  UsageReportRow,
} from "@/lib/services/inventory-reports";

export function InventoryReportsPanel({
  branchId,
  stockReport,
  usageReport,
  assetReport,
  purchaseReport,
}: {
  branchId: string;
  stockReport: StockReportRow[];
  usageReport: UsageReportRow[];
  assetReport: AssetAllocationRow[];
  purchaseReport: PurchaseHistoryRow[];
}) {
  const exportBase = `/api/inventory/reports/export?branchId=${branchId}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href={`${exportBase}&type=stock&format=csv`}>
          <Button type="button" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export stock (CSV)
          </Button>
        </Link>
        <Link href={`${exportBase}&type=purchase&format=csv`}>
          <Button type="button" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export purchases (CSV)
          </Button>
        </Link>
      </div>

      <ReportSection title="Current stock" count={stockReport.length}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stockReport.slice(0, 50).map((r) => (
              <tr key={r.sku}>
                <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 text-slate-600">{r.category}</td>
                <td className="px-3 py-2">
                  {r.totalStock} {r.unit}
                  {r.totalStock <= r.minStock && (
                    <span className="ml-1 text-xs text-amber-600">low</span>
                  )}
                </td>
                <td className="px-3 py-2">{r.totalValue != null ? `${r.totalValue} ETB` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportSection>

      <ReportSection title="Usage (deductions)" count={usageReport.length}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usageReport.slice(0, 30).map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2">{r.itemName}</td>
                <td className="px-3 py-2 text-slate-600">{r.transactionType}</td>
                <td className="px-3 py-2">{r.locationName}</td>
                <td className="px-3 py-2">{r.totalQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportSection>

      <ReportSection title="Asset allocation" count={assetReport.length}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Assigned to</th>
              <th className="px-3 py-2">Since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assetReport.map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2 font-mono text-xs">{r.assetCode}</td>
                <td className="px-3 py-2">{r.itemName}</td>
                <td className="px-3 py-2">{r.assignee}</td>
                <td className="px-3 py-2">{r.assignedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportSection>

      <ReportSection title="Purchase history" count={purchaseReport.length}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">PO #</th>
              <th className="px-3 py-2">Supplier</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Finance note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchaseReport.map((r) => (
              <tr key={r.poNumber}>
                <td className="px-3 py-2 font-mono text-xs">{r.poNumber}</td>
                <td className="px-3 py-2">{r.supplier}</td>
                <td className="px-3 py-2">{r.totalAmount} ETB</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2 text-slate-600">{r.financeNote ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportSection>
    </div>
  );
}

function ReportSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="font-semibold text-slate-900">
          {title} <span className="text-sm font-normal text-slate-500">({count})</span>
        </h2>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
