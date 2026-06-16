"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { saveImsSupplier } from "@/lib/actions/inventory";
import type { ImsSupplierRow } from "@/lib/services/inventory";
import { HrFeedback } from "@/components/hr/hr-feedback";

export function InventorySuppliersManager({
  branchId,
  suppliers,
}: {
  branchId: string;
  suppliers: ImsSupplierRow[];
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
      const res = await saveImsSupplier(fd);
      if (res.success) {
        setMessage(res.message);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <HrFeedback message={message} error={error} />

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        <Field label="Supplier name">
          <Input name="name" required />
        </Field>
        <Field label="Contact person">
          <Input name="contactPerson" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" />
        </Field>
        <Field label="Phone">
          <Input name="phone" />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input name="address" />
        </Field>
        <Button type="submit" disabled={pending}>
          Add supplier
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {s.contactPerson ?? "—"}
                  {s.email && <span className="block text-xs">{s.email}</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{s.phone ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{s.orderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
