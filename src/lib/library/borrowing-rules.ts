import type { GradeBand } from "@prisma/client";
import { LibraryBorrowerType } from "@prisma/client";

export type BorrowingPolicy = {
  maxBooks: number;
  loanDays: number;
  label: string;
};

/** KG–12 borrow limits per spec */
export function getBorrowingPolicy(
  gradeLevel: number,
  borrowerType: LibraryBorrowerType
): BorrowingPolicy {
  if (borrowerType === LibraryBorrowerType.TEACHER) {
    return { maxBooks: 10, loanDays: 30, label: "Teacher" };
  }
  if (gradeLevel <= 2) {
    return { maxBooks: 2, loanDays: 7, label: "KG–Grade 2" };
  }
  if (gradeLevel <= 8) {
    return { maxBooks: 3, loanDays: 14, label: "Grade 3–8" };
  }
  return { maxBooks: 5, loanDays: 21, label: "Grade 9–12" };
}

export function dueDateFromPolicy(gradeLevel: number, borrowerType: LibraryBorrowerType): Date {
  const { loanDays } = getBorrowingPolicy(gradeLevel, borrowerType);
  const d = new Date();
  d.setDate(d.getDate() + loanDays);
  d.setHours(23, 59, 59, 999);
  return d;
}

export const GRADE_BAND_LIBRARY_LABELS: Record<GradeBand, string> = {
  KG: "KG (picture & alphabet books)",
  PRIMARY: "Elementary (Grades 1–5)",
  JUNIOR_HIGH: "Middle school (Grades 6–8)",
  SENIOR_HIGH: "High school (Grades 9–12)",
};

export const READING_BADGE_THRESHOLDS = [
  { books: 5, badge: "Bronze Reader" },
  { books: 10, badge: "Silver Reader" },
  { books: 20, badge: "Gold Reader" },
  { books: 30, badge: "Star Reader" },
] as const;
