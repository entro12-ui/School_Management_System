"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImsAssetStatus, ImsAssignmentTarget } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/input";
import { assignImsAsset, returnImsAsset, saveImsAsset } from "@/lib/actions/inventory";
import type { ImsAssetRow, ImsItemRow, ImsLocationRow } from "@/lib/services/inventory";
import { HrFeedback } from "@/components/hr/hr-feedback";

export function InventoryAssetsManager({
  branchId,
  assets,
  assetItems,
  locations,
  staffProfiles,
  classes,
}: {
  branchId: string;
  assets: ImsAssetRow[];
  assetItems: ImsItemRow[];
  locations: ImsLocationRow[];
  staffProfiles: { id: string; employeeId: string; name: string }[];
  classes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"list" | "add" | "assign">("list");
  const [assignAssetId, setAssignAssetId] = useState("");
  const [targetType, setTargetType] = useState<ImsAssignmentTarget>(
    ImsAssignmentTarget.STAFF
  );

  const columns = useMemo<DataTableColumn<ImsAssetRow>[]>(
    () => [
      {
        id: "code",
        header: "Asset code",
        sortable: true,
        sortValue: (r) => r.assetCode,
        cell: (r) => <span className="font-mono text-sm">{r.assetCode}</span>,
      },
      { id: "item", header: "Item", cell: (r) => r.itemName },
      { id: "serial", header: "Serial", cell: (r) => r.serialNumber ?? "—" },
      {
        id: "status",
        header: "Status",
        cell: (r) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              r.status === ImsAssetStatus.ACTIVE
                ? "bg-emerald-50 text-emerald-700"
                : r.status === ImsAssetStatus.DAMAGED
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
            }`}
          >
            {r.status}
          </span>
        ),
      },
      { id: "location", header: "Location", cell: (r) => r.locationName ?? "—" },
      { id: "assignee", header: "Assigned to", cell: (r) => r.assignee ?? "—" },
      {
        id: "actions",
        header: "",
        cell: (r) =>
          r.assignee ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const fd = new FormData();
                fd.set("assetId", r.id);
                fd.set("branchId", branchId);
                startTransition(async () => {
                  const res = await returnImsAsset(fd);
                  if (res.success) {
                    setMessage(res.message);
                    router.refresh();
                  } else setError(res.error);
                });
              }}
            >
              Return
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAssignAssetId(r.id);
                setTab("assign");
              }}
            >
              Assign
            </Button>
          ),
      },
    ],
    [branchId, router]
  );

  function runAction(action: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        setMessage(res.message ?? "Done");
        setTab("list");
        router.refresh();
      } else setError(res.error ?? "Failed");
    });
  }

  return (
    <div className="space-y-6">
      <HrFeedback message={message} error={error} />

      <div className="flex gap-2">
        <Button type="button" variant={tab === "list" ? "default" : "outline"} onClick={() => setTab("list")}>
          All assets
        </Button>
        <Button type="button" variant={tab === "add" ? "default" : "outline"} onClick={() => setTab("add")}>
          Register asset
        </Button>
      </div>

      {tab === "add" && (
        <form
          action={(fd) => {
            fd.set("branchId", branchId);
            runAction(() => saveImsAsset(fd));
          }}
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
        >
          <Field label="Item (non-consumable)">
            <Select name="itemId" required defaultValue="">
              <option value="" disabled>
                Select item type
              </option>
              {assetItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.sku})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Asset code / barcode">
            <Input name="assetCode" required placeholder="AST-001" />
          </Field>
          <Field label="Serial number">
            <Input name="serialNumber" />
          </Field>
          <Field label="Location">
            <Select name="locationId" defaultValue="">
              <option value="">None</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Purchase date">
            <Input name="purchaseDate" type="date" />
          </Field>
          <Field label="Purchase cost">
            <Input name="purchaseCost" type="number" min={0} step="0.01" />
          </Field>
          <Button type="submit" disabled={pending}>
            Register asset
          </Button>
        </form>
      )}

      {tab === "assign" && (
        <form
          action={(fd) => {
            fd.set("branchId", branchId);
            fd.set("assetId", assignAssetId);
            fd.set("targetType", targetType);
            runAction(() => assignImsAsset(fd));
          }}
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
        >
          <Field label="Assign to">
            <Select
              name="targetTypeSelect"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as ImsAssignmentTarget)}
            >
              <option value={ImsAssignmentTarget.STAFF}>Staff member</option>
              <option value={ImsAssignmentTarget.CLASSROOM}>Classroom</option>
              <option value={ImsAssignmentTarget.DEPARTMENT}>Department</option>
            </Select>
          </Field>
          <input type="hidden" name="targetType" value={targetType} />
          {targetType === ImsAssignmentTarget.STAFF && (
            <Field label="Staff">
              <Select name="staffProfileId" required defaultValue="">
                <option value="" disabled>
                  Select staff
                </option>
                {staffProfiles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.employeeId})
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {targetType === ImsAssignmentTarget.CLASSROOM && (
            <Field label="Classroom">
              <Select name="classId" required defaultValue="">
                <option value="" disabled>
                  Select class
                </option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {targetType === ImsAssignmentTarget.DEPARTMENT && (
            <Field label="Department">
              <Input name="departmentName" required placeholder="Science Dept" />
            </Field>
          )}
          <Field label="Notes" className="sm:col-span-2">
            <Input name="notes" />
          </Field>
          <Button type="submit" disabled={pending || !assignAssetId}>
            Assign asset
          </Button>
        </form>
      )}

      {tab === "list" && (
        <DataTable
          data={assets}
          columns={columns}
          rowKey={(r) => r.id}
          searchPlaceholder="Search assets…"
          getSearchText={(r) =>
            `${r.assetCode} ${r.itemName} ${r.serialNumber ?? ""} ${r.assignee ?? ""}`
          }
        />
      )}
    </div>
  );
}
