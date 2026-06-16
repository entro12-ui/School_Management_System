"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImsTransactionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/input";
import { recordImsStockTransaction } from "@/lib/actions/inventory";
import type {
  ImsItemRow,
  ImsLocationRow,
  ImsTransactionRow,
} from "@/lib/services/inventory";
import { HrFeedback } from "@/components/hr/hr-feedback";

const ADD_TYPES = [
  ImsTransactionType.PURCHASE,
  ImsTransactionType.DONATION,
  ImsTransactionType.TRANSFER_IN,
  ImsTransactionType.RETURN,
  ImsTransactionType.ADJUSTMENT,
];

const DEDUCT_TYPES = [
  ImsTransactionType.USAGE,
  ImsTransactionType.ISSUANCE,
  ImsTransactionType.DAMAGE,
  ImsTransactionType.LOSS,
  ImsTransactionType.TRANSFER_OUT,
];

export function InventoryStockManager({
  branchId,
  items,
  locations,
  transactions,
}: {
  branchId: string;
  items: ImsItemRow[];
  locations: ImsLocationRow[];
  transactions: ImsTransactionRow[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"add" | "deduct" | "transfer">("add");

  const txColumns = useMemo<DataTableColumn<ImsTransactionRow>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        sortable: true,
        sortValue: (r) => r.createdAt,
        cell: (r) => new Date(r.createdAt).toLocaleString(),
      },
      { id: "item", header: "Item", cell: (r) => r.itemName },
      { id: "location", header: "Location", cell: (r) => r.locationName },
      { id: "type", header: "Type", cell: (r) => r.transactionType },
      {
        id: "qty",
        header: "Qty",
        cell: (r) => (
          <span className={r.quantity < 0 ? "text-red-600" : "text-emerald-600"}>
            {r.quantity > 0 ? "+" : ""}
            {r.quantity}
          </span>
        ),
      },
      { id: "balance", header: "Balance", cell: (r) => r.balanceAfter },
      { id: "by", header: "By", cell: (r) => r.performedBy },
    ],
    []
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("branchId", branchId);
    startTransition(async () => {
      const res = await recordImsStockTransaction(fd);
      if (res.success) {
        setMessage(res.message);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else setError(res.error);
    });
  }

  const types =
    mode === "add" ? ADD_TYPES : mode === "deduct" ? DEDUCT_TYPES : [ImsTransactionType.TRANSFER_OUT];

  return (
    <div className="space-y-6">
      <HrFeedback message={message} error={error} />

      <div className="flex gap-2">
        {(["add", "deduct", "transfer"] as const).map((m) => (
          <Button
            key={m}
            type="button"
            variant={mode === m ? "default" : "outline"}
            onClick={() => setMode(m)}
          >
            {m === "add" ? "Add stock" : m === "deduct" ? "Deduct stock" : "Transfer"}
          </Button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        <Field label="Item">
          <Select name="itemId" required defaultValue="">
            <option value="" disabled>
              Select item
            </option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.sku}) — {i.totalStock} {i.unit}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={mode === "transfer" ? "From location" : "Location"}>
          <Select name="locationId" required defaultValue="">
            <option value="" disabled>
              Select location
            </option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        {mode === "transfer" && (
          <Field label="To location">
            <Select name="toLocationId" required defaultValue="">
              <option value="" disabled>
                Select destination
              </option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Transaction type">
          <Select name="transactionType" required defaultValue={types[0]}>
            {types.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quantity">
          <Input name="quantity" type="number" min={1} required />
        </Field>
        <Field label="Reference">
          <Input name="reference" placeholder="PO-001, donation ref" />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Input name="notes" />
        </Field>
        <Button type="submit" disabled={pending}>
          Record transaction
        </Button>
      </form>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent transactions</h2>
        <DataTable
          data={transactions}
          columns={txColumns}
          rowKey={(r) => r.id}
          searchPlaceholder="Search transactions…"
          getSearchText={(r) =>
            `${r.itemName} ${r.locationName} ${r.transactionType} ${r.performedBy}`
          }
        />
      </div>
    </div>
  );
}
