import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { StudentPerformanceRisk } from "@/lib/services/student-performance-analytics";
import { cn } from "@/lib/utils";

const riskStyles = {
  critical: {
    badge: "bg-red-100 text-red-800 border-red-200",
    ring: "border-red-200 bg-red-50/50",
    label: "Critical risk",
  },
  high: {
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    ring: "border-orange-200 bg-orange-50/50",
    label: "High risk",
  },
  moderate: {
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    ring: "border-amber-200 bg-amber-50/50",
    label: "Moderate risk",
  },
  stable: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ring: "border-emerald-200 bg-emerald-50/50",
    label: "Stable",
  },
} as const;

export function StudentRiskInsightPanel({ risk }: { risk: StudentPerformanceRisk }) {
  const style = riskStyles[risk.riskLevel];

  return (
    <div className="space-y-4">
      <div className={cn("rounded-xl border p-5", style.ring)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Early warning & leadership insight
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {risk.studentName}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {risk.gradeLabel} · {risk.className} · {risk.branchName}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
              style.badge
            )}
          >
            {risk.riskLevel === "stable" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {style.label}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Risk score"
            value={`${risk.riskScore}/100`}
            icon={<Activity className="h-4 w-4 text-indigo-500" />}
          />
          <MetricCard
            label="Average grade"
            value={risk.averagePercent != null ? `${risk.averagePercent}%` : "—"}
            icon={<TrendingUp className="h-4 w-4 text-indigo-500" />}
          />
          <MetricCard
            label="Attendance"
            value={risk.attendanceRate != null ? `${risk.attendanceRate}%` : "—"}
            icon={<TrendingDown className="h-4 w-4 text-indigo-500" />}
          />
          <MetricCard
            label="Grade trend"
            value={risk.trendLabel}
            icon={<Activity className="h-4 w-4 text-indigo-500" />}
          />
        </div>
      </div>

      {risk.dropoutWarning ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Dropout warning</p>
              <p className="mt-1 text-sm text-red-800">
                Attendance and academic signals suggest this learner may disengage without
                immediate follow-up. Schedule a parent conference and assign a staff mentor.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h4 className="font-semibold text-slate-900">At-risk flags</h4>
          </div>
          <ul className="space-y-2">
            {risk.riskFactors.map((factor) => (
              <li
                key={factor}
                className="flex items-start gap-2 text-sm text-slate-700"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {factor}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Correlation: </span>
            {risk.attendanceCorrelation}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {risk.absences} absence(s) · {risk.lateArrivals} late arrival(s) in recent records
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-indigo-600" />
            <h4 className="font-semibold text-slate-900">Intervention suggestions</h4>
          </div>
          {risk.interventions.length > 0 ? (
            <ol className="space-y-2">
              {risk.interventions.map((item, index) => (
                <li key={item} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-500">
              No urgent interventions suggested. Continue routine monitoring.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-sm font-semibold leading-snug text-slate-900">{value}</p>
    </div>
  );
}
