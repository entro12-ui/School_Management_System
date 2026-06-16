import {
  ImsAssetStatus,
  ImsAssignmentTarget,
  ImsItemType,
  ImsPurchaseOrderStatus,
  ImsTransactionType,
} from "@prisma/client";
import { z } from "zod";

export const imsCategorySchema = z.object({
  categoryId: z.string().optional(),
  branchId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(120),
  parentId: z.string().optional(),
  description: z.string().max(500).optional(),
});

export const imsLocationSchema = z.object({
  locationId: z.string().optional(),
  branchId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
});

export const imsItemSchema = z.object({
  itemId: z.string().optional(),
  branchId: z.string().min(1),
  categoryId: z.string().optional(),
  name: z.string().min(1, "Name is required").max(200),
  sku: z.string().min(1, "SKU is required").max(64),
  unit: z.string().min(1, "Unit is required").max(32),
  itemType: z.nativeEnum(ImsItemType),
  minStock: z.coerce.number().int().min(0).max(999999),
  description: z.string().max(500).optional(),
  expiryDate: z.string().optional(),
  unitCost: z.coerce.number().min(0).optional(),
});

export const imsStockTransactionSchema = z.object({
  branchId: z.string().min(1),
  itemId: z.string().min(1),
  locationId: z.string().min(1),
  transactionType: z.nativeEnum(ImsTransactionType),
  quantity: z.coerce.number().int().min(1).max(999999),
  reference: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
  toLocationId: z.string().optional(),
});

export const imsAssetSchema = z.object({
  assetId: z.string().optional(),
  branchId: z.string().min(1),
  itemId: z.string().min(1),
  assetCode: z.string().min(1).max(64),
  serialNumber: z.string().max(64).optional(),
  status: z.nativeEnum(ImsAssetStatus).optional(),
  locationId: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const imsAssetAssignmentSchema = z.object({
  branchId: z.string().min(1),
  assetId: z.string().min(1),
  targetType: z.nativeEnum(ImsAssignmentTarget),
  staffProfileId: z.string().optional(),
  classId: z.string().optional(),
  departmentName: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export const imsRequestSchema = z.object({
  branchId: z.string().min(1),
  purpose: z.string().max(500).optional(),
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(9999),
  notes: z.string().max(500).optional(),
});

export const imsRequestActionSchema = z.object({
  requestId: z.string().min(1),
  branchId: z.string().min(1),
  rejectReason: z.string().max(500).optional(),
  locationId: z.string().optional(),
});

export const imsSupplierSchema = z.object({
  supplierId: z.string().optional(),
  branchId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(200),
  contactPerson: z.string().max(120).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(32).optional(),
  address: z.string().max(300).optional(),
});

export const imsPurchaseOrderSchema = z.object({
  purchaseOrderId: z.string().optional(),
  branchId: z.string().min(1),
  supplierId: z.string().min(1),
  poNumber: z.string().min(1).max(64),
  notes: z.string().max(500).optional(),
  financeNote: z.string().max(500).optional(),
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(999999),
  unitPrice: z.coerce.number().min(0),
});

export const imsPurchaseOrderActionSchema = z.object({
  purchaseOrderId: z.string().min(1),
  branchId: z.string().min(1),
  locationId: z.string().optional(),
});
