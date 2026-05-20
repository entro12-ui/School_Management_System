"use client";

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ROLE_LABELS } from "@/lib/auth/roles";

export type BranchStaffRow = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
};

export function BranchStaffTable({ staff }: { staff: BranchStaffRow[] }) {
  const columns = useMemo<DataTableColumn<BranchStaffRow>[]>(
    () => [
      {
        id: "employeeId",
        header: "Employee ID",
        sortable: true,
        sortValue: (r) => r.employeeId,
        cell: (r) => <span className="font-mono text-xs">{r.employeeId}</span>,
      },
      {
        id: "name",
        header: "Name",
        sortable: true,
        sortValue: (r) => r.name,
        cell: (r) => <span className="font-medium text-slate-900">{r.name}</span>,
      },
      {
        id: "email",
        header: "Email",
        sortable: true,
        sortValue: (r) => r.email,
        cell: (r) => r.email,
      },
      {
        id: "role",
        header: "Role",
        sortable: true,
        sortValue: (r) => r.role,
        cell: (r) => (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
            {ROLE_LABELS[r.role as keyof typeof ROLE_LABELS] ?? r.role}
          </span>
        ),
      },
      {
        id: "department",
        header: "Department",
        sortable: true,
        sortValue: (r) => r.department,
        cell: (r) => r.department || "—",
      },
      {
        id: "phone",
        header: "Phone",
        sortable: true,
        sortValue: (r) => r.phone,
        cell: (r) => r.phone || "—",
      },
    ],
    []
  );

  return (
    <DataTable
      data={staff}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search name, email, ID, department…"
      getSearchText={(r) =>
        [r.employeeId, r.name, r.email, r.phone, r.department, r.role].join(" ")
      }
      emptyMessage="No staff match your search."
      recordLabel="staff member"
    />
  );
}
