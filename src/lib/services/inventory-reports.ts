import { ImsItemType, ImsTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type StockReportRow = {
  sku: string;
  name: string;
  category: string;
  itemType: string;
  unit: string;
  totalStock: number;
  minStock: number;
  unitCost: number | null;
  totalValue: number | null;
};

export async function getStockReport(branchId: string): Promise<StockReportRow[]> {
  const items = await prisma.imsItem.findMany({
    where: { branchId, isActive: true },
    include: {
      category: { select: { name: true } },
      balances: true,
    },
    orderBy: { name: "asc" },
  });

  return items.map((item) => {
    const totalStock = item.balances.reduce((s, b) => s + b.quantity, 0);
    const unitCost = item.unitCost ? Number(item.unitCost) : null;
    return {
      sku: item.sku,
      name: item.name,
      category: item.category?.name ?? "Uncategorized",
      itemType: item.itemType === ImsItemType.CONSUMABLE ? "Consumable" : "Asset",
      unit: item.unit,
      totalStock,
      minStock: item.minStock,
      unitCost,
      totalValue: unitCost != null ? totalStock * unitCost : null,
    };
  });
}

export type UsageReportRow = {
  itemName: string;
  sku: string;
  transactionType: string;
  totalQuantity: number;
  locationName: string;
};

export async function getUsageReport(
  branchId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<UsageReportRow[]> {
  const usageTypes: ImsTransactionType[] = ["USAGE", "ISSUANCE", "DAMAGE", "LOSS"];

  const transactions = await prisma.imsTransaction.findMany({
    where: {
      branchId,
      transactionType: { in: usageTypes },
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    },
    include: {
      item: { select: { name: true, sku: true } },
      location: { select: { name: true } },
    },
  });

  const grouped = new Map<string, UsageReportRow>();
  for (const t of transactions) {
    const key = `${t.itemId}-${t.transactionType}-${t.locationId}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.totalQuantity += Math.abs(t.quantity);
    } else {
      grouped.set(key, {
        itemName: t.item.name,
        sku: t.item.sku,
        transactionType: t.transactionType,
        totalQuantity: Math.abs(t.quantity),
        locationName: t.location.name,
      });
    }
  }

  return [...grouped.values()].sort((a, b) => b.totalQuantity - a.totalQuantity);
}

export type AssetAllocationRow = {
  assetCode: string;
  itemName: string;
  status: string;
  assignee: string;
  assignedAt: string;
};

export async function getAssetAllocationReport(
  branchId: string
): Promise<AssetAllocationRow[]> {
  const assignments = await prisma.imsAssetAssignment.findMany({
    where: { asset: { branchId }, returnedAt: null },
    include: {
      asset: {
        include: { item: { select: { name: true } } },
      },
      staffProfile: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      class: { select: { name: true } },
    },
    orderBy: { assignedAt: "desc" },
  });

  return assignments.map((a) => {
    let assignee = a.departmentName ?? "Unassigned";
    if (a.staffProfile) {
      assignee = `${a.staffProfile.user.firstName} ${a.staffProfile.user.lastName}`;
    } else if (a.class) {
      assignee = a.class.name;
    }
    return {
      assetCode: a.asset.assetCode,
      itemName: a.asset.item.name,
      status: a.asset.status,
      assignee,
      assignedAt: a.assignedAt.toISOString().slice(0, 10),
    };
  });
}

export type PurchaseHistoryRow = {
  poNumber: string;
  supplier: string;
  status: string;
  totalAmount: number;
  items: string;
  createdAt: string;
  receivedAt: string | null;
  financeNote: string | null;
};

export async function getPurchaseHistoryReport(
  branchId: string
): Promise<PurchaseHistoryRow[]> {
  const orders = await prisma.imsPurchaseOrder.findMany({
    where: { branchId },
    include: {
      supplier: { select: { name: true } },
      lines: { include: { item: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((po) => ({
    poNumber: po.poNumber,
    supplier: po.supplier.name,
    status: po.status,
    totalAmount: Number(po.totalAmount),
    items: po.lines.map((l) => `${l.item.name} ×${l.quantity}`).join("; "),
    createdAt: po.createdAt.toISOString().slice(0, 10),
    receivedAt: po.receivedAt?.toISOString().slice(0, 10) ?? null,
    financeNote: po.financeNote,
  }));
}

export function renderStockReportCsv(rows: StockReportRow[]): string {
  const header = "SKU,Name,Category,Type,Unit,Stock,Min Stock,Unit Cost,Total Value";
  const lines = rows.map(
    (r) =>
      `"${r.sku}","${r.name}","${r.category}","${r.itemType}","${r.unit}",${r.totalStock},${r.minStock},${r.unitCost ?? ""},${r.totalValue ?? ""}`
  );
  return [header, ...lines].join("\n");
}

export function renderPurchaseHistoryCsv(rows: PurchaseHistoryRow[]): string {
  const header = "PO Number,Supplier,Status,Amount,Items,Created,Received,Finance Note";
  const lines = rows.map(
    (r) =>
      `"${r.poNumber}","${r.supplier}","${r.status}",${r.totalAmount},"${r.items}","${r.createdAt}","${r.receivedAt ?? ""}","${r.financeNote ?? ""}"`
  );
  return [header, ...lines].join("\n");
}
