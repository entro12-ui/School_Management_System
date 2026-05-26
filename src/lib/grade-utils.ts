import { GradeBand, SeniorStream } from "@prisma/client";

export function gradeLevelToBand(level: number): GradeBand {
  if (level === 0) return GradeBand.KG;
  if (level >= 1 && level <= 5) return GradeBand.PRIMARY;
  if (level >= 6 && level <= 8) return GradeBand.JUNIOR_HIGH;
  return GradeBand.SENIOR_HIGH;
}

export const GRADE_LEVEL_OPTIONS = [
  { value: 0, label: "KG" },
  { value: 1, label: "Grade 1" },
  { value: 2, label: "Grade 2" },
  { value: 3, label: "Grade 3" },
  { value: 4, label: "Grade 4" },
  { value: 5, label: "Grade 5" },
  { value: 6, label: "Grade 6" },
  { value: 7, label: "Grade 7" },
  { value: 8, label: "Grade 8" },
  { value: 9, label: "Grade 9" },
  { value: 10, label: "Grade 10" },
  { value: 11, label: "Grade 11" },
  { value: 12, label: "Grade 12" },
];

export const STREAM_OPTIONS: { value: SeniorStream; label: string }[] = [
  { value: SeniorStream.NATURAL_SCIENCE, label: "Natural Science" },
  { value: SeniorStream.SOCIAL_SCIENCE, label: "Social Science" },
  { value: SeniorStream.SCIENCE, label: "Science" },
];

export function requiresStream(gradeLevel: number) {
  return gradeLevel >= 11;
}

export function formatGradeLevel(level: number) {
  return GRADE_LEVEL_OPTIONS.find((g) => g.value === level)?.label ?? `Grade ${level}`;
}
