import {
  computeWeightedTotal,
  sumWeightMarks,
  TOTAL_WEIGHT_MARKS,
  type WeightComponent,
} from "@/lib/grading-weighted";

/** Sum of each column's maximum marks (full assessment scale). */
export function sumColumnMaxMarks(components: WeightComponent[]): number {
  return Math.round(components.reduce((s, c) => s + (c.maxScore || 0), 0) * 100) / 100;
}

export function averageStudentTotals(
  totals: (number | null | undefined)[]
): number | null {
  const valid = totals.filter((t): t is number => t !== null && t !== undefined);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100;
}

export function computeClassColumnAverages(
  components: WeightComponent[],
  scores: Record<string, Record<string, string | undefined>>,
  studentIds: string[]
): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const c of components) {
    const vals: number[] = [];
    for (const sid of studentIds) {
      const raw = scores[sid]?.[c.id];
      if (raw === undefined || raw === "") continue;
      const n = parseFloat(raw);
      if (!Number.isNaN(n)) vals.push(n);
    }
    out[c.id] =
      vals.length > 0
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
        : null;
  }
  return out;
}

export function buildFullAssessmentStats(
  components: WeightComponent[],
  scores: Record<string, Record<string, string | undefined>>,
  studentIds: string[]
) {
  const weightTotal = sumWeightMarks(components);
  const maxTotalMarks = sumColumnMaxMarks(components);

  const studentTotals = studentIds.map((sid) => {
    const rowScores: Record<string, number | null> = {};
    for (const c of components) {
      const raw = scores[sid]?.[c.id];
      rowScores[c.id] =
        raw === undefined || raw === "" ? null : parseFloat(raw);
    }
    return computeWeightedTotal(components, rowScores);
  });

  const classAverageTotal = averageStudentTotals(studentTotals);
  const columnAverages = computeClassColumnAverages(components, scores, studentIds);

  return {
    weightTotal,
    maxTotalMarks,
    classAverageTotal,
    studentTotals,
    columnAverages,
    targetWeightMarks: TOTAL_WEIGHT_MARKS,
  };
}

export { TOTAL_WEIGHT_MARKS };
