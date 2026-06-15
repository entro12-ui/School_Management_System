"use client";

import type { InspectionScoreSummary } from "@/lib/inspection/types";
import { CheckCircle2, ClipboardList } from "lucide-react";

export function InspectionProgressBar({
  summary,
  label = "Inspection progress",
}: {
  summary: InspectionScoreSummary;
  label?: string;
}) {
  const completionPct =
    summary.totalCriteria > 0
      ? Math.round((summary.scoredCriteria / summary.totalCriteria) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-premium-accent/10">
            <ClipboardList className="h-5 w-5 text-premium-accent" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
              {summary.overallPercent}%
              <span className="ml-2 text-sm font-normal text-slate-500">
                overall score
              </span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {summary.totalEarned} / {summary.totalMax} points earned
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-500">Criteria rated</p>
            <p className="font-semibold text-slate-900">
              {summary.scoredCriteria} / {summary.totalCriteria}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-500">Checklist completion</p>
            <p className="font-semibold text-slate-900">{completionPct}%</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Completion</span>
          <span>{completionPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-premium-accent transition-all duration-500 ease-out"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {completionPct === 100 && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          All criteria rated — you can submit this inspection.
        </p>
      )}
    </div>
  );
}
