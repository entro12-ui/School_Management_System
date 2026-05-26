"use client";

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";

export type FeeStructureRow = {
  id: string;
  name: string;
  branchName?: string;
  gradeLabel: string;
  semesterLabel: string;
  amount: number;
};

export function FeeStructuresTable({
  fees,
  showBranch = false,
}: {
  fees: FeeStructureRow[];
  showBranch?: boolean;
}) {
  const columns = useMemo<DataTableColumn<FeeStructureRow>[]>(() => {
    const cols: DataTableColumn<FeeStructureRow>[] = [
      {
        id: "name",
        header: "Name",
        sortable: true,
        sortValue: (r) => r.name,
        cell: (r) => <span className="font-medium text-slate-900">{r.name}</span>,
      },
    ];
    if (showBranch) {
      cols.push({
        id: "branch",
        header: "Branch",
        sortable: true,
        sortValue: (r) => r.branchName ?? "",
        cell: (r) => r.branchName ?? "—",
      });
    }
    cols.push(
      {
        id: "grade",
        header: "Grade",
        sortable: true,
        sortValue: (r) => r.gradeLabel,
        cell: (r) => r.gradeLabel,
      },
      {
        id: "semester",
        header: "Semester",
        sortable: true,
        sortValue: (r) => r.semesterLabel,
        cell: (r) => r.semesterLabel,
      },
      {
        id: "amount",
        header: "Amount",
        sortable: true,
        sortValue: (r) => r.amount,
        cell: (r) => formatCurrency(r.amount),
      }
    );
    return cols;
  }, [showBranch]);

  return (
    <DataTable
      data={fees}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search fee name, grade, semester…"
      getSearchText={(r) =>
        [r.name, r.branchName, r.gradeLabel, r.semesterLabel].filter(Boolean).join(" ")
      }
      emptyMessage="No fee structures match your search."
      recordLabel="fee"
    />
  );
}
