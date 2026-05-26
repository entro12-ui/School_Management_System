import { AcademicTerm, GradeBand } from "@prisma/client";
import { formatSemesterLabel } from "@/lib/semester-fees";

export const GRADE_BAND_ORDER: GradeBand[] = [
  GradeBand.KG,
  GradeBand.PRIMARY,
  GradeBand.JUNIOR_HIGH,
  GradeBand.SENIOR_HIGH,
];

export const GRADE_BAND_LABELS: Record<GradeBand, string> = {
  KG: "Kindergarten (KG)",
  PRIMARY: "Primary (Grades 1–5)",
  JUNIOR_HIGH: "Junior High (Grades 6–8)",
  SENIOR_HIGH: "Senior High (Grades 9–12)",
};

export const DEFAULT_SEMESTER_AMOUNTS: Record<GradeBand, number> = {
  KG: 22500,
  PRIMARY: 28000,
  JUNIOR_HIGH: 32000,
  SENIOR_HIGH: 38000,
};

export function formatGradeBand(band: GradeBand): string {
  return GRADE_BAND_LABELS[band] ?? band.replace(/_/g, " ");
}

export function feeStructureName(band: GradeBand, term: AcademicTerm): string {
  return `${formatGradeBand(band)} · ${formatSemesterLabel(term)} Tuition`;
}

export type BandSemesterFees = {
  gradeBand: GradeBand;
  label: string;
  semester1: number | null;
  semester2: number | null;
  semester1Id: string | null;
  semester2Id: string | null;
};

export function buildBandSemesterMatrix(
  fees: {
    id: string;
    gradeBand: GradeBand | null;
    gradeLevel: number | null;
    term: AcademicTerm | null;
    amount: unknown;
  }[]
): BandSemesterFees[] {
  return GRADE_BAND_ORDER.map((band) => {
    const bandFees = fees.filter(
      (f) => f.gradeBand === band && f.gradeLevel == null
    );
    const sem1 = bandFees.find((f) => f.term === AcademicTerm.SEMESTER_1);
    const sem2 = bandFees.find((f) => f.term === AcademicTerm.SEMESTER_2);

    return {
      gradeBand: band,
      label: formatGradeBand(band),
      semester1: sem1 ? Number(sem1.amount) : null,
      semester2: sem2 ? Number(sem2.amount) : null,
      semester1Id: sem1?.id ?? null,
      semester2Id: sem2?.id ?? null,
    };
  });
}
