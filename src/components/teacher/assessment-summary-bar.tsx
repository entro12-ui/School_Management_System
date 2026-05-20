import { cn } from "@/lib/utils";
import { TOTAL_WEIGHT_MARKS } from "@/lib/grading-weighted";

type StatItem = {
  label: string;
  value: string;
  hint?: string;
  variant?: "default" | "success" | "warning" | "accent";
};

export function AssessmentSummaryBar({
  title,
  items,
}: {
  title: string;
  items: StatItem[];
}) {
  const variantClass = {
    default: "border-slate-200 bg-white",
    success: "border-emerald-200 bg-emerald-50/80",
    warning: "border-amber-200 bg-amber-50/80",
    accent: "border-indigo-200 bg-indigo-50/80",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "rounded-lg border px-4 py-3",
              variantClass[item.variant ?? "default"]
            )}
          >
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">
              {item.value}
            </p>
            {item.hint && (
              <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeightTotalBadge({
  current,
  target = TOTAL_WEIGHT_MARKS,
}: {
  current: number;
  target?: number;
}) {
  const valid = Math.abs(current - target) < 0.01;
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        valid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
      )}
    >
      Weights: {current} / {target} marks {valid ? "✓" : ""}
    </span>
  );
}
