import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeStockDelta } from "./stock";
import { imsItemSchema, imsStockTransactionSchema } from "../validations/inventory";

describe("computeStockDelta", () => {
  it("returns positive delta for inbound types", () => {
    assert.equal(computeStockDelta("PURCHASE", 10), 10);
    assert.equal(computeStockDelta("DONATION", 5), 5);
    assert.equal(computeStockDelta("TRANSFER_IN", 3), 3);
    assert.equal(computeStockDelta("RETURN", 2), 2);
  });

  it("returns negative delta for outbound types", () => {
    assert.equal(computeStockDelta("USAGE", 10), -10);
    assert.equal(computeStockDelta("ISSUANCE", 5), -5);
    assert.equal(computeStockDelta("DAMAGE", 1), -1);
    assert.equal(computeStockDelta("LOSS", 2), -2);
    assert.equal(computeStockDelta("TRANSFER_OUT", 4), -4);
  });

  it("handles ADJUSTMENT sign from quantity", () => {
    assert.equal(computeStockDelta("ADJUSTMENT", 7), 7);
    assert.equal(computeStockDelta("ADJUSTMENT", -3), -3);
  });

  it("always uses absolute value for magnitude", () => {
    assert.equal(computeStockDelta("PURCHASE", -10), 10);
    assert.equal(computeStockDelta("USAGE", -5), -5);
  });
});

describe("imsItemSchema", () => {
  it("accepts valid item input", () => {
    const result = imsItemSchema.safeParse({
      branchId: "branch-1",
      name: "Student Chair",
      sku: "CHR-001",
      unit: "pcs",
      itemType: "CONSUMABLE",
      minStock: 10,
    });
    assert.equal(result.success, true);
  });

  it("rejects missing SKU", () => {
    const result = imsItemSchema.safeParse({
      branchId: "branch-1",
      name: "Chair",
      unit: "pcs",
      itemType: "CONSUMABLE",
      minStock: 0,
    });
    assert.equal(result.success, false);
  });

  it("rejects negative minStock", () => {
    const result = imsItemSchema.safeParse({
      branchId: "branch-1",
      name: "Chair",
      sku: "CHR-001",
      unit: "pcs",
      itemType: "CONSUMABLE",
      minStock: -1,
    });
    assert.equal(result.success, false);
  });
});

describe("imsStockTransactionSchema", () => {
  it("accepts valid stock transaction", () => {
    const result = imsStockTransactionSchema.safeParse({
      branchId: "branch-1",
      itemId: "item-1",
      locationId: "loc-1",
      transactionType: "PURCHASE",
      quantity: 10,
    });
    assert.equal(result.success, true);
  });

  it("rejects zero quantity", () => {
    const result = imsStockTransactionSchema.safeParse({
      branchId: "branch-1",
      itemId: "item-1",
      locationId: "loc-1",
      transactionType: "USAGE",
      quantity: 0,
    });
    assert.equal(result.success, false);
  });
});
