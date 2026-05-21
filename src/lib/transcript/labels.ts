import type { AcademicTerm, AssessmentType } from "@prisma/client";

export function formatAssessmentType(type: AssessmentType): string {
  const map: Record<AssessmentType, string> = {
    DAILY_REPORT: "Daily report",
    PLAY_BASED: "Play-based",
    QUIZ: "Quiz",
    MIDTERM: "Midterm",
    FINAL: "Final",
    NATIONAL_PREP: "National prep",
    CONTINUOUS: "Continuous assessment",
  };
  return map[type] ?? type;
}

export function formatAcademicTerm(term: AcademicTerm | null | undefined): string {
  if (!term) return "—";
  return term.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatGradeLevel(level: number): string {
  if (level === 0) return "KG";
  return `Grade ${level}`;
}
