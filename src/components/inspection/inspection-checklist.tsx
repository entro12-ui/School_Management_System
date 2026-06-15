"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import {
  saveCriterionScore,
  submitInspectionRun,
} from "@/lib/actions/inspection";
import {
  groupCriteriaByIndicator,
  groupIndicatorsByStandard,
  getCriterionDisplayTitle,
} from "@/lib/inspection/framework";
import { getScoreLevel } from "@/lib/inspection/scoring-scale";
import type {
  InspectionFramework,
  InspectionScoreSummary,
} from "@/lib/inspection/types";
import { buildCriterionKey } from "@/lib/inspection/types";
import { Button } from "@/components/ui/button";
import { InspectionCriterionScorePicker } from "./inspection-criterion-score-picker";
import { InspectionProgressBar } from "./inspection-progress-bar";
import { InspectionScoringGuide } from "./inspection-scoring-guide";

type ScoreRow = {
  criterionKey: string;
  score: number | null;
  comment: string | null;
};

export function InspectionChecklist({
  runId,
  framework,
  summary,
  scoreMap,
  readOnly = false,
  status,
}: {
  runId: string;
  framework: InspectionFramework;
  summary: InspectionScoreSummary;
  scoreMap: Record<string, ScoreRow>;
  readOnly?: boolean;
  status: string;
}) {
  const [openStandards, setOpenStandards] = useState<Set<number>>(
    () => new Set([framework.standards[0]?.number ?? 1])
  );
  const [localScores, setLocalScores] = useState<Record<string, ScoreRow>>(scoreMap);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const indicatorsByStandard = useMemo(
    () => groupIndicatorsByStandard(framework),
    [framework]
  );
  const criteriaByIndicator = useMemo(
    () => groupCriteriaByIndicator(framework),
    [framework]
  );

  const scaleMax = framework.version.scoringScale.max;

  const toggleStandard = (num: number) => {
    setOpenStandards((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const expandAll = () =>
    setOpenStandards(new Set(framework.standards.map((s) => s.number)));
  const collapseAll = () => setOpenStandards(new Set());

  const saveScore = useCallback(
    async (
      indicatorCode: string,
      criterionNumber: number,
      score: number | null,
      comment?: string | null
    ) => {
      const criterionKey = buildCriterionKey(indicatorCode, criterionNumber);
      setSavingKey(criterionKey);
      setLocalScores((prev) => ({
        ...prev,
        [criterionKey]: {
          criterionKey,
          score,
          comment: comment ?? prev[criterionKey]?.comment ?? null,
        },
      }));

      await saveCriterionScore({
        runId,
        indicatorCode,
        criterionNumber,
        score,
        comment,
      });

      setSavingKey(null);
    },
    [runId]
  );

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitInspectionRun(runId);
    setSubmitting(false);
    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    window.location.reload();
  }

  const canEdit = !readOnly && status !== "FINALIZED" && status !== "SUBMITTED";

  return (
    <div className="space-y-6">
      <InspectionProgressBar summary={summary} />

      {canEdit && <InspectionScoringGuide />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            {framework.standards.length} standards
          </span>
          · {framework.indicators.length} indicators · {framework.criteria.length} criteria
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={expandAll}>
            Expand all
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={collapseAll}>
            Collapse all
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {framework.standards.map((standard) => {
          const stdSummary = summary.standards.find((s) => s.number === standard.number);
          const isOpen = openStandards.has(standard.number);
          const indicators = indicatorsByStandard.get(standard.number) ?? [];
          const stdCompletion =
            stdSummary && stdSummary.totalCriteria > 0
              ? Math.round(
                  (stdSummary.scoredCount / stdSummary.totalCriteria) * 100
                )
              : 0;

          return (
            <div
              key={standard.number}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => toggleStandard(standard.number)}
                className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-slate-50/80 transition-colors"
              >
                {isOpen ? (
                  <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-premium-accent" />
                ) : (
                  <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      Standard {standard.number}
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {stdSummary
                        ? `${stdSummary.earnedPoints}/${stdSummary.maxPoints} pts`
                        : `${standard.maxPoints} pts max`}
                    </span>
                    <span className="rounded-full bg-premium-accent/10 px-2 py-0.5 text-xs font-medium text-premium-accent">
                      {stdSummary
                        ? `${stdSummary.scoredCount}/${stdSummary.totalCriteria} rated`
                        : "Not started"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {standard.titleEn}
                  </p>
                  <div className="mt-3 h-1.5 max-w-md rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-premium-accent/80 transition-all duration-300"
                      style={{ width: `${stdCompletion}%` }}
                    />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4 bg-slate-50/40">
                  {indicators.map((indicator) => {
                    const criteria = criteriaByIndicator.get(indicator.code) ?? [];
                    return (
                      <div
                        key={indicator.code}
                        className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
                      >
                        <div className="mb-4 border-b border-slate-100 pb-3">
                          <p className="text-sm font-semibold text-slate-900">
                            Indicator {indicator.code}
                            <span className="ml-2 font-normal text-slate-500">
                              ({indicator.maxPoints} points)
                            </span>
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            {indicator.titleEn}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {criteria.map((criterion) => {
                            const key = buildCriterionKey(
                              criterion.indicatorCode,
                              criterion.number
                            );
                            const row = localScores[key] ?? {
                              criterionKey: key,
                              score: null,
                              comment: null,
                            };
                            const scored = row.score != null;
                            const level = getScoreLevel(row.score);

                            return (
                              <div
                                key={key}
                                className={`rounded-xl border p-4 transition-colors ${
                                  scored
                                    ? "border-premium-accent/25 bg-premium-accent/[0.03]"
                                    : "border-slate-200 bg-slate-50/50"
                                }`}
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Criterion {criterion.number}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        Max {criterion.maxPoints} pts
                                      </span>
                                      {scored && level && (
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            row.score === 3
                                              ? "bg-emerald-100 text-emerald-800"
                                              : row.score === 2
                                                ? "bg-sky-100 text-sky-800"
                                                : row.score === 1
                                                  ? "bg-amber-100 text-amber-800"
                                                  : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {level.label}
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">
                                      {getCriterionDisplayTitle(criterion)}
                                    </p>
                                  </div>

                                  {canEdit ? (
                                    <InspectionCriterionScorePicker
                                      value={row.score}
                                      max={scaleMax}
                                      disabled={savingKey === key}
                                      saving={savingKey === key}
                                      onSelect={(val) =>
                                        saveScore(
                                          criterion.indicatorCode,
                                          criterion.number,
                                          val,
                                          row.comment
                                        )
                                      }
                                    />
                                  ) : (
                                    <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm">
                                      <p className="text-xs font-medium text-slate-500">
                                        Rating
                                      </p>
                                      <p className="mt-0.5 font-semibold text-slate-900">
                                        {row.score != null
                                          ? `${row.score} — ${level?.label ?? "Rated"}`
                                          : "Not rated"}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {canEdit && (
                                  <div className="mt-4">
                                    <label
                                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
                                      htmlFor={`comment-${key}`}
                                    >
                                      <FileText className="h-3.5 w-3.5" aria-hidden />
                                      Evidence &amp; inspector notes
                                    </label>
                                    <textarea
                                      id={`comment-${key}`}
                                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-premium-accent focus:outline-none focus:ring-2 focus:ring-premium-accent/15"
                                      placeholder="Document observations, interview notes, or evidence references…"
                                      rows={2}
                                      value={row.comment ?? ""}
                                      onChange={(e) => {
                                        const comment = e.target.value;
                                        setLocalScores((prev) => ({
                                          ...prev,
                                          [key]: { ...row, comment },
                                        }));
                                      }}
                                      onBlur={() =>
                                        saveScore(
                                          criterion.indicatorCode,
                                          criterion.number,
                                          row.score,
                                          row.comment
                                        )
                                      }
                                    />
                                  </div>
                                )}
                                {!canEdit && row.comment && (
                                  <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-600 border border-slate-100">
                                    <p className="text-xs font-medium text-slate-500 mb-1">
                                      Notes
                                    </p>
                                    {row.comment}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canEdit && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Complete inspection</h3>
          <p className="mt-1 text-sm text-slate-600">
            Rate all {summary.totalCriteria} criteria using the 0–3 scale, then submit
            for review. You can update the narrative report and export after submission.
          </p>
          {submitError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {submitError}
            </p>
          )}
          <Button
            className="mt-4"
            onClick={handleSubmit}
            disabled={submitting || summary.scoredCriteria < summary.totalCriteria}
          >
            {submitting ? "Submitting…" : "Submit inspection"}
          </Button>
          {summary.scoredCriteria < summary.totalCriteria && (
            <p className="mt-2 text-xs text-slate-500">
              {summary.totalCriteria - summary.scoredCriteria} criteria still need a rating.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
