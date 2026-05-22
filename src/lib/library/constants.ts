import { GradeBand } from "@prisma/client";

export const BOOK_CATEGORIES = [
  "Picture book",
  "Alphabet",
  "Story book",
  "Textbook",
  "Reference",
  "Fiction",
  "Science",
  "STEM",
  "History",
  "Literature",
  "Exam prep",
  "Digital",
  "Other",
] as const;

export const BOOK_SUBJECTS = [
  "Language",
  "Mathematics",
  "Science",
  "Social studies",
  "Arts",
  "Physical education",
  "General",
] as const;

export const GRADE_BAND_OPTIONS: { value: GradeBand; label: string }[] = [
  { value: GradeBand.KG, label: "KG" },
  { value: GradeBand.PRIMARY, label: "Elementary (1–5)" },
  { value: GradeBand.JUNIOR_HIGH, label: "Middle school (6–8)" },
  { value: GradeBand.SENIOR_HIGH, label: "High school (9–12)" },
];

export const RESERVATION_HOLD_DAYS = 7;
