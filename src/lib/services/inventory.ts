import type { UserRole } from "@prisma/client";
import {
  ImsAssetStatus,
  ImsItemType,
  ImsPurchaseOrderStatus,
  ImsRequestStatus,
  ImsTransactionType,
} from "@prisma/client";
import {
  resolveOrganizationPageBranch,
  type BranchScopeUser,
} from "@/lib/auth/super-admin-scope";
import { prisma } from "@/lib/prisma";
import { getItemTotalStock } from "@/lib/inventory/stock";

const MANAGE_ROLES: UserRole[] = ["INVENTORY_OFFICER", "BRANCH_ADMIN", "SUPER_ADMIN"];
const REQUEST_ROLES: UserRole[] = [
  "TEACHER",
  "HR_OFFICER",
  "REGISTRAR",
  "FINANCE_OFFICER",
  "LIBRARIAN",
];
const REPORT_ROLES: UserRole[] = [...MANAGE_ROLES, "FINANCE_OFFICER"];

export function canManageInventory(role: UserRole): boolean {
  return MANAGE_ROLES.includes(role);
}

export function canRequestInventory(role: UserRole): boolean {
  return REQUEST_ROLES.includes(role) || canManageInventory(role);
}

export function canViewInventoryReports(role: UserRole): boolean {
  return REPORT_ROLES.includes(role);
}

export function canAccessInventory(role: UserRole): boolean {
  return canManageInventory(role) || canRequestInventory(role) || canViewInventoryReports(role);
}

export async function getInventoryPageBranch(
  user: BranchScopeUser,
  searchBranchId?: string
) {
  return resolveOrganizationPageBranch(user, searchBranchId);
}

export async function getInventoryDashboardStats(branchId: string) {
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const [
    totalItems,
    consumables,
    assets,
    pendingRequests,
    lowStockItems,
    expiringSoon,
    damagedAssets,
    recentTransactions,
    purchaseOrdersPending,
  ] = await Promise.all([
    prisma.imsItem.count({ where: { branchId, isActive: true } }),
    prisma.imsItem.count({
      where: { branchId, isActive: true, itemType: ImsItemType.CONSUMABLE },
    }),
    prisma.imsAsset.count({ where: { branchId, status: ImsAssetStatus.ACTIVE } }),
    prisma.imsRequest.count({
      where: { branchId, status: ImsRequestStatus.PENDING },
    }),
    prisma.imsItem.findMany({
      where: { branchId, isActive: true },
      include: { balances: true },
    }),
    prisma.imsItem.count({
      where: {
        branchId,
        isActive: true,
        expiryDate: { lte: thirtyDays, gte: now },
      },
    }),
    prisma.imsAsset.count({
      where: { branchId, status: ImsAssetStatus.DAMAGED },
    }),
    prisma.imsTransaction.count({
      where: { branchId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    }),
    prisma.imsPurchaseOrder.count({
      where: {
        branchId,
        status: { in: [ImsPurchaseOrderStatus.PENDING_APPROVAL, ImsPurchaseOrderStatus.APPROVED] },
      },
    }),
  ]);

  let lowStockCount = 0;
  for (const item of lowStockItems) {
    const total = item.balances.reduce((s, b) => s + b.quantity, 0);
    if (total <= item.minStock) lowStockCount++;
  }

  return {
    totalItems,
    consumables,
    assets,
    pendingRequests,
    lowStockCount,
    expiringSoon,
    damagedAssets,
    recentTransactions,
    purchaseOrdersPending,
  };
}

export type ImsItemRow = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  itemType: ImsItemType;
  minStock: number;
  totalStock: number;
  categoryName: string | null;
  expiryDate: string | null;
  unitCost: number | null;
  isLowStock: boolean;
};

