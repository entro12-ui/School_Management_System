import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  Users,
} from "lucide-react";
import { FlaggedStudentWatchlistTable } from "@/components/admin/flagged-student-watchlist-table";
import type { StudentPerformanceAnalytics } from "@/lib/services/student-performance-analytics";

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

      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900">Flagged student watchlist</h3>
            <p className="mt-1 text-sm text-slate-500">
              Ordered by risk score so leadership can act on the most urgent cases first.
            </p>
          </div>

          {analytics.students.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              No at-risk students are flagged right now.
            </div>
          ) : (
            <FlaggedStudentWatchlistTable students={analytics.students} />
          )}
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:max-w-xl">
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
