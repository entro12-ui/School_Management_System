"use client";

import { useMemo } from "react";
import { ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable, type DataTableColumn, type DataTableFilter } from "@/components/ui/data-table";
import type {
  StudentPerformanceRisk,
  StudentRiskLevel,
} from "@/lib/services/student-performance-analytics";

function riskBadgeClass(level: StudentRiskLevel) {
  if (level === "critical") return "bg-red-100 text-red-700";
  if (level === "high") return "bg-orange-100 text-orange-700";
  if (level === "moderate") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function metricValue(value: number | null, suffix = "%") {
  return value == null ? "—" : `${value}${suffix}`;
}

export function FlaggedStudentWatchlistTable({
  students,
}: {
  students: StudentPerformanceRisk[];
}) {
  const columns = useMemo<DataTableColumn<StudentPerformanceRisk>[]>(
    () => [
      {
        id: "watchRank",
        header: "#",
        sortable: true,
        sortValue: (r) => r.watchRank,
        cellClassName: "whitespace-nowrap text-slate-500 tabular-nums",
        cell: (r) => r.watchRank,
      },
      {
        id: "student",
        header: "Student",
        sortable: true,
        sortValue: (r) => r.studentName,
        cell: (r) => (
          <div>
            <p className="font-medium text-slate-900">{r.studentName}</p>
            <p className="text-xs text-slate-500">{r.studentCode}</p>
          </div>
        ),
      },
      {
        id: "branch",
        header: "Branch",
        sortable: true,
        sortValue: (r) => r.branchName,
        cell: (r) => r.branchName,
      },
      {
        id: "grade",
        header: "Grade / class",
        sortable: true,
        sortValue: (r) => `${r.gradeLabel} ${r.className}`,
        cell: (r) => (
          <div>
            <p>{r.gradeLabel}</p>
            <p className="text-xs text-slate-500">{r.className}</p>
          </div>
        ),
      },
      {
        id: "riskScore",
        header: "Risk score",
        sortable: true,
        sortValue: (r) => r.riskScore,
        cellClassName: "whitespace-nowrap font-semibold tabular-nums text-slate-900",
        cell: (r) => `${r.riskScore}/100`,
      },
      {
        id: "riskLevel",
        header: "Level",
        sortable: true,
        sortValue: (r) => r.riskLevel,
        cell: (r) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
              riskBadgeClass(r.riskLevel)
            )}
          >
            {r.riskLevel}
          </span>
        ),
      },
      {
        id: "averagePercent",
        header: "Avg %",
        sortable: true,
        sortValue: (r) => r.averagePercent ?? -1,
        cellClassName: "whitespace-nowrap tabular-nums",
        cell: (r) => metricValue(r.averagePercent),
      },
      {
        id: "attendanceRate",
        header: "Attendance",
        sortable: true,
        sortValue: (r) => r.attendanceRate ?? -1,
        cellClassName: "whitespace-nowrap tabular-nums",
        cell: (r) => metricValue(r.attendanceRate),
      },
      {
        id: "absences",
        header: "Absences",
        sortable: true,
        sortValue: (r) => r.absences,
        cellClassName: "whitespace-nowrap tabular-nums",
        cell: (r) => r.absences,
      },
      {
        id: "lateArrivals",
        header: "Late",
        sortable: true,
        sortValue: (r) => r.lateArrivals,
        cellClassName: "whitespace-nowrap tabular-nums",
        cell: (r) => r.lateArrivals,
      },
      {
        id: "trend",
        header: "Trend",
        sortable: true,
        sortValue: (r) => r.gradeTrend ?? -999,
        cell: (r) => (
          <div className="min-w-[120px]">
            <p className="flex items-center gap-1 font-medium text-slate-900">
              {r.gradeTrend != null && r.gradeTrend < 0 ? (
                <ArrowDownRight className="h-3.5 w-3.5 shrink-0 text-red-500" />
              ) : null}
              {r.gradeTrend == null
                ? "—"
                : `${r.gradeTrend > 0 ? "+" : ""}${r.gradeTrend} pts`}
            </p>
            <p className="text-xs text-slate-500">{r.trendLabel}</p>
          </div>
        ),
      },
      {
        id: "dropoutWarning",
        header: "Dropout",
        sortable: true,
        sortValue: (r) => (r.dropoutWarning ? 1 : 0),
        cell: (r) =>
          r.dropoutWarning ? (
            <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
              Warning
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        id: "correlation",
        header: "Signal",
        sortable: true,
        sortValue: (r) => r.attendanceCorrelation,
        cellClassName: "max-w-[220px]",
        cell: (r) => (
          <p className="line-clamp-2 text-slate-600" title={r.attendanceCorrelation}>
            {r.attendanceCorrelation}
          </p>
        ),
      },
      {
        id: "riskFactors",
        header: "Risk factors",
        sortable: true,
        sortValue: (r) => r.riskFactors.join(", "),
        cellClassName: "max-w-[240px]",
        cell: (r) => (
          <p className="line-clamp-2 text-slate-600" title={r.riskFactors.join(" · ")}>
            {r.riskFactors.join(" · ")}
          </p>
        ),
      },
      {
        id: "intervention",
        header: "Suggested action",
        sortable: true,
        sortValue: (r) => r.interventions[0] ?? "",
        cellClassName: "max-w-[260px]",
        cell: (r) => (
          <p className="line-clamp-2 text-slate-600" title={r.interventions.join(" ")}>
            {r.interventions[0] ?? "—"}
          </p>
        ),
      },
    ],
    []
  );

  const filters = useMemo<DataTableFilter<StudentPerformanceRisk>[]>(
    () => [
      {
        id: "riskLevel",
        label: "Risk level",
        options: [
          { value: "critical", label: "Critical" },
          { value: "high", label: "High" },
          { value: "moderate", label: "Moderate" },
        ],
        predicate: (row, value) => row.riskLevel === value,
      },
      {
        id: "dropoutWarning",
        label: "Dropout warning",
        options: [{ value: "yes", label: "Yes" }],
        predicate: (row, value) => (value === "yes" ? row.dropoutWarning : true),
      },
    ],
    []
  );

  return (
    <DataTable
      data={students}
      columns={columns}
      rowKey={(r) => r.studentId}
      filters={filters}
      searchPlaceholder="Search student, ID, branch, class…"
      getSearchText={(r) =>
        [
          r.studentName,
          r.studentCode,
          r.branchName,
          r.gradeLabel,
          r.className,
          r.riskLevel,
          r.attendanceCorrelation,
          ...r.riskFactors,
          ...r.interventions,
        ].join(" ")
      }
      emptyMessage="No flagged students match your filters."
      recordLabel="flagged student"
      minWidth="1280px"
      pageSize={15}
      pageSizeOptions={[10, 15, 25, 50, 100]}
    />
  );
}
