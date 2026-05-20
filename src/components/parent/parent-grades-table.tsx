"use client";

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export type ParentGradeRow = {
  id: string;
  title: string;
  subject: string;
  type: string;
  score: number;
  maxScore: number;
  marksEarned: number;
  date: string;
};

export function ParentGradesTable({ grades }: { grades: ParentGradeRow[] }) {
  const columns = useMemo<DataTableColumn<ParentGradeRow>[]>(
    () => [
      {
        id: "title",
        header: "Assessment",
        sortable: true,
        sortValue: (r) => r.title,
        cell: (r) => <span className="font-medium text-slate-900">{r.title}</span>,
      },
      {
        id: "subject",
        header: "Subject",
        sortable: true,
        sortValue: (r) => r.subject,
        cell: (r) => r.subject,
      },
      {
        id: "type",
        header: "Type",
        sortable: true,
        sortValue: (r) => r.type,
        cell: (r) => <span className="capitalize">{r.type}</span>,
      },
      {
        id: "score",
        header: "Marks",
        sortable: true,
        sortValue: (r) => r.marksEarned,
        cell: (r) => (
          <>
            {r.score} / {r.maxScore}{" "}
            <span className="text-slate-400">({r.marksEarned} marks)</span>
          </>
        ),
      },
      {
        id: "date",
        header: "Date",
        sortable: true,
        sortValue: (r) => new Date(r.date).getTime(),
        cell: (r) =>
          new Date(r.date).toLocaleDateString("en-ET", { dateStyle: "medium" }),
      },
    ],
    []
  );

  const subjects = [...new Set(grades.map((g) => g.subject))];

  return (
    <DataTable
      data={grades}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search assessment, subject…"
      getSearchText={(r) => [r.title, r.subject, r.type].join(" ")}
      filters={
        subjects.length > 1
          ? [
              {
                id: "subject",
                label: "Subject",
                options: subjects.map((s) => ({ value: s, label: s })),
                predicate: (r, v) => r.subject === v,
              },
            ]
          : []
      }
      emptyMessage="No grades match your search."
      recordLabel="grade"
    />
  );
}
