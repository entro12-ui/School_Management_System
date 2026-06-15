"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  saveCriterionScore,
  submitInspectionRun,
} from "@/lib/actions/inspection";
import {
  groupCriteriaByIndicator,
  groupIndicatorsByStandard,
} from "@/lib/inspection/framework";
import type {
  InspectionFramework,
  InspectionScoreSummary,
} from "@/lib/inspection/types";
import { buildCriterionKey } from "@/lib/inspection/types";
import { Button } from "@/components/ui/button";
import { InspectionProgressBar } from "./inspection-progress-bar";

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

      <div className="space-y-3">
        {framework.standards.map((standard) => {
          const stdSummary = summary.standards.find((s) => s.number === standard.number);
          const isOpen = openStandards.has(standard.number);
          const indicators = indicatorsByStandard.get(standard.number) ?? [];

          return (
            <div
              key={standard.number}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleStandard(standard.number)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                {isOpen ? (
                  <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    Standard {standard.number}
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      {stdSummary
                        ? `${stdSummary.earnedPoints}/${stdSummary.maxPoints} pts · ${stdSummary.scoredCount}/${stdSummary.totalCriteria} criteria`
                        : `${standard.maxPoints} pts max`}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2">{standard.titleEn}</p>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 px-4 pb-4 space-y-4">
                  {indicators.map((indicator) => {
                    const criteria = criteriaByIndicator.get(indicator.code) ?? [];
                    return (
                      <div key={indicator.code} className="rounded-lg bg-slate-50/80 p-3">
                        <p className="font-medium text-slate-800">
                          Indicator {indicator.code}
                          <span className="ml-2 text-xs text-slate-500">
                            ({indicator.maxPoints} pts)
                          </span>
                        </p>
                        <p className="text-sm text-slate-600 mb-3">{indicator.titleEn}</p>

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

                            return (
                              <div
                                key={key}
                                className="rounded-lg border border-slate-200 bg-white p-3"
                              >
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-slate-400">
                                      Criterion {criterion.number}
                                      <span className="ml-1 text-slate-500">
                                        ({criterion.maxPoints} pts max)
                                      </span>
                                    </p>
                                    <p className="text-sm text-slate-800">{criterion.titleEn}</p>
                                  </div>

                                  {canEdit ? (
                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                      {Array.from({ length: scaleMax + 1 }, (_, i) => i).map(
                                        (val) => (
                                          <button
                                            key={val}
                                            type="button"
                                            onClick={() =>
                                              saveScore(
                                                criterion.indicatorCode,
                                                criterion.number,
                                                val,
                                                row.comment
                                              )
                                            }
                                            className={`h-9 w-9 rounded-lg text-sm font-semibold border transition-colors ${
                                              row.score === val
                                                ? "border-premium-accent bg-premium-accent text-white"
                                                : "border-slate-200 bg-white text-slate-700 hover:border-premium-accent/50"
                                            }`}
                                            disabled={savingKey === key}
                                          >
                                            {val}
                                          </button>
                                        )
                                      )}
                                      {savingKey === key && (
                                        <span className="text-xs text-slate-400">Saving…</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-sm font-semibold text-slate-700">
                                      Score: {row.score ?? "—"} / {scaleMax}
                                    </div>
                                  )}
                                </div>

                                {canEdit && (
                                  <textarea
                                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Comment or evidence note…"
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
                                )}
                                {!canEdit && row.comment && (
                                  <p className="mt-2 text-sm text-slate-600 italic">
                                    {row.comment}
                                  </p>
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
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600 mb-3">
            Submit when all {summary.totalCriteria} criteria are scored. You can still edit
            narrative and export the report after submission.
          </p>
          {submitError && (
            <p className="mb-3 text-sm text-red-600" role="alert">{submitError}</p>
          )}
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit inspection"}
          </Button>
        </div>
      )}
    </div>
  );
}