export async function getInventoryItems(branchId: string): Promise<ImsItemRow[]> {
  const items = await prisma.imsItem.findMany({
    where: { branchId, isActive: true },
    include: {
      category: { select: { name: true } },
      balances: true,
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return items.map((item) => {
    const totalStock = item.balances.reduce((s, b) => s + b.quantity, 0);
    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      unit: item.unit,
      itemType: item.itemType,
      minStock: item.minStock,
      totalStock,
      categoryName: item.category?.name ?? null,
      expiryDate: item.expiryDate?.toISOString().slice(0, 10) ?? null,
      unitCost: item.unitCost ? Number(item.unitCost) : null,
      isLowStock: totalStock <= item.minStock,
    };
  });
}

export type ImsCategoryRow = {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  itemCount: number;
  childCount: number;
};

export async function getInventoryCategories(branchId: string): Promise<ImsCategoryRow[]> {
  const categories = await prisma.imsCategory.findMany({
    where: { branchId },
    include: {
      parent: { select: { name: true } },
      _count: { select: { items: true, children: true } },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
    parentName: c.parent?.name ?? null,
    itemCount: c._count.items,
    childCount: c._count.children,
  }));
}

export type ImsLocationRow = {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  totalQuantity: number;
};

export async function getInventoryLocations(branchId: string): Promise<ImsLocationRow[]> {
  const locations = await prisma.imsLocation.findMany({
    where: { branchId, isActive: true },
    include: { balances: true },
    orderBy: { name: "asc" },
  });

  return locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    description: loc.description,
    itemCount: loc.balances.filter((b) => b.quantity > 0).length,
    totalQuantity: loc.balances.reduce((s, b) => s + b.quantity, 0),
  }));
}

export type ImsTransactionRow = {
  id: string;
  itemName: string;
  sku: string;
  locationName: string;
  transactionType: ImsTransactionType;
  quantity: number;
  balanceAfter: number;
  reference: string | null;
  notes: string | null;
  performedBy: string;
  createdAt: string;
};

