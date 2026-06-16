"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImsRequestStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/input";
import {
  approveImsRequest,
  fulfillImsRequest,
  rejectImsRequest,
  submitImsRequest,
} from "@/lib/actions/inventory";
import type { ImsItemRow, ImsLocationRow, ImsRequestRow } from "@/lib/services/inventory";
import { HrFeedback } from "@/components/hr/hr-feedback";

export function InventoryRequestsManager({
  branchId,
  requests,
  items,
  locations,
  canManage,
  canSubmit,
}: {
  branchId: string;
  requests: ImsRequestRow[];
  items: ImsItemRow[];
  locations: ImsLocationRow[];
  canManage: boolean;
  canSubmit: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = useMemo<DataTableColumn<ImsRequestRow>[]>(() => {
    const cols: DataTableColumn<ImsRequestRow>[] = [
      {
        id: "date",
        header: "Date",
        sortable: true,
        sortValue: (r) => r.createdAt,
        cell: (r) => new Date(r.createdAt).toLocaleDateString(),
      },
      { id: "requester", header: "Requester", cell: (r) => r.requesterName },
      { id: "items", header: "Items", cell: (r) => r.itemSummary },
      { id: "purpose", header: "Purpose", cell: (r) => r.purpose ?? "—" },
      {
        id: "status",
        header: "Status",
        cell: (r) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              r.status === ImsRequestStatus.PENDING
                ? "bg-amber-50 text-amber-700"
                : r.status === ImsRequestStatus.APPROVED
                  ? "bg-blue-50 text-blue-700"
                  : r.status === ImsRequestStatus.FULFILLED
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
            }`}
          >
            {r.status}
          </span>
        ),
      },
    ];

    if (canManage) {
      cols.push({
        id: "actions",
        header: "Actions",
        cell: (r) => (
          <div className="flex flex-wrap gap-1">
            {r.status === ImsRequestStatus.PENDING && (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("requestId", r.id);
                    fd.set("branchId", branchId);
                    startTransition(async () => {
                      const res = await approveImsRequest(fd);
                      if (res.success) {
                        setMessage(res.message);
                        router.refresh();
                      } else setError(res.error);
                    });
                  }}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("requestId", r.id);
                    fd.set("branchId", branchId);
                    fd.set("rejectReason", "Not approved");
                    startTransition(async () => {
                      const res = await rejectImsRequest(fd);
                      if (res.success) {
                        setMessage(res.message);
                        router.refresh();
                      } else setError(res.error);
                    });
                  }}
                >
                  Reject
                </Button>
              </>
            )}
            {r.status === ImsRequestStatus.APPROVED && (
              <FulfillButton requestId={r.id} branchId={branchId} locations={locations} />
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [branchId, canManage, locations, router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("branchId", branchId);
    startTransition(async () => {
      const res = await submitImsRequest(fd);
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

      {canSubmit && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-6 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 text-lg font-semibold text-slate-900">New request</h2>
          <Field label="Item">
            <Select name="itemId" required defaultValue="">
              <option value="" disabled>
                Select item
              </option>
              {items
                .filter((i) => i.itemType === "CONSUMABLE" && i.totalStock > 0)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} — {i.totalStock} {i.unit} available
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Quantity">
            <Input name="quantity" type="number" min={1} required />
          </Field>
          <Field label="Purpose" className="sm:col-span-2">
            <Input name="purpose" placeholder="Lab experiment, classroom supplies…" />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Input name="notes" />
          </Field>
          <Button type="submit" disabled={pending}>
            Submit request
          </Button>
        </form>
      )}

      <DataTable
        data={requests}
        columns={columns}
        searchPlaceholder="Search requests…"
        getSearchText={(r) =>
          `${r.requesterName} ${r.itemSummary} ${r.purpose ?? ""} ${r.status}`
        }
      />
    </div>
  );
}

function FulfillButton({
  requestId,
  branchId,
  locations,
}: {
  requestId: string;
  branchId: string;
  locations: ImsLocationRow[];
}) {
  const router = useRouter();
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <Select
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        className="h-8 text-xs"
      >
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </Select>
      <Button
        type="button"
        size="sm"
        disabled={pending || !locationId}
        onClick={() => {
          const fd = new FormData();
          fd.set("requestId", requestId);
          fd.set("branchId", branchId);
          fd.set("locationId", locationId);
          startTransition(async () => {
            const res = await fulfillImsRequest(fd);
            if (res.success) router.refresh();
          });
        }}
      >
        Fulfill
      </Button>
    </div>
  );
}
