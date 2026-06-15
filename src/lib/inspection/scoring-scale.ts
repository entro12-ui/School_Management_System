/** MOE internal inspection performance rating per criterion (0–3). */

export type InspectionScoreLevel = {
  value: number;
  label: string;
  shortLabel: string;
  description: string;
};

export const INSPECTION_SCORE_LEVELS: InspectionScoreLevel[] = [
  {
    value: 0,
    label: "Not met",
    shortLabel: "0 — Not met",
    description: "No evidence or requirement is not satisfied.",
  },
  {
    value: 1,
    label: "Weak",
    shortLabel: "1 — Weak",
    description: "Partially met; significant gaps remain.",
  },
  {
    value: 2,
    label: "Satisfactory",
    shortLabel: "2 — Satisfactory",
    description: "Mostly met with minor gaps.",
  },
  {
    value: 3,
    label: "Strong",
    shortLabel: "3 — Strong",
    description: "Fully met per Ministry standard.",
  },
];

export function getScoreLevel(value: number | null | undefined): InspectionScoreLevel | null {
  if (value == null) return null;
  return INSPECTION_SCORE_LEVELS.find((l) => l.value === value) ?? null;
}

export function scoreLevelClasses(value: number, selected: boolean): string {
  if (!selected) {
    return "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
  }
  switch (value) {
    case 0:
      return "border-red-500 bg-red-500 text-white shadow-sm";
    case 1:
      return "border-amber-500 bg-amber-500 text-white shadow-sm";
    case 2:
      return "border-sky-600 bg-sky-600 text-white shadow-sm";
    case 3:
      return "border-emerald-600 bg-emerald-600 text-white shadow-sm";
    default:
      return "border-premium-accent bg-premium-accent text-white shadow-sm";
  }
}
