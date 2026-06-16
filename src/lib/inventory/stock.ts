import type { ImsTransactionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type StockAdjustInput = {
  branchId: string;
  itemId: string;
  locationId: string;
  transactionType: ImsTransactionType;
  quantity: number;
  performedById: string;
  assetId?: string;
  reference?: string;
  notes?: string;
};

export type StockAdjustResult =
  | { ok: true; balanceAfter: number; transactionId: string }
  | { ok: false; error: string };

const INBOUND_TYPES: ImsTransactionType[] = [
  "PURCHASE",
  "DONATION",
  "TRANSFER_IN",
  "RETURN",
  "ADJUSTMENT",
];

function isInbound(type: ImsTransactionType, quantity: number): boolean {
  if (type === "ADJUSTMENT") return quantity > 0;
  return INBOUND_TYPES.includes(type);
}

/** Pure helper for computing signed stock delta (exported for tests). */
export function computeStockDelta(
  transactionType: ImsTransactionType,
  quantity: number
): number {
  const inbound = isInbound(transactionType, quantity);
  return inbound ? Math.abs(quantity) : -Math.abs(quantity);
}

export async function adjustStock(
  input: StockAdjustInput,
  tx?: Prisma.TransactionClient
): Promise<StockAdjustResult> {
  const db = tx ?? prisma;
  const delta = computeStockDelta(input.transactionType, input.quantity);

  const item = await db.imsItem.findFirst({
    where: { id: input.itemId, branchId: input.branchId, isActive: true },
  });
  if (!item) return { ok: false, error: "Item not found." };

  const location = await db.imsLocation.findFirst({
    where: { id: input.locationId, branchId: input.branchId, isActive: true },
  });
  if (!location) return { ok: false, error: "Location not found." };

  const balance = await db.imsStockBalance.upsert({
    where: {
      itemId_locationId: { itemId: input.itemId, locationId: input.locationId },
    },
    create: { itemId: input.itemId, locationId: input.locationId, quantity: 0 },
    update: {},
  });

  const newQty = balance.quantity + delta;
  if (newQty < 0) {
    return {
      ok: false,
      error: `Insufficient stock. Available: ${balance.quantity}, requested: ${Math.abs(delta)}.`,
    };
  }

  await db.imsStockBalance.update({
    where: { id: balance.id },
    data: { quantity: newQty },
  });

  const transaction = await db.imsTransaction.create({
    data: {
      branchId: input.branchId,
      itemId: input.itemId,
      locationId: input.locationId,
      assetId: input.assetId ?? null,
      transactionType: input.transactionType,
      quantity: delta,
      balanceAfter: newQty,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      performedById: input.performedById,
    },
  });

  return { ok: true, balanceAfter: newQty, transactionId: transaction.id };
}

export async function transferStock(
  input: {
    branchId: string;
    itemId: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    performedById: string;
    notes?: string;
  },
  tx?: Prisma.TransactionClient
): Promise<StockAdjustResult> {
  const run = async (client: Prisma.TransactionClient) => {
    const out = await adjustStock(
      {
        branchId: input.branchId,
        itemId: input.itemId,
        locationId: input.fromLocationId,
        transactionType: "TRANSFER_OUT",
        quantity: input.quantity,
        performedById: input.performedById,
        notes: input.notes,
      },
      client
    );
    if (!out.ok) return out;

    const inn = await adjustStock(
      {
        branchId: input.branchId,
        itemId: input.itemId,
        locationId: input.toLocationId,
        transactionType: "TRANSFER_IN",
        quantity: input.quantity,
        performedById: input.performedById,
        notes: input.notes,
      },
      client
    );
    return inn;
  };

  if (tx) return run(tx);
  return prisma.$transaction((client) => run(client));
}

export async function getItemTotalStock(itemId: string): Promise<number> {
  const agg = await prisma.imsStockBalance.aggregate({
    where: { itemId },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}
