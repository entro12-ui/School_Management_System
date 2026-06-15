"use client";

import {
  INSPECTION_SCORE_LEVELS,
  scoreLevelClasses,
} from "@/lib/inspection/scoring-scale";

export function InspectionCriterionScorePicker({
  value,
  max,
  disabled,
  saving,
  onSelect,
}: {
  value: number | null;
  max: number;
  disabled?: boolean;
  saving?: boolean;
  onSelect: (score: number) => void;
}) {
  const levels = INSPECTION_SCORE_LEVELS.filter((l) => l.value <= max);

  return (
    <div className="shrink-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        Performance rating
      </p>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => {
          const selected = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(level.value)}
              aria-pressed={selected}
              aria-label={`${level.shortLabel}: ${level.description}`}
              title={level.description}
              className={`group flex min-w-[4.5rem] flex-col items-center rounded-lg border px-2 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-accent/40 disabled:opacity-60 ${scoreLevelClasses(level.value, selected)}`}
            >
              <span className="text-base font-bold leading-none">{level.value}</span>
              <span
                className={`mt-1 text-[10px] font-medium leading-tight ${
                  selected ? "text-white/95" : "text-slate-500 group-hover:text-slate-700"
                }`}
              >
                {level.label}
              </span>
            </button>
          );
        })}
      </div>
      {saving && (
        <p className="mt-1.5 text-xs text-slate-400 animate-pulse">Saving…</p>
      )}
      {value != null && !saving && (
        <p className="mt-1.5 text-xs text-slate-500">
          Selected: {levels.find((l) => l.value === value)?.shortLabel}
        </p>
      )}
    </div>
  );
}
