"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImsItemType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/input";
import { saveImsItem } from "@/lib/actions/inventory";
import type { ImsCategoryRow, ImsItemRow } from "@/lib/services/inventory";
import { HrFeedback } from "@/components/hr/hr-feedback";
import { Plus } from "lucide-react";

export function InventoryItemsManager({
  branchId,
  items,
  categories,
}: {
  branchId: string;
  items: ImsItemRow[];
  categories: ImsCategoryRow[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = useMemo<DataTableColumn<ImsItemRow>[]>(
    () => [
      {
        id: "name",
        header: "Item",
        sortable: true,
        sortValue: (r) => r.name,
        cell: (r) => (
          <div>
            <span className="font-medium text-slate-900">{r.name}</span>
            <p className="text-xs text-slate-500">{r.sku}</p>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        sortable: true,
        sortValue: (r) => r.categoryName ?? "",
        cell: (r) => r.categoryName ?? "—",
      },
      {
        id: "type",
        header: "Type",
        cell: (r) => (r.itemType === ImsItemType.CONSUMABLE ? "Consumable" : "Asset"),
      },
      {
        id: "stock",
        header: "Stock",
        sortable: true,
        sortValue: (r) => r.totalStock,
        cell: (r) => (
          <span className={r.isLowStock ? "font-medium text-amber-700" : ""}>
            {r.totalStock} {r.unit}
            {r.isLowStock && <span className="ml-1 text-xs">(low)</span>}
          </span>
        ),
      },
      {
        id: "minStock",
        header: "Min",
        cell: (r) => `${r.minStock} ${r.unit}`,
      },
      {
        id: "expiry",
        header: "Expiry",
        cell: (r) => r.expiryDate ?? "—",
      },
    ],
    []
  );

  const filters = useMemo(() => {
    const types = [...new Set(items.map((i) => i.itemType))];
    return [
      {
        id: "type",
        label: "Type",
        options: types.map((t) => ({
          value: t,
          label: t === ImsItemType.CONSUMABLE ? "Consumable" : "Asset",
        })),
        predicate: (r: ImsItemRow, v: string) => r.itemType === v,
      },
      {
        id: "lowStock",
        label: "Stock level",
        options: [{ value: "low", label: "Low stock" }],
        predicate: (r: ImsItemRow, v: string) => v === "low" && r.isLowStock,
      },
    ];
  }, [items]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("branchId", branchId);
    startTransition(async () => {
      const res = await saveImsItem(fd);
      if (res.success) {
        setMessage(res.message);
        setShowForm(false);
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <HrFeedback message={message} error={error} />

      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
        >
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="SKU / Code">
            <Input name="sku" required placeholder="CHR-001" />
          </Field>
          <Field label="Category">
            <Select name="categoryId" defaultValue="">
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentName ? `${c.parentName} → ${c.name}` : c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Unit">
            <Input name="unit" required placeholder="pcs, box, kg" />
          </Field>
          <Field label="Type">
            <Select name="itemType" defaultValue={ImsItemType.CONSUMABLE}>
              <option value={ImsItemType.CONSUMABLE}>Consumable</option>
              <option value={ImsItemType.NON_CONSUMABLE}>Non-consumable (Asset)</option>
            </Select>
          </Field>
          <Field label="Minimum stock">
            <Input name="minStock" type="number" min={0} defaultValue={0} />
          </Field>
          <Field label="Unit cost (ETB)">
            <Input name="unitCost" type="number" min={0} step="0.01" />
          </Field>
          <Field label="Expiry date">
            <Input name="expiryDate" type="date" />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Input name="description" />
          </Field>
          <Button type="submit" disabled={pending}>
            Save item
          </Button>
        </form>
      )}

      <DataTable
        data={items}
        columns={columns}
        rowKey={(r) => r.id}
        filters={filters}
        searchPlaceholder="Search items…"
        getSearchText={(r) => `${r.name} ${r.sku} ${r.categoryName ?? ""}`}
      />
    </div>
  );
}
