"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { saveImsLocation } from "@/lib/actions/inventory";
import type { ImsLocationRow } from "@/lib/services/inventory";
import { HrFeedback } from "@/components/hr/hr-feedback";

export function InventoryLocationsManager({
  branchId,
  locations,
}: {
  branchId: string;
  locations: ImsLocationRow[];
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
      const res = await saveImsLocation(fd);
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
        <Field label="Location name">
          <Input name="name" required placeholder="Main store, Lab, Library" />
        </Field>
        <Field label="Description">
          <Input name="description" />
        </Field>
        <Button type="submit" disabled={pending}>
          Add location
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900">{loc.name}</h3>
            {loc.description && (
              <p className="mt-1 text-sm text-slate-500">{loc.description}</p>
            )}
            <p className="mt-3 text-sm text-slate-600">
              {loc.itemCount} item types · {loc.totalQuantity} total units
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
