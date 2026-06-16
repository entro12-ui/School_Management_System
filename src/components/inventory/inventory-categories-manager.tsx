"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { saveImsCategory } from "@/lib/actions/inventory";
import type { ImsCategoryRow } from "@/lib/services/inventory";
import { HrFeedback } from "@/components/hr/hr-feedback";

export function InventoryCategoriesManager({
  branchId,
  categories,
}: {
  branchId: string;
  categories: ImsCategoryRow[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("branchId", branchId);
    startTransition(async () => {
      const res = await saveImsCategory(fd);
      if (res.success) {
        setMessage(res.message);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else setError(res.error);
    });
  }

  const roots = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => c.parentId);

  return (
    <div className="space-y-6">
      <HrFeedback message={message} error={error} />

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        <Field label="Category name">
          <Input name="name" required placeholder="Chairs" />
        </Field>
        <Field label="Parent category">
          <Select name="parentId" defaultValue="">
            <option value="">None (top level)</option>
            {roots.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Input name="description" />
        </Field>
        <Button type="submit" disabled={pending}>
          Add category
        </Button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {roots.map((root) => (
            <li key={root.id}>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-slate-900">{root.name}</span>
                <span className="text-xs text-slate-500">
                  {root.itemCount} items · {root.childCount} subcategories
                </span>
              </div>
              {children
                .filter((c) => c.parentId === root.id)
                .map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between border-t border-slate-50 bg-slate-50/50 px-4 py-2 pl-8"
                  >
                    <span className="text-sm text-slate-700">↳ {child.name}</span>
                    <span className="text-xs text-slate-500">{child.itemCount} items</span>
                  </div>
                ))}
            </li>
          ))}
          {categories.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              No categories yet. Add Furniture, Electronics, Books, etc.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
