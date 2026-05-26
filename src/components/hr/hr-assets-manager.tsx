"use client";

import { useState, useTransition } from "react";
import { HrAssetStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { saveHrAsset } from "@/lib/actions/hr";
import { HrFeedback } from "./hr-feedback";

export function HrAssetsManager({
  branchId,
  assets,
  canWrite,
}: {
  branchId: string;
  assets: {
    id: string;
    assetName: string;
    assetType: string;
    serialNumber: string | null;
    status: HrAssetStatus;
  }[];
  canWrite: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) setMessage(res.message ?? "Saved");
      else setError(res.error ?? "Failed");
    });
  }

  return (
    <div className="space-y-6">
      <HrFeedback message={message} error={error} />

      {canWrite && (
        <form
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
          action={(fd) => run(() => saveHrAsset(fd))}
        >
          <input type="hidden" name="branchId" value={branchId} />
          <Field label="Asset name">
            <Input name="assetName" required />
          </Field>
          <Field label="Type">
            <Input name="assetType" required placeholder="Laptop" />
          </Field>
          <Field label="Serial">
            <Input name="serialNumber" />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="AVAILABLE">
              {Object.values(HrAssetStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={pending}>
            Add asset
          </Button>
        </form>
      )}

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {assets.map((a) => (
          <li key={a.id} className="flex justify-between px-4 py-3 text-sm">
            <span className="font-medium">
              {a.assetName}{" "}
              <span className="text-slate-500">({a.assetType})</span>
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{a.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
