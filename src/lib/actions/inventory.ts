"use server";

import {
  ImsAssetStatus,
  ImsPurchaseOrderStatus,
  ImsRequestStatus,
  ImsTransactionType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { assertUserCanAccessBranch } from "@/lib/auth/super-admin-scope";
import { logImsAudit } from "@/lib/inventory/audit";
import { adjustStock, transferStock } from "@/lib/inventory/stock";
import { prisma } from "@/lib/prisma";
import {
  canManageInventory,
  canRequestInventory,
} from "@/lib/services/inventory";
import {
  imsAssetAssignmentSchema,
  imsAssetSchema,
  imsCategorySchema,
  imsItemSchema,
  imsLocationSchema,
  imsPurchaseOrderActionSchema,
  imsPurchaseOrderSchema,
  imsRequestActionSchema,
  imsRequestSchema,
  imsStockTransactionSchema,
  imsSupplierSchema,
} from "@/lib/validations/inventory";

export type InventoryActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

const INVENTORY_PATHS = [
  "/inventory",
  "/inventory/items",
  "/inventory/categories",
  "/inventory/locations",
  "/inventory/stock",
  "/inventory/assets",
  "/inventory/requests",
  "/inventory/suppliers",
  "/inventory/purchase-orders",
  "/inventory/reports",
  "/inventory/alerts",
  "/teacher/inventory-requests",
];

function revalidateInventory() {
  for (const p of INVENTORY_PATHS) revalidatePath(p);
}

async function assertInventoryManage(branchId: string) {
  const session = await auth();
  if (!session?.user || !canManageInventory(session.user.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }
  const access = await assertUserCanAccessBranch(session.user, branchId);
  if (!access.ok) return { ok: false as const, error: access.error };
  return { ok: true as const, session };
}

async function assertInventoryRequest(branchId: string) {
  const session = await auth();
  if (!session?.user || !canRequestInventory(session.user.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }
  const access = await assertUserCanAccessBranch(session.user, branchId);
  if (!access.ok) return { ok: false as const, error: access.error };
  return { ok: true as const, session };
}

function generateAssetCode(): string {
  return `AST-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

export async function saveImsCategory(formData: FormData): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsCategorySchema.safeParse({
    ...raw,
    parentId: raw.parentId || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  if (d.categoryId) {
    await prisma.imsCategory.update({
      where: { id: d.categoryId },
      data: {
        name: d.name.trim(),
        parentId: d.parentId ?? null,
        description: d.description?.trim() ?? null,
      },
    });
  } else {
    await prisma.imsCategory.create({
      data: {
        branchId: d.branchId,
        name: d.name.trim(),
        parentId: d.parentId ?? null,
        description: d.description?.trim() ?? null,
      },
    });
  }

  await logImsAudit({
    branchId: d.branchId,
    actorId: access.session.user.id,
    action: d.categoryId ? "ims.category.update" : "ims.category.create",
    entity: "ImsCategory",
    entityId: d.categoryId,
    metadata: { name: d.name },
  });

  revalidateInventory();
  return { success: true, message: "Category saved." };
}

export async function saveImsLocation(formData: FormData): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsLocationSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  if (d.locationId) {
    await prisma.imsLocation.update({
      where: { id: d.locationId },
      data: {
        name: d.name.trim(),
        description: d.description?.trim() ?? null,
      },
    });
  } else {
    await prisma.imsLocation.create({
      data: {
        branchId: d.branchId,
        name: d.name.trim(),
        description: d.description?.trim() ?? null,
      },
    });
  }

  revalidateInventory();
  return { success: true, message: "Location saved." };
}

export async function saveImsItem(formData: FormData): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsItemSchema.safeParse({
    ...raw,
    categoryId: raw.categoryId || undefined,
    expiryDate: raw.expiryDate || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  const data = {
    name: d.name.trim(),
    sku: d.sku.trim().toUpperCase(),
    unit: d.unit.trim(),
    itemType: d.itemType,
    minStock: d.minStock,
    categoryId: d.categoryId ?? null,
    description: d.description?.trim() ?? null,
    expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
    unitCost: d.unitCost ?? null,
  };

  if (d.itemId) {
    await prisma.imsItem.update({ where: { id: d.itemId }, data });
  } else {
    await prisma.imsItem.create({ data: { ...data, branchId: d.branchId } });
  }

  await logImsAudit({
    branchId: d.branchId,
    actorId: access.session.user.id,
    action: d.itemId ? "ims.item.update" : "ims.item.create",
    entity: "ImsItem",
    entityId: d.itemId,
    metadata: { sku: d.sku, name: d.name },
  });

  revalidateInventory();
  return { success: true, message: "Item saved." };
}

export async function recordImsStockTransaction(
  formData: FormData
): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsStockTransactionSchema.safeParse({
    ...raw,
    toLocationId: raw.toLocationId || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  if (d.transactionType === ImsTransactionType.TRANSFER_OUT && d.toLocationId) {
    const result = await transferStock({
      branchId: d.branchId,
      itemId: d.itemId,
      fromLocationId: d.locationId,
      toLocationId: d.toLocationId,
      quantity: d.quantity,
      performedById: access.session.user.id,
      notes: d.notes,
    });
    if (!result.ok) return { success: false, error: result.error };
  } else {
    const result = await adjustStock({
      branchId: d.branchId,
      itemId: d.itemId,
      locationId: d.locationId,
      transactionType: d.transactionType,
      quantity: d.quantity,
      performedById: access.session.user.id,
      reference: d.reference,
      notes: d.notes,
    });
    if (!result.ok) return { success: false, error: result.error };
  }

  await logImsAudit({
    branchId: d.branchId,
    actorId: access.session.user.id,
    action: "ims.stock.transaction",
    entity: "ImsTransaction",
    metadata: { itemId: d.itemId, type: d.transactionType, quantity: d.quantity },
  });

  revalidateInventory();
  return { success: true, message: "Stock updated." };
}

export async function saveImsAsset(formData: FormData): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsAssetSchema.safeParse({
    ...raw,
    locationId: raw.locationId || undefined,
    purchaseDate: raw.purchaseDate || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  const item = await prisma.imsItem.findFirst({
    where: { id: d.itemId, branchId: d.branchId, itemType: "NON_CONSUMABLE" },
  });
  if (!item) {
    return { success: false, error: "Asset item not found or not a non-consumable type." };
  }

  const assetCode = d.assetCode.trim().toUpperCase() || generateAssetCode();

  if (d.assetId) {
    await prisma.imsAsset.update({
      where: { id: d.assetId },
      data: {
        assetCode,
        serialNumber: d.serialNumber?.trim() ?? null,
        status: d.status ?? ImsAssetStatus.ACTIVE,
        locationId: d.locationId ?? null,
        purchaseDate: d.purchaseDate ? new Date(d.purchaseDate) : null,
        purchaseCost: d.purchaseCost ?? null,
        notes: d.notes?.trim() ?? null,
      },
    });
  } else {
    await prisma.imsAsset.create({
      data: {
        branchId: d.branchId,
        itemId: d.itemId,
        assetCode,
        serialNumber: d.serialNumber?.trim() ?? null,
        status: d.status ?? ImsAssetStatus.ACTIVE,
        locationId: d.locationId ?? null,
        purchaseDate: d.purchaseDate ? new Date(d.purchaseDate) : null,
        purchaseCost: d.purchaseCost ?? null,
        notes: d.notes?.trim() ?? null,
      },
    });
  }

  revalidateInventory();
  return { success: true, message: "Asset saved." };
}

export async function assignImsAsset(formData: FormData): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsAssetAssignmentSchema.safeParse({
    ...raw,
    staffProfileId: raw.staffProfileId || undefined,
    classId: raw.classId || undefined,
    departmentName: raw.departmentName || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  const asset = await prisma.imsAsset.findFirst({
    where: { id: d.assetId, branchId: d.branchId },
    include: { assignments: { where: { returnedAt: null } } },
  });
  if (!asset) return { success: false, error: "Asset not found." };
  if (asset.assignments.length > 0) {
    return { success: false, error: "Asset is already assigned. Return it first." };
  }

  await prisma.imsAssetAssignment.create({
    data: {
      assetId: d.assetId,
      targetType: d.targetType,
      staffProfileId: d.staffProfileId ?? null,
      classId: d.classId ?? null,
      departmentName: d.departmentName?.trim() ?? null,
      assignedById: access.session.user.id,
      notes: d.notes?.trim() ?? null,
    },
  });

  await prisma.imsAsset.update({
    where: { id: d.assetId },
    data: { status: ImsAssetStatus.ACTIVE },
  });

  revalidateInventory();
  return { success: true, message: "Asset assigned." };
}

export async function returnImsAsset(formData: FormData): Promise<InventoryActionResult> {
  const assetId = formData.get("assetId") as string;
  const branchId = formData.get("branchId") as string;
  const status = (formData.get("status") as ImsAssetStatus) ?? ImsAssetStatus.ACTIVE;

  const access = await assertInventoryManage(branchId);
  if (!access.ok) return { success: false, error: access.error };

  const assignment = await prisma.imsAssetAssignment.findFirst({
    where: { assetId, returnedAt: null, asset: { branchId } },
  });
  if (!assignment) return { success: false, error: "No active assignment found." };

  await prisma.imsAssetAssignment.update({
    where: { id: assignment.id },
    data: { returnedAt: new Date() },
  });

  await prisma.imsAsset.update({
    where: { id: assetId },
    data: { status },
  });

  revalidateInventory();
  return { success: true, message: "Asset returned." };
}

export async function submitImsRequest(formData: FormData): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryRequest(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  const item = await prisma.imsItem.findFirst({
    where: { id: d.itemId, branchId: d.branchId, isActive: true },
  });
  if (!item) return { success: false, error: "Item not found." };

  await prisma.imsRequest.create({
    data: {
      branchId: d.branchId,
      requesterId: access.session.user.id,
      purpose: d.purpose?.trim() ?? null,
      lines: {
        create: {
          itemId: d.itemId,
          quantity: d.quantity,
          notes: d.notes?.trim() ?? null,
        },
      },
    },
  });

  revalidateInventory();
  return { success: true, message: "Request submitted." };
}

export async function approveImsRequest(formData: FormData): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsRequestActionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  const request = await prisma.imsRequest.findFirst({
    where: { id: d.requestId, branchId: d.branchId, status: ImsRequestStatus.PENDING },
    include: { lines: true },
  });
  if (!request) return { success: false, error: "Request not found or already processed." };

  await prisma.imsRequest.update({
    where: { id: d.requestId },
    data: {
      status: ImsRequestStatus.APPROVED,
      approvedById: access.session.user.id,
      approvedAt: new Date(),
    },
  });

  revalidateInventory();
  return { success: true, message: "Request approved." };
}

export async function rejectImsRequest(formData: FormData): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsRequestActionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  await prisma.imsRequest.updateMany({
    where: { id: d.requestId, branchId: d.branchId, status: ImsRequestStatus.PENDING },
    data: {
      status: ImsRequestStatus.REJECTED,
      approvedById: access.session.user.id,
      approvedAt: new Date(),
      rejectReason: d.rejectReason?.trim() ?? "Rejected",
    },
  });

  revalidateInventory();
  return { success: true, message: "Request rejected." };
}

export async function fulfillImsRequest(formData: FormData): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsRequestActionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  if (!d.locationId) {
    return { success: false, error: "Location is required for fulfillment." };
  }

  const request = await prisma.imsRequest.findFirst({
    where: { id: d.requestId, branchId: d.branchId, status: ImsRequestStatus.APPROVED },
    include: { lines: true },
  });
  if (!request) return { success: false, error: "Approved request not found." };

  for (const line of request.lines) {
    const remaining = line.quantity - line.fulfilledQty;
    if (remaining <= 0) continue;

    const result = await adjustStock({
      branchId: d.branchId,
      itemId: line.itemId,
      locationId: d.locationId,
      transactionType: ImsTransactionType.ISSUANCE,
      quantity: remaining,
      performedById: access.session.user.id,
      reference: `REQ-${request.id.slice(-8)}`,
      notes: `Fulfilled request from ${request.requesterId}`,
    });
    if (!result.ok) return { success: false, error: result.error };

    await prisma.imsRequestLine.update({
      where: { id: line.id },
      data: { fulfilledQty: line.quantity },
    });
  }

  await prisma.imsRequest.update({
    where: { id: d.requestId },
    data: { status: ImsRequestStatus.FULFILLED, fulfilledAt: new Date() },
  });

  revalidateInventory();
  return { success: true, message: "Request fulfilled and stock issued." };
}

export async function saveImsSupplier(formData: FormData): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsSupplierSchema.safeParse({
    ...raw,
    email: raw.email || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  const data = {
    name: d.name.trim(),
    contactPerson: d.contactPerson?.trim() ?? null,
    email: d.email?.trim() || null,
    phone: d.phone?.trim() ?? null,
    address: d.address?.trim() ?? null,
  };

  if (d.supplierId) {
    await prisma.imsSupplier.update({ where: { id: d.supplierId }, data });
  } else {
    await prisma.imsSupplier.create({ data: { ...data, branchId: d.branchId } });
  }

  revalidateInventory();
  return { success: true, message: "Supplier saved." };
}

export async function saveImsPurchaseOrder(
  formData: FormData
): Promise<InventoryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = imsPurchaseOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };
  const d = parsed.data;

  const totalAmount = d.quantity * d.unitPrice;

  if (d.purchaseOrderId) {
    await prisma.imsPurchaseOrder.update({
      where: { id: d.purchaseOrderId },
      data: {
        notes: d.notes?.trim() ?? null,
        financeNote: d.financeNote?.trim() ?? null,
        totalAmount,
      },
    });
  } else {
    await prisma.imsPurchaseOrder.create({
      data: {
        branchId: d.branchId,
        supplierId: d.supplierId,
        poNumber: d.poNumber.trim().toUpperCase(),
        totalAmount,
        notes: d.notes?.trim() ?? null,
        financeNote: d.financeNote?.trim() ?? null,
        createdById: access.session.user.id,
        lines: {
          create: {
            itemId: d.itemId,
            quantity: d.quantity,
            unitPrice: d.unitPrice,
          },
        },
      },
    });
  }

  revalidateInventory();
  return { success: true, message: "Purchase order saved." };
}

export async function submitImsPurchaseOrderForApproval(
  formData: FormData
): Promise<InventoryActionResult> {
  const parsed = imsPurchaseOrderActionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };

  await prisma.imsPurchaseOrder.updateMany({
    where: {
      id: parsed.data.purchaseOrderId,
      branchId: parsed.data.branchId,
      status: ImsPurchaseOrderStatus.DRAFT,
    },
    data: { status: ImsPurchaseOrderStatus.PENDING_APPROVAL },
  });

  revalidateInventory();
  return { success: true, message: "Purchase order submitted for approval." };
}

export async function approveImsPurchaseOrder(
  formData: FormData
): Promise<InventoryActionResult> {
  const parsed = imsPurchaseOrderActionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };

  await prisma.imsPurchaseOrder.updateMany({
    where: {
      id: parsed.data.purchaseOrderId,
      branchId: parsed.data.branchId,
      status: ImsPurchaseOrderStatus.PENDING_APPROVAL,
    },
    data: {
      status: ImsPurchaseOrderStatus.APPROVED,
      approvedById: access.session.user.id,
      approvedAt: new Date(),
    },
  });

  revalidateInventory();
  return { success: true, message: "Purchase order approved." };
}

export async function receiveImsPurchaseOrder(
  formData: FormData
): Promise<InventoryActionResult> {
  const parsed = imsPurchaseOrderActionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertInventoryManage(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };

  if (!parsed.data.locationId) {
    return { success: false, error: "Receiving location is required." };
  }

  const po = await prisma.imsPurchaseOrder.findFirst({
    where: {
      id: parsed.data.purchaseOrderId,
      branchId: parsed.data.branchId,
      status: ImsPurchaseOrderStatus.APPROVED,
    },
    include: { lines: true },
  });
  if (!po) return { success: false, error: "Approved purchase order not found." };

  for (const line of po.lines) {
    const toReceive = line.quantity - line.receivedQty;
    if (toReceive <= 0) continue;

    const result = await adjustStock({
      branchId: parsed.data.branchId,
      itemId: line.itemId,
      locationId: parsed.data.locationId,
      transactionType: ImsTransactionType.PURCHASE,
      quantity: toReceive,
      performedById: access.session.user.id,
      reference: po.poNumber,
      notes: `Received PO ${po.poNumber}`,
    });
    if (!result.ok) return { success: false, error: result.error };

    await prisma.imsPurchaseOrderLine.update({
      where: { id: line.id },
      data: { receivedQty: line.quantity },
    });
  }

  await prisma.imsPurchaseOrder.update({
    where: { id: po.id },
    data: { status: ImsPurchaseOrderStatus.RECEIVED, receivedAt: new Date() },
  });

  await logImsAudit({
    branchId: parsed.data.branchId,
    actorId: access.session.user.id,
    action: "ims.po.receive",
    entity: "ImsPurchaseOrder",
    entityId: po.id,
    metadata: { poNumber: po.poNumber, totalAmount: Number(po.totalAmount) },
  });

  revalidateInventory();
  return { success: true, message: "Purchase order received and stock added." };
}
