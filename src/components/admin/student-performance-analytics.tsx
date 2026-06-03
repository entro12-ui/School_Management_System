import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  StudentPerformanceAnalytics,
  StudentRiskLevel,
} from "@/lib/services/student-performance-analytics";

function riskBadgeClass(level: StudentRiskLevel) {
  if (level === "critical") return "bg-red-100 text-red-700";
  if (level === "high") return "bg-orange-100 text-orange-700";
  if (level === "moderate") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function riskBorderClass(level: StudentRiskLevel) {
  if (level === "critical") return "border-l-red-500";
  if (level === "high") return "border-l-orange-500";
  if (level === "moderate") return "border-l-amber-500";
  return "border-l-emerald-500";
}

function metricValue(value: number | null, suffix = "%") {
  return value == null ? "No data" : `${value}${suffix}`;
}

export function StudentPerformanceAnalyticsPanel({
  analytics,
}: {
  analytics: StudentPerformanceAnalytics;
}) {
  const mostUrgent = analytics.students[0];

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Student Performance Analytics
          </p>
          <h2 className="text-lg font-semibold text-slate-900">
            Early warning and intervention center
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Flags at-risk learners by combining recent grades, attendance patterns,
            grade trend, and dropout warning signals from existing school records.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Reviewed {analytics.totalStudentsReviewed} active student
          {analytics.totalStudentsReviewed === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">At-risk students</p>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{analytics.atRiskCount}</p>
          <p className="mt-1 text-xs text-slate-500">Moderate to critical risk</p>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-red-800">Dropout warnings</p>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-red-900">
            {analytics.dropoutWarningCount}
          </p>
          <p className="mt-1 text-xs text-red-700">Needs urgent follow-up</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">Average risk score</p>
            <Activity className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {analytics.averageRiskScore}/100
          </p>
          <p className="mt-1 text-xs text-slate-500">Based on grades + attendance</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">Correlation signal</p>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">
            {analytics.attendanceAcademicCorrelation}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold text-slate-900">Flagged student watchlist</h3>
            <p className="mt-1 text-sm text-slate-500">
              Ordered by risk score so leadership can act on the most urgent cases first.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics.students.length === 0 ? (
              <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-500">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                No student performance records are available yet.
              </div>
            ) : (
              analytics.students.map((student) => (
                <article
                  key={student.studentId}
                  className={cn("border-l-4 px-5 py-4", riskBorderClass(student.riskLevel))}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-slate-900">{student.studentName}</h4>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                            riskBadgeClass(student.riskLevel)
                          )}
                        >
                          {student.riskLevel} · {student.riskScore}/100
                        </span>
                        {student.dropoutWarning ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                            Dropout warning
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {student.studentCode} · {student.branchName} · {student.gradeLabel} ·{" "}
                        {student.className}
                      </p>
                    </div>

                    <div className="grid min-w-[240px] grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-slate-400">Average</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {metricValue(student.averagePercent)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-slate-400">Attendance</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {metricValue(student.attendanceRate)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="text-slate-400">Trend</p>
                        <p className="mt-1 flex items-center justify-center gap-1 font-semibold text-slate-900">
                          {student.gradeTrend != null && student.gradeTrend < 0 ? (
                            <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                          ) : null}
                          {student.gradeTrend == null
                            ? "No data"
                            : `${student.gradeTrend > 0 ? "+" : ""}${student.gradeTrend}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Risk factors
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {student.riskFactors.map((factor) => (
                          <li
                            key={factor}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                          >
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Intervention suggestions
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                        {student.interventions.map((intervention) => (
                          <li key={intervention} className="flex gap-2">
                            <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                            <span>{intervention}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-500" />
            <h3 className="font-semibold text-slate-900">Recommended action workflow</h3>
          </div>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="rounded-lg bg-slate-50 p-3">
              <span className="font-semibold text-slate-900">1. Review critical cases first.</span>{" "}
              Focus on dropout warnings and students with both attendance and grade risks.
            </li>
            <li className="rounded-lg bg-slate-50 p-3">
              <span className="font-semibold text-slate-900">2. Contact guardian early.</span>{" "}
              Use attendance follow-up before absences become a long-term pattern.
            </li>
            <li className="rounded-lg bg-slate-50 p-3">
              <span className="font-semibold text-slate-900">3. Assign targeted support.</span>{" "}
              Match remedial work to weak subjects and declining assessment windows.
            </li>
            <li className="rounded-lg bg-slate-50 p-3">
              <span className="font-semibold text-slate-900">4. Monitor weekly.</span>{" "}
              Re-check the score after new attendance and grade entries are recorded.
            </li>
          </ol>

          {mostUrgent ? (
            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Most urgent case
              </p>
              <p className="mt-2 font-semibold text-amber-950">{mostUrgent.studentName}</p>
              <p className="mt-1 text-sm text-amber-800">
                {mostUrgent.attendanceCorrelation}. {mostUrgent.trendLabel}.
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