export async function getInventoryTransactions(
  branchId: string,
  limit = 100
): Promise<ImsTransactionRow[]> {
  const rows = await prisma.imsTransaction.findMany({
    where: { branchId },
    include: {
      item: { select: { name: true, sku: true } },
      location: { select: { name: true } },
      performedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((t) => ({
    id: t.id,
    itemName: t.item.name,
    sku: t.item.sku,
    locationName: t.location.name,
    transactionType: t.transactionType,
    quantity: t.quantity,
    balanceAfter: t.balanceAfter,
    reference: t.reference,
    notes: t.notes,
    performedBy: `${t.performedBy.firstName} ${t.performedBy.lastName}`,
    createdAt: t.createdAt.toISOString(),
  }));
}

export type ImsAssetRow = {
  id: string;
  assetCode: string;
  serialNumber: string | null;
  itemName: string;
  status: ImsAssetStatus;
  locationName: string | null;
  assignee: string | null;
};

export async function getInventoryAssets(branchId: string): Promise<ImsAssetRow[]> {
  const assets = await prisma.imsAsset.findMany({
    where: { branchId },
    include: {
      item: { select: { name: true } },
      location: { select: { name: true } },
      assignments: {
        where: { returnedAt: null },
        include: {
          staffProfile: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          class: { select: { name: true } },
        },
        take: 1,
        orderBy: { assignedAt: "desc" },
      },
    },
    orderBy: { assetCode: "asc" },
  });

  return assets.map((a) => {
    const active = a.assignments[0];
    let assignee: string | null = null;
    if (active) {
      if (active.staffProfile) {
        assignee = `${active.staffProfile.user.firstName} ${active.staffProfile.user.lastName}`;
      } else if (active.class) {
        assignee = active.class.name;
      } else if (active.departmentName) {
        assignee = active.departmentName;
      }
    }
    return {
      id: a.id,
      assetCode: a.assetCode,
      serialNumber: a.serialNumber,
      itemName: a.item.name,
      status: a.status,
      locationName: a.location?.name ?? null,
      assignee,
    };
  });
}

export type ImsRequestRow = {
  id: string;
  requesterName: string;
  status: ImsRequestStatus;
  purpose: string | null;
  itemSummary: string;
  totalQty: number;
  createdAt: string;
  approvedAt: string | null;
};

export async function getInventoryRequests(
  branchId: string,
  requesterId?: string
): Promise<ImsRequestRow[]> {
  const requests = await prisma.imsRequest.findMany({
    where: {
      branchId,
      ...(requesterId ? { requesterId } : {}),
    },
    include: {
      requester: { select: { firstName: true, lastName: true } },
      lines: { include: { item: { select: { name: true, unit: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => {
    const totalQty = r.lines.reduce((s, l) => s + l.quantity, 0);
    const itemSummary = r.lines
      .map((l) => `${l.item.name} (${l.quantity} ${l.item.unit})`)
      .join(", ");
    return {
      id: r.id,
      requesterName: `${r.requester.firstName} ${r.requester.lastName}`,
      status: r.status,
      purpose: r.purpose,
      itemSummary,
      totalQty,
      createdAt: r.createdAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString() ?? null,
    };
  });
}

export type ImsSupplierRow = {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  orderCount: number;
};

export async function getInventorySuppliers(branchId: string): Promise<ImsSupplierRow[]> {
  const suppliers = await prisma.imsSupplier.findMany({
    where: { branchId, isActive: true },
    include: { _count: { select: { purchaseOrders: true } } },
    orderBy: { name: "asc" },
  });

  return suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    contactPerson: s.contactPerson,
    email: s.email,
    phone: s.phone,
    address: s.address,
    orderCount: s._count.purchaseOrders,
  }));
}

export type ImsPurchaseOrderRow = {
  id: string;
  poNumber: string;
  supplierName: string;
  status: ImsPurchaseOrderStatus;
  totalAmount: number;
  itemSummary: string;
  createdAt: string;
  financeNote: string | null;
};

export async function getInventoryPurchaseOrders(
  branchId: string
): Promise<ImsPurchaseOrderRow[]> {
  const orders = await prisma.imsPurchaseOrder.findMany({
    where: { branchId },
    include: {
      supplier: { select: { name: true } },
      lines: { include: { item: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    supplierName: po.supplier.name,
    status: po.status,
    totalAmount: Number(po.totalAmount),
    itemSummary: po.lines.map((l) => `${l.item.name} ×${l.quantity}`).join(", "),
    createdAt: po.createdAt.toISOString(),
    financeNote: po.financeNote,
  }));
}

export async function getInventoryAlerts(branchId: string) {
  const items = await prisma.imsItem.findMany({
    where: { branchId, isActive: true },
    include: { balances: true },
  });

  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const lowStock = items
    .filter((item) => {
      const total = item.balances.reduce((s, b) => s + b.quantity, 0);
      return total <= item.minStock;
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      total: item.balances.reduce((s, b) => s + b.quantity, 0),
      minStock: item.minStock,
    }));

  const expiring = items
    .filter((item) => item.expiryDate && item.expiryDate <= thirtyDays && item.expiryDate >= now)
    .map((item) => ({
      id: item.id,
      name: item.name,
      expiryDate: item.expiryDate!.toISOString().slice(0, 10),
    }));

  const damaged = await prisma.imsAsset.findMany({
    where: { branchId, status: ImsAssetStatus.DAMAGED },
    include: { item: { select: { name: true } } },
    take: 20,
  });

  return {
    lowStock,
    expiring,
    damaged: damaged.map((a) => ({
      id: a.id,
      assetCode: a.assetCode,
      itemName: a.item.name,
    })),
  };
}

export async function getStaffProfilesForAssignment(branchId: string) {
  return prisma.staffProfile.findMany({
    where: { branchId },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { employeeId: "asc" },
  });
}

export async function getClassesForAssignment(branchId: string) {
  return prisma.class.findMany({
    where: { branchId },
    select: { id: true, name: true, gradeLevel: true },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });
}

export { getItemTotalStock };
