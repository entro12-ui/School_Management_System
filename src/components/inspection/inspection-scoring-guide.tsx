"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { INSPECTION_SCORE_LEVELS } from "@/lib/inspection/scoring-scale";

export function InspectionScoringGuide({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(!compact);

  if (compact) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Info className="h-4 w-4 text-premium-accent" aria-hidden />
            Performance rating scale (0–3)
          </span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {INSPECTION_SCORE_LEVELS.map((level) => (
              <div
                key={level.value}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <p className="text-sm font-semibold text-slate-900">{level.shortLabel}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  {level.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-premium-accent/15 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-premium-accent/10">
          <Info className="h-5 w-5 text-premium-accent" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">
            How to score each criterion
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Select one rating per criterion based on observation, document review, and
            interviews. Scores are saved automatically.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {INSPECTION_SCORE_LEVELS.map((level) => (
          <div
            key={level.value}
            className="rounded-lg border border-slate-200/80 bg-white p-3 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold ${
                  level.value === 0
                    ? "bg-red-100 text-red-700"
                    : level.value === 1
                      ? "bg-amber-100 text-amber-800"
                      : level.value === 2
                        ? "bg-sky-100 text-sky-800"
                        : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {level.value}
              </span>
              <span className="text-sm font-semibold text-slate-900">{level.label}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {level.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
