"use client";

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import type { RegistrarGradeRow } from "@/lib/services/registrar-students";

export function RegistrarStudentGradesTable({ grades }: { grades: RegistrarGradeRow[] }) {
  const columns = useMemo<DataTableColumn<RegistrarGradeRow>[]>(
    () => [
      {
        id: "subject",
        header: "Subject",
        sortable: true,
        sortValue: (r) => r.subject,
        cell: (r) => (
          <div>
            <span className="font-medium text-slate-900">{r.subject}</span>
            <p className="text-xs text-slate-400">{r.subjectCode}</p>
          </div>
        ),
      },
      {
        id: "title",
        header: "Assessment",
        sortable: true,
        sortValue: (r) => r.title,
        cell: (r) => r.title,
      },
      {
        id: "type",
        header: "Type",
        sortable: true,
        sortValue: (r) => r.typeLabel,
        cell: (r) => r.typeLabel,
      },
      {
        id: "term",
        header: "Term",
        sortable: true,
        sortValue: (r) => r.termLabel,
        cell: (r) => r.termLabel,
      },
      {
        id: "score",
        header: "Score",
        sortable: true,
        sortValue: (r) => r.score ?? -1,
        cell: (r) =>
          r.hasGrade ? (
            <span>
              {r.score} / {r.maxScore}
              {r.percent != null && (
                <span className="ml-1 text-slate-400">({r.percent}%)</span>
              )}
            </span>
          ) : (
            <span className="text-amber-600">Not graded</span>
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
      {
        id: "remarks",
        header: "Remarks",
        cell: (r) => r.remarks ?? "—",
      },
    ],
    []
  );

  const subjects = [...new Set(grades.map((g) => g.subject))];
  const types = [...new Set(grades.map((g) => g.typeLabel))];

  return (
    <DataTable
      data={grades}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search subject, assessment, type…"
      getSearchText={(r) => [r.subject, r.title, r.typeLabel, r.termLabel].join(" ")}
      filters={[
        ...(subjects.length > 1
          ? [
              {
                id: "subject",
                label: "Subject",
                options: subjects.map((s) => ({ value: s, label: s })),
                predicate: (r: RegistrarGradeRow, v: string) => r.subject === v,
              },
            ]
          : []),
        ...(types.length > 1
          ? [
              {
                id: "type",
                label: "Type",
                options: types.map((t) => ({ value: t, label: t })),
                predicate: (r: RegistrarGradeRow, v: string) => r.typeLabel === v,
              },
            ]
          : []),
        {
          id: "graded",
          label: "Status",
          options: [
            { value: "graded", label: "Graded only" },
            { value: "pending", label: "Not graded" },
          ],
          predicate: (r, v) =>
            v === "graded" ? r.hasGrade : !r.hasGrade,
        },
      ]}
      emptyMessage="No assessments for this student."
      recordLabel="assessment"
      minWidth="1000px"
    />
  );
}
