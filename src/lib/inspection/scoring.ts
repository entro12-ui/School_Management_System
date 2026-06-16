import type {
  CriterionScoreInput,
  InspectionFramework,
  InspectionScoreSummary,
  StandardScoreSummary,
} from "./types";
import { getStandardDomainWeights, groupCriteriaByIndicator } from "./framework";

const SCALE_MAX = 3;

export function earnedPointsForCriterion(
  score: number | null | undefined,
  criterionMaxPoints: number
): number {
  if (score == null || score < 0) return 0;
  const clamped = Math.min(SCALE_MAX, Math.max(0, score));
  return (clamped / SCALE_MAX) * criterionMaxPoints;
}

export function computeInspectionScores(
  framework: InspectionFramework,
  scores: CriterionScoreInput[]
): InspectionScoreSummary {
  const criteriaByIndicator = groupCriteriaByIndicator(framework);
  const scoreMap = new Map(scores.map((s) => [s.criterionKey, s]));

  const standardSummaries: StandardScoreSummary[] = framework.standards.map(
    (standard) => {
      const indicators = framework.indicators.filter(
        (i) => i.standardNumber === standard.number
      );
      let earned = 0;
      let scored = 0;
      let totalCriteria = 0;

      for (const indicator of indicators) {
        const criteria = criteriaByIndicator.get(indicator.code) ?? [];
        totalCriteria += criteria.length;
        for (const criterion of criteria) {
          const key = `${criterion.indicatorCode}.${criterion.number}`;
          const entry = scoreMap.get(key);
          if (entry?.score != null) {
            scored += 1;
            earned += earnedPointsForCriterion(entry.score, criterion.maxPoints);
          }
        }
      }

      return {
        number: standard.number,
        titleEn: standard.titleEn,
        titleAm: standard.titleAm,
        maxPoints: standard.maxPoints,
        earnedPoints: round(earned),
        scoredCount: scored,
        totalCriteria,
      };
    }
  );

  const totalEarned = round(
    standardSummaries.reduce((sum, s) => sum + s.earnedPoints, 0)
  );
  const totalMax = round(
    framework.standards.reduce((sum, s) => sum + s.maxPoints, 0)
  );
  const overallPercent =
    totalMax > 0 ? round((totalEarned / totalMax) * 100) : 0;
  const scoredCriteria = scores.filter((s) => s.score != null).length;
  const totalCriteria = framework.criteria.length;

  const { sectionByStandard, sectionDomain } =
    getStandardDomainWeights(framework);

  const domainEarned = new Map<string, number>();
  const domainMax = new Map<string, number>();

  for (const standard of framework.standards) {
    const sectionCode = sectionByStandard.get(standard.number);
    const domainCode = sectionCode
      ? sectionDomain.get(sectionCode)
      : undefined;
    if (!domainCode) continue;
    domainEarned.set(
      domainCode,
      (domainEarned.get(domainCode) ?? 0) +
        standardSummaries.find((s) => s.number === standard.number)!.earnedPoints
    );
    domainMax.set(
      domainCode,
      (domainMax.get(domainCode) ?? 0) + standard.maxPoints
    );
  }

  const domains = framework.domains.map((domain) => {
    const earned = domainEarned.get(domain.code) ?? 0;
    const max = domainMax.get(domain.code) ?? 0;
    return {
      code: domain.code,
      titleEn: domain.titleEn,
      titleAm: domain.titleAm,
      weightPercent: domain.weightPercent,
      maxPoints: round(max),
      earnedPoints: round(earned),
      percent: max > 0 ? round((earned / max) * 100) : 0,
    };
  });

  return {
    totalEarned,
    totalMax,
    overallPercent,
    scoredCriteria,
    totalCriteria,
    standards: standardSummaries,
    domains,
  };
}

export function identifyStrengthsAndGaps(
  summary: InspectionScoreSummary,
  thresholdStrong = 75,
  thresholdWeak = 50
): { strengths: string[]; gaps: string[] } {
  const strengths: string[] = [];
  const gaps: string[] = [];

  for (const standard of summary.standards) {
    const pct =
      standard.maxPoints > 0
        ? (standard.earnedPoints / standard.maxPoints) * 100
        : 0;
    const label = `Standard ${standard.number}: ${standard.titleEn}`;
    if (pct >= thresholdStrong && standard.scoredCount > 0) {
      strengths.push(`${label} (${round(pct)}%)`);
    } else if (pct < thresholdWeak && standard.scoredCount > 0) {
      gaps.push(`${label} (${round(pct)}%)`);
    }
  }

  return { strengths, gaps };
}

function round(n: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
