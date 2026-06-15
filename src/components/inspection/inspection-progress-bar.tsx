"use client";

import type { InspectionScoreSummary } from "@/lib/inspection/types";

export function InspectionProgressBar({
  summary,
  label = "Overall progress",
}: {
  summary: InspectionScoreSummary;
  label?: string;
}) {
  const pct =
    summary.totalCriteria > 0
      ? Math.round((summary.scoredCriteria / summary.totalCriteria) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-900">
            {summary.overallPercent}%
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({summary.totalEarned} / {summary.totalMax} pts)
            </span>
          </p>
        </div>
        <p className="text-sm text-slate-500">
          {summary.scoredCriteria} / {summary.totalCriteria} criteria scored
        </p>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-premium-accent transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">Completion: {pct}%</p>
    </div>
  );
}
