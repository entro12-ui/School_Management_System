"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import type { RegistrarStudentListRow } from "@/lib/services/registrar-students";
import { Eye, FileText } from "lucide-react";

export function RegistrarStudentsTable({
  students,
  showBranch = false,
}: {
  students: RegistrarStudentListRow[];
  showBranch?: boolean;
}) {
  const columns = useMemo<DataTableColumn<RegistrarStudentListRow>[]>(() => {
    const cols: DataTableColumn<RegistrarStudentListRow>[] = [
      {
        id: "name",
        header: "Student",
        sortable: true,
        sortValue: (r) => `${r.lastName} ${r.firstName}`,
        cell: (r) => (
          <div>
            <span className="font-medium text-slate-900">
              {r.firstName} {r.lastName}
            </span>
            <p className="text-xs text-slate-500">{r.studentId}</p>
          </div>
        ),
      },
      {
        id: "grade",
        header: "Grade / class",
        sortable: true,
        sortValue: (r) => r.gradeLevel,
        cell: (r) => (
          <div className="text-sm">
            <div>{r.gradeLabel}</div>
            <div className="text-slate-500">{r.className ?? "Unassigned"}</div>
          </div>
        ),
      },
      {
        id: "grades",
        header: "Grades",
        sortable: true,
        sortValue: (r) => r.gradeCount,
        cell: (r) => (
          <span className="font-medium text-indigo-700">{r.gradeCount}</span>
        ),
      },
      {
        id: "assessments",
        header: "Class assessments",
        sortable: true,
        sortValue: (r) => r.assessmentCount,
        cell: (r) => r.assessmentCount,
      },
      {
        id: "guardian",
        header: "Guardian",
        sortable: true,
        sortValue: (r) => r.guardianName ?? "",
        cell: (r) => r.guardianName ?? "—",
      },
    ];

    if (showBranch) {
      cols.splice(2, 0, {
        id: "branch",
        header: "Branch",
        sortable: true,
        sortValue: (r) => r.branchName,
        cell: (r) => r.branchName,
      });
    }

    cols.push({
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={`/registrar/students/${r.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
          >
            <Eye className="h-3.5 w-3.5" />
            Full record
          </Link>
          <Link
            href={`/registrar/students/${r.id}/transcript`}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            <FileText className="h-3.5 w-3.5" />
            Transcript
          </Link>
        </div>
      ),
    });

    return cols;
  }, [showBranch]);

  const gradeFilters = useMemo(() => {
    const levels = [...new Set(students.map((s) => s.gradeLabel))].sort();
    if (levels.length <= 1) return [];
    return [
      {
        id: "grade",
        label: "Grade",
        options: levels.map((l) => ({ value: l, label: l })),
        predicate: (r: RegistrarStudentListRow, v: string) => r.gradeLabel === v,
      },
    ];
  }, [students]);

  return (
    <DataTable
      data={students}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search name, ID, class, email…"
      getSearchText={(r) =>
        [
          r.firstName,
          r.lastName,
          r.studentId,
          r.className,
          r.guardianName,
          r.email,
          r.branchName,
          r.gradeLabel,
        ]
          .filter(Boolean)
          .join(" ")
      }
      filters={gradeFilters}
      emptyMessage="No students found."
      recordLabel="student"
      minWidth="900px"
    />
  );
}
