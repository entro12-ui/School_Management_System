"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Building2,
  CalendarDays,
  Download,
  FileText,
  Loader2,
  Printer,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type {
  AdminMonthlyReport,
  AdminMonthlyReportBranchOption,
} from "@/lib/services/admin-monthly-report";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function formatReportText(report: AdminMonthlyReport) {
  return [
    `EduSync SMS Monthly Owner Report - ${report.monthLabel}`,
    "",
    "Executive Summary",
    report.executiveSummary,
    "",
    "Owner Brief",
    ...report.ownerBrief.map((item) => `- ${item}`),
    "",
    "Key Metrics",
    `- Total enrollment: ${report.metrics.totalEnrollment}`,
    `- New enrollments: ${report.metrics.newEnrollments}`,
    `- Average attendance: ${report.metrics.averageAttendanceRate}%`,
    `- Average score: ${report.metrics.averageScore ?? "No data"}${report.metrics.averageScore == null ? "" : "%"}`,
    `- At-risk students: ${report.metrics.atRiskStudents}`,
    `- Dropout warnings: ${report.metrics.dropoutWarnings}`,
    `- Revenue collected: ${formatCurrency(report.metrics.collectedRevenue)}`,
    `- Outstanding fees: ${formatCurrency(report.metrics.outstandingFees)}`,
    `- Pending payment proofs: ${report.metrics.pendingPaymentProofs}`,
    `- Active staff: ${report.metrics.activeStaff}`,
    `- Library issues: ${report.metrics.libraryIssues}`,
    `- Overdue library issues: ${report.metrics.overdueLibraryIssues}`,
    `- Pending registrations: ${report.metrics.pendingRegistrations}`,
    `- Audit events: ${report.metrics.auditEvents}`,
    "",
    "AI Recommendations",
    ...report.recommendations.map((item) => `- ${item}`),
    "",
    "Branch Comparison",
    ...report.branches.map(
      (branch) =>
        `- ${branch.branchName}: ${branch.enrollment} students, ${branch.attendanceRate}% attendance, ${branch.averageScore ?? "No"} average score, ${formatCurrency(branch.collectedRevenue)} collected, ${formatCurrency(branch.outstandingFees)} outstanding`
    ),
  ].join("\n");
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function listHtml(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function reportHtml(report: AdminMonthlyReport) {
  return `
    <html>
      <head>
        <title>Monthly Report - ${escapeHtml(report.monthLabel)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; line-height: 1.55; padding: 32px; }
          h1 { font-size: 26px; margin-bottom: 4px; }
          h2 { font-size: 17px; margin-top: 26px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          p, li, td, th { font-size: 13px; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
          th { background: #f8fafc; }
          .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .metric { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; }
          .label { color: #64748b; font-size: 11px; text-transform: uppercase; }
          .value { font-weight: 700; margin-top: 4px; }
        </style>
      </head>
      <body>
        <h1>EduSync SMS Monthly Owner Report</h1>
        <p>${escapeHtml(report.monthLabel)} · Generated ${new Date(report.generatedAt).toLocaleString()}</p>
        <h2>Executive Summary</h2>
        <p>${escapeHtml(report.executiveSummary)}</p>
        <h2>Owner Brief</h2>
        ${listHtml(report.ownerBrief)}
        <h2>Key Metrics</h2>
        <div class="metric-grid">
          <div class="metric"><div class="label">Enrollment</div><div class="value">${report.metrics.totalEnrollment}</div></div>
          <div class="metric"><div class="label">Attendance</div><div class="value">${report.metrics.averageAttendanceRate}%</div></div>
          <div class="metric"><div class="label">At-risk</div><div class="value">${report.metrics.atRiskStudents}</div></div>
          <div class="metric"><div class="label">Revenue</div><div class="value">${formatCurrency(report.metrics.collectedRevenue)}</div></div>
        </div>
        <h2>AI Recommendations</h2>
        ${listHtml(report.recommendations)}
        <h2>Branch Comparison</h2>
        <table>
          <thead><tr><th>Branch</th><th>Enrollment</th><th>Attendance</th><th>Average score</th><th>Collected</th><th>Outstanding</th><th>At-risk</th></tr></thead>
          <tbody>
            ${report.branches
              .map(
                (branch) =>
                  `<tr><td>${escapeHtml(branch.branchName)}</td><td>${branch.enrollment}</td><td>${branch.attendanceRate}%</td><td>${branch.averageScore ?? "No data"}</td><td>${formatCurrency(branch.collectedRevenue)}</td><td>${formatCurrency(branch.outstandingFees)}</td><td>${branch.atRiskStudents}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

export function MonthlyReportGenerator({
  branches,
}: {
  branches: AdminMonthlyReportBranchOption[];
}) {
  const currentDate = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(String(currentDate.getMonth() + 1));
  const [year, setYear] = useState(String(currentDate.getFullYear()));
  const [branchId, setBranchId] = useState("all");
  const [report, setReport] = useState<AdminMonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(() => {
    const current = currentDate.getFullYear();
    return [current - 1, current, current + 1];
  }, [currentDate]);

  async function generateReport() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        month,
        year,
        ...(branchId !== "all" ? { branchId } : {}),
      });
      const response = await fetch(`/api/admin/monthly-report?${params.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await response.json()) as AdminMonthlyReport | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : "Could not generate report.");
      }
      setReport(data as AdminMonthlyReport);
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : "Could not generate report.");
    } finally {
      setLoading(false);
    }
  }

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([formatReportText(report)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(`monthly-report-${report.monthLabel}`)}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function printReport() {
    if (!report) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setError("Popup blocked. Please allow popups to print the monthly report.");
      return;
    }
    printWindow.document.write(reportHtml(report));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-lg shadow-indigo-100/40">
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-100 ring-1 ring-white/15">
              <Sparkles className="h-3.5 w-3.5" />
              AI Monthly Report Generator
            </span>
            <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
              Owner-ready school performance report
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-indigo-100">
              Generate an executive monthly report covering enrollment, academics,
              attendance, dropout warnings, finance, library operations, registrations,
              audit activity, and AI recommendations for next month.
            </p>
          </div>
          <FileText className="hidden h-14 w-14 text-cyan-200 lg:block" />
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 2xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-1">
            <Field label="Month">
              <Select
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="h-11 min-w-0 truncate bg-white"
              >
                {MONTHS.map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Year">
              <Select
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="h-11 min-w-0 truncate bg-white"
              >
                {years.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2 xl:col-span-1 2xl:col-span-1">
              <Field label="Branch">
                <Select
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                  className="h-11 min-w-0 truncate bg-white"
                >
                  <option value="all">All branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button
              type="button"
              onClick={() => void generateReport()}
              disabled={loading}
              className="h-11 w-full whitespace-nowrap rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700 sm:col-span-2 xl:col-span-1 2xl:col-span-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Generate monthly report
            </Button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          {report ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                    {report.monthLabel}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    AI executive summary
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {report.executiveSummary}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={downloadReport}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={printReport}>
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Enrollment" value={String(report.metrics.totalEnrollment)} icon={Building2} />
                <MetricCard label="Attendance" value={formatPercent(report.metrics.averageAttendanceRate, 0)} icon={CalendarDays} />
                <MetricCard label="At-risk students" value={String(report.metrics.atRiskStudents)} icon={TrendingUp} />
                <MetricCard label="Collected" value={formatCurrency(report.metrics.collectedRevenue)} icon={Download} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h4 className="font-semibold text-slate-900">Owner brief</h4>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {report.ownerBrief.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-indigo-50 p-4">
                  <h4 className="font-semibold text-indigo-950">AI recommendations</h4>
                  <ul className="mt-3 space-y-2 text-sm text-indigo-900/80">
                    {report.recommendations.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Branch</th>
                      <th className="px-4 py-3 font-medium">Students</th>
                      <th className="px-4 py-3 font-medium">Attendance</th>
                      <th className="px-4 py-3 font-medium">Avg score</th>
                      <th className="px-4 py-3 font-medium">Collected</th>
                      <th className="px-4 py-3 font-medium">Outstanding</th>
                      <th className="px-4 py-3 font-medium">At-risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.branches.map((branch) => (
                      <tr key={branch.branchId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {branch.branchName}
                        </td>
                        <td className="px-4 py-3">{branch.enrollment}</td>
                        <td className="px-4 py-3">{formatPercent(branch.attendanceRate, 0)}</td>
                        <td className="px-4 py-3">
                          {branch.averageScore == null ? "No data" : `${branch.averageScore}%`}
                        </td>
                        <td className="px-4 py-3">{formatCurrency(branch.collectedRevenue)}</td>
                        <td className="px-4 py-3">{formatCurrency(branch.outstandingFees)}</td>
                        <td className="px-4 py-3">{branch.atRiskStudents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <FileText className="h-10 w-10 text-indigo-300" />
              <h3 className="mt-4 font-semibold text-slate-900">No report generated yet</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Select a month, year, and branch scope, then generate an owner-ready
                monthly report with AI-style summary and action recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <Icon className="h-4 w-4 text-indigo-600" />
      <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}
