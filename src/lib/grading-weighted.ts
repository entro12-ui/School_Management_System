/** Total mark weight for all assessment columns combined. */
export const TOTAL_WEIGHT_MARKS = 100;

export type WeightComponent = {
  id: string;
  label: string;
  weightMarks: number;
  maxScore: number;
  assessmentId?: string;
};

export type StudentWeightedRow = {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  className: string;
  scores: Record<string, number | null>;
  weightedTotal: number | null;
};

export function newComponentId() {
  return `cmp_${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultComponents(): WeightComponent[] {
  return [
    { id: newComponentId(), label: "Quiz", weightMarks: 25, maxScore: 100 },
    { id: newComponentId(), label: "Midterm", weightMarks: 35, maxScore: 100 },
    { id: newComponentId(), label: "Final", weightMarks: 40, maxScore: 100 },
  ];
}

export function sumWeightMarks(components: WeightComponent[]): number {
  return Math.round(components.reduce((s, c) => s + (c.weightMarks || 0), 0) * 100) / 100;
}

export function weightsAreValid(components: WeightComponent[]): boolean {
  return Math.abs(sumWeightMarks(components) - TOTAL_WEIGHT_MARKS) < 0.01;
}

/** Contribution for one column: (marks earned / max marks) × column weight marks */
export function weightedContribution(
  score: number,
  maxScore: number,
  weightMarks: number
): number {
  return (score / maxScore) * weightMarks;
}

/** Total marks = sum of raw marks entered in each column. */
export function computeWeightedTotal(
  components: WeightComponent[],
  scores: Record<string, number | null | undefined>
): number | null {
  if (components.length === 0) return null;
  let total = 0;
  let hasAny = false;
  for (const c of components) {
    const raw = scores[c.id];
    if (raw === null || raw === undefined || Number.isNaN(raw)) continue;
    hasAny = true;
    total += raw;
  }
  if (!hasAny) return null;
  return Math.round(total * 100) / 100;
}

export function buildSheetKey(staffId: string, subjectId: string, classId: string) {
  return `sheet:${staffId}:${subjectId}:${classId}`;
}

/** @deprecated Use sumWeightMarks */
export const sumWeights = sumWeightMarks;
