"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImsPurchaseOrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import {
  approveImsPurchaseOrder,
  receiveImsPurchaseOrder,
  saveImsPurchaseOrder,
  submitImsPurchaseOrderForApproval,
} from "@/lib/actions/inventory";
import type {
  ImsItemRow,
  ImsLocationRow,
  ImsPurchaseOrderRow,
  ImsSupplierRow,
} from "@/lib/services/inventory";
import { HrFeedback } from "@/components/hr/hr-feedback";
import { formatCurrency } from "@/lib/utils";

export function InventoryPurchaseOrdersManager({
  branchId,
  orders,
  suppliers,
  items,
  locations,
}: {
  branchId: string;
  orders: ImsPurchaseOrderRow[];
  suppliers: ImsSupplierRow[];
  items: ImsItemRow[];
  locations: ImsLocationRow[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [receiveLocation, setReceiveLocation] = useState(locations[0]?.id ?? "");

  function run(action: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        setMessage(res.message ?? "Done");
        router.refresh();
      } else setError(res.error ?? "Failed");
    });
  }

  return (
    <div className="space-y-6">
      <HrFeedback message={message} error={error} />

      <form
        action={(fd) => {
          fd.set("branchId", branchId);
          run(() => saveImsPurchaseOrder(fd));
        }}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold text-slate-900">Create purchase order</h2>
        <Field label="PO number">
          <Input name="poNumber" required placeholder="PO-2026-001" />
        </Field>
        <Field label="Supplier">
          <Select name="supplierId" required defaultValue="">
            <option value="" disabled>
              Select supplier
            </option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Item">
          <Select name="itemId" required defaultValue="">
            <option value="" disabled>
              Select item
            </option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.sku})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quantity">
          <Input name="quantity" type="number" min={1} required />
        </Field>
        <Field label="Unit price (ETB)">
          <Input name="unitPrice" type="number" min={0} step="0.01" required />
        </Field>
        <Field label="Finance note (links to finance module)">
          <Input name="financeNote" placeholder="Budget line, expense category…" />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Input name="notes" />
        </Field>
        <Button type="submit" disabled={pending}>
          Create PO
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">PO #</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((po) => (
              <tr key={po.id}>
                <td className="px-4 py-3 font-mono text-sm">{po.poNumber}</td>
                <td className="px-4 py-3">{po.supplierName}</td>
                <td className="px-4 py-3 text-slate-600">{po.itemSummary}</td>
                <td className="px-4 py-3">{formatCurrency(po.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{po.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {po.status === ImsPurchaseOrderStatus.DRAFT && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const fd = new FormData();
                          fd.set("purchaseOrderId", po.id);
                          fd.set("branchId", branchId);
                          run(() => submitImsPurchaseOrderForApproval(fd));
                        }}
                      >
                        Submit
                      </Button>
                    )}
                    {po.status === ImsPurchaseOrderStatus.PENDING_APPROVAL && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const fd = new FormData();
                          fd.set("purchaseOrderId", po.id);
                          fd.set("branchId", branchId);
                          run(() => approveImsPurchaseOrder(fd));
                        }}
                      >
                        Approve
                      </Button>
                    )}
                    {po.status === ImsPurchaseOrderStatus.APPROVED && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const fd = new FormData();
                          fd.set("purchaseOrderId", po.id);
                          fd.set("branchId", branchId);
                          fd.set("locationId", receiveLocation);
                          run(() => receiveImsPurchaseOrder(fd));
                        }}
                      >
                        Receive
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {locations.length > 0 && (
        <Field label="Default receiving location">
          <Select value={receiveLocation} onChange={(e) => setReceiveLocation(e.target.value)}>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </div>
  );
}
