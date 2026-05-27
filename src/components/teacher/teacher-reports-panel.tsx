"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Printer,
  Users,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { formatGradeLevel } from "@/lib/grade-utils";
import {
  formatReportDate,
  TOTAL_WEIGHT_MARKS,
  type ReportSheetCard,
  type ReportSheetRow,
  type StandaloneAssessmentCard,
  type TeacherReportsData,
} from "@/lib/services/teacher-reports";

function completionColor(pct: number) {
  if (pct >= 100) return "text-emerald-700 bg-emerald-50";
  if (pct >= 50) return "text-amber-700 bg-amber-50";
  return "text-slate-600 bg-slate-100";
}

function SheetStatus({ sheet }: { sheet: ReportSheetCard }) {
  const pct =
    sheet.studentCount > 0
      ? Math.round((sheet.completeCount / sheet.studentCount) * 100)
      : 0;

  if (!sheet.weightsValid) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        <AlertCircle className="h-3.5 w-3.5" />
        Fix weights ({sheet.weightsTotal}/{TOTAL_WEIGHT_MARKS})
      </span>
    );
  }
  if (pct >= 100) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Complete
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${completionColor(pct)}`}
    >
      {pct}% graded
    </span>
  );
}

function StudentReportTable({
  sheet,
  onClose,
}: {
  sheet: ReportSheetCard;
  onClose?: () => void;
}) {
  const columns = useMemo<DataTableColumn<ReportSheetRow>[]>(() => {
    const cols: DataTableColumn<ReportSheetRow>[] = [
      {
        id: "code",
        header: "ID",
        sortable: true,
        sortValue: (r) => r.studentCode,
        cell: (r) => <span className="font-mono text-xs">{r.studentCode}</span>,
      },
      {
        id: "name",
        header: "Student",
        sortable: true,
        sortValue: (r) => r.name,
        cell: (r) => <span className="font-medium text-slate-900">{r.name}</span>,
      },
    ];

    for (const c of sheet.components) {
      cols.push({
        id: c.id,
        header: (
          <div className="text-center">
            <div className="text-xs font-medium">{c.label}</div>
            <div className="text-[10px] font-normal text-slate-400">
              /{c.maxScore} · {c.weightMarks}m
            </div>
          </div>
        ),
        headerClassName: "text-center min-w-[72px]",
        cellClassName: "text-center text-sm",
        sortable: true,
        sortValue: (r) => r.scores[c.id] ?? -1,
        cell: (r) => {
          const v = r.scores[c.id];
          return v !== null && v !== undefined ? (
            <span>{v}</span>
          ) : (
            <span className="text-slate-300">—</span>
          );
        },
      });
    }

    cols.push({
      id: "total",
      header: (
        <div className="text-center font-semibold text-indigo-700">Total marks</div>
      ),
      headerClassName: "bg-indigo-50/80 text-center",
      cellClassName: "bg-indigo-50/50 text-center font-semibold text-indigo-800",
      sortable: true,
      sortValue: (r) => r.total ?? -1,
      cell: (r) => (r.total !== null ? r.total : "—"),
    });

    return cols;
  }, [sheet.components]);

  return (
    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 print:border-0 print:bg-white print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="font-semibold text-slate-900">
            {sheet.className} · {sheet.subjectName}
          </p>
          <p className="text-sm text-slate-500">
            Class report — sum of column marks · {sheet.studentCount} students
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          {onClose && (
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
      <DataTable
        data={sheet.rows}
        columns={columns}
        rowKey={(r) => r.studentId}
        searchPlaceholder="Search student…"
        getSearchText={(r) => `${r.name} ${r.studentCode}`}
        pageSize={20}
        minWidth={`${480 + sheet.components.length * 80}px`}
        recordLabel="student"
      />
    </div>
  );
}

export function TeacherReportsPanel({ data }: { data: TeacherReportsData }) {
  const [expandedSheetKey, setExpandedSheetKey] = useState<string | null>(null);
  const [tab, setTab] = useState<"sheets" | "standalone">("sheets");

  const expandedSheet = data.sheets.find((s) => s.sheetKey === expandedSheetKey);

  const sheetColumns = useMemo<DataTableColumn<ReportSheetCard>[]>(
    () => [
      {
        id: "class",
        header: "Class",
        sortable: true,
        sortValue: (s) => s.className,
        cell: (s) => (
          <div>
            <p className="font-medium text-slate-900">{s.className}</p>
            <p className="text-xs text-slate-500">{formatGradeLevel(s.gradeLevel)}</p>
          </div>
        ),
      },
      {
        id: "subject",
        header: "Subject",
        sortable: true,
        sortValue: (s) => s.subjectName,
        cell: (s) => s.subjectName,
      },
      {
        id: "columns",
        header: "Assessment columns",
        cell: (s) => (
          <div className="flex flex-wrap gap-1">
            {s.components.length === 0 ? (
              <span className="text-slate-400">Not set up</span>
            ) : (
              s.components.map((c) => (
                <span
                  key={c.id}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {c.label} ({c.weightMarks}m)
                </span>
              ))
            )}
          </div>
        ),
      },
      {
        id: "avg",
        header: "Class avg (total marks)",
        sortable: true,
        sortValue: (s) => s.averageTotal ?? -1,
        cell: (s) =>
          s.averageTotal !== null ? (
            <span className="font-medium text-slate-900">{s.averageTotal}</span>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        id: "progress",
        header: "Completion",
        sortable: true,
        sortValue: (s) =>
          s.studentCount > 0 ? s.completeCount / s.studentCount : 0,
        cell: (s) => (
          <div className="space-y-1">
            <SheetStatus sheet={s} />
            <p className="text-xs text-slate-500">
              {s.completeCount}/{s.studentCount} fully graded
            </p>
          </div>
        ),
      },
      {
        id: "updated",
        header: "Last updated",
        sortable: true,
        sortValue: (s) => s.lastUpdated ?? "",
        cell: (s) => (
          <span className="text-slate-600">{formatReportDate(s.lastUpdated)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (s) => (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setExpandedSheetKey((k) => (k === s.sheetKey ? null : s.sheetKey))
              }
            >
              {expandedSheetKey === s.sheetKey ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Hide roster
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  View report
                </>
              )}
            </Button>
            <Link
              href={`/teacher/grading?subjectId=${s.subjectId}&classId=${s.classId}`}
            >
              <Button type="button" size="sm">
                <ClipboardCheck className="h-4 w-4" />
                Edit grades
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    [expandedSheetKey]
  );

  const standaloneColumns = useMemo<DataTableColumn<StandaloneAssessmentCard>[]>(
    () => [
      {
        id: "title",
        header: "Assessment",
        sortable: true,
        sortValue: (a) => a.title,
        cell: (a) => (
          <div>
            <p className="font-medium text-slate-900">{a.title}</p>
            <p className="text-xs capitalize text-slate-500">
              {a.type.replace(/_/g, " ").toLowerCase()}
            </p>
          </div>
        ),
      },
      {
        id: "class",
        header: "Class",
        sortable: true,
        sortValue: (a) => a.className,
        cell: (a) => a.className,
      },
      {
        id: "subject",
        header: "Subject",
        sortable: true,
        sortValue: (a) => a.subjectName,
        cell: (a) => a.subjectName,
      },
      {
        id: "avg",
        header: "Average",
        sortable: true,
        sortValue: (a) => a.averageScore ?? -1,
        cell: (a) =>
          a.averageScore !== null ? (
            <span>
              {a.averageScore}
              <span className="text-slate-400"> / {a.maxScore}</span>
            </span>
          ) : (
            "—"
          ),
      },
      {
        id: "completion",
        header: "Entered",
        sortable: true,
        sortValue: (a) => a.completionPct,
        cell: (a) => (
          <span>
            {a.gradedCount}/{a.rosterCount}{" "}
            <span className="text-slate-400">({a.completionPct}%)</span>
          </span>
        ),
      },
      {
        id: "date",
        header: "Date",
        sortable: true,
        sortValue: (a) => a.date,
        cell: (a) => formatReportDate(a.date),
      },
    ],
    []
  );

  if (data.sheets.length === 0 && data.standalone.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 text-lg font-medium text-slate-800">No report cards yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Set up a weighted grading sheet for a class and subject. Each sheet becomes one
          class report with all students and column marks in one place.
        </p>
        <Link href="/teacher/grading" className="mt-6 inline-block">
          <Button size="lg">
            <ClipboardCheck className="h-4 w-4" />
            Open grading
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Class report sheets
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{data.stats.sheetCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Students on rosters
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {data.stats.studentsOnRoster}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Fully graded
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">
            {data.stats.fullyGradedStudents}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
            Needs attention
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-900">
            {data.stats.sheetsNeedingWork}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("sheets")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "sheets"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Class report sheets ({data.sheets.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("standalone")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "standalone"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Single assessments ({data.standalone.length})
        </button>
      </div>

      {tab === "sheets" && (
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Class report sheets</h2>
            <p className="text-sm text-slate-500">
              One report per class and subject — all weighted columns and total marks together.
              No duplicate rows per quiz column.
            </p>
          </div>

          {data.sheets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
              Save a weighted grading sheet to generate class reports.
            </p>
          ) : (
            <>
              <DataTable
                data={data.sheets}
                columns={sheetColumns}
                rowKey={(s) => s.sheetKey}
                searchPlaceholder="Search class or subject…"
                getSearchText={(s) => `${s.className} ${s.subjectName}`}
                pageSize={10}
                recordLabel="report sheet"
                minWidth="900px"
              />
              {expandedSheet && (
                <StudentReportTable
                  sheet={expandedSheet}
                  onClose={() => setExpandedSheetKey(null)}
                />
              )}
            </>
          )}
        </section>
      )}

      {tab === "standalone" && (
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Single assessments</h2>
            <p className="text-sm text-slate-500">
              One-off quizzes or tests from the grading page. Duplicates are merged to the
              latest entry with the most grades.
            </p>
          </div>
          {data.standalone.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
              No standalone assessments yet.
            </p>
          ) : (
            <DataTable
              data={data.standalone}
              columns={standaloneColumns}
              rowKey={(a) => a.id}
              searchPlaceholder="Search assessment…"
              getSearchText={(a) =>
                `${a.title} ${a.className} ${a.subjectName}`
              }
              pageSize={15}
              recordLabel="assessment"
            />
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          <span>
            Report cards use <strong>total marks</strong> (sum of column scores). Weights must
            total {TOTAL_WEIGHT_MARKS} marks on the grading sheet.
          </span>
        </div>
        <Link
          href="/teacher/grading"
          className="font-medium text-indigo-600 hover:underline"
        >
          Go to grading →
        </Link>
      </div>
    </div>
  );
}
