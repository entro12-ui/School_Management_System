"use client";

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export type AuditLogRow = {
  id: string;
  action: string;
  actorName: string;
  entity: string;
  entityId: string;
  branchName?: string;
  createdAt: string;
};

export function AuditLogTable({
  logs,
  showBranch = false,
}: {
  logs: AuditLogRow[];
  showBranch?: boolean;
}) {
  const columns = useMemo<DataTableColumn<AuditLogRow>[]>(
    () => [
      {
        id: "createdAt",
        header: "When",
        sortable: true,
        sortValue: (r) => new Date(r.createdAt).getTime(),
        cell: (r) =>
          new Date(r.createdAt).toLocaleString("en-ET", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
      },
      {
        id: "action",
        header: "Action",
        sortable: true,
        sortValue: (r) => r.action,
        cell: (r) => <span className="font-medium">{r.action}</span>,
      },
      {
        id: "actor",
        header: "Actor",
        sortable: true,
        sortValue: (r) => r.actorName,
        cell: (r) => r.actorName,
      },
      ...(showBranch
        ? [
            {
              id: "branch",
              header: "Branch",
              sortable: true,
              sortValue: (r: AuditLogRow) => r.branchName ?? "",
              cell: (r: AuditLogRow) => r.branchName ?? "—",
            } as DataTableColumn<AuditLogRow>,
          ]
        : []),
      {
        id: "entity",
        header: "Entity",
        cell: (r) => (
          <span className="text-slate-500">
            {r.entity || "—"}
            {r.entityId ? ` · ${r.entityId.slice(0, 8)}…` : ""}
          </span>
        ),
      },
    ],
    [showBranch]
  );

  return (
    <DataTable
      data={logs}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search action, entity, user…"
      getSearchText={(r) =>
        [r.action, r.entity, r.entityId, r.actorName, r.branchName ?? ""].join(" ")
      }
      filters={[
        {
          id: "entity",
          label: "Entity",
          options: [...new Set(logs.map((l) => l.entity))].map((e) => ({
            value: e,
            label: e,
          })),
          predicate: (r, v) => r.entity === v,
        },
      ]}
      emptyMessage="No audit entries match your filters."
      recordLabel="entry"
      minWidth="800px"
    />
  );
}
