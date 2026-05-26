import { GradeBand, UserRole } from "@prisma/client";

/** Subjects seeded in the database — grouped by grade band in the UI. */
export const SUBJECT_CATALOG: { code: string; name: string; gradeBand: GradeBand }[] = [
  // Kindergarten
  { code: "KG-PLAY", name: "Play-Based Learning", gradeBand: GradeBand.KG },
  { code: "KG-LIT", name: "Early Literacy", gradeBand: GradeBand.KG },
  { code: "KG-MATH", name: "Early Mathematics", gradeBand: GradeBand.KG },
  { code: "KG-ART", name: "Art & Craft", gradeBand: GradeBand.KG },
  { code: "KG-MUSIC", name: "Music & Movement", gradeBand: GradeBand.KG },
  { code: "KG-PE", name: "Physical Education", gradeBand: GradeBand.KG },

  // Primary (1–5)
  { code: "PRI-ENG", name: "English", gradeBand: GradeBand.PRIMARY },
  { code: "PRI-AMH", name: "Amharic", gradeBand: GradeBand.PRIMARY },
  { code: "PRI-MATH", name: "Mathematics", gradeBand: GradeBand.PRIMARY },
  { code: "PRI-SCI", name: "General Science", gradeBand: GradeBand.PRIMARY },
  { code: "PRI-SST", name: "Social Studies", gradeBand: GradeBand.PRIMARY },
  { code: "PRI-CIV", name: "Civics & Ethical Education", gradeBand: GradeBand.PRIMARY },
  { code: "PRI-ICT", name: "ICT", gradeBand: GradeBand.PRIMARY },
  { code: "PRI-ART", name: "Art", gradeBand: GradeBand.PRIMARY },
  { code: "PRI-PE", name: "Physical Education", gradeBand: GradeBand.PRIMARY },

  // Junior High (6–8)
  { code: "JH-ENG", name: "English", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-AMH", name: "Amharic", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-MATH", name: "Mathematics", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-BIO", name: "Biology", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-CHEM", name: "Chemistry", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-PHY", name: "Physics", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-GEO", name: "Geography", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-HIST", name: "History", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-CIV", name: "Civics", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-SST", name: "Social Studies", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-ICT", name: "ICT", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-PE", name: "Physical Education", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-ART", name: "Art", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-AFA", name: "Agriculture", gradeBand: GradeBand.JUNIOR_HIGH },
  { code: "JH-HPE", name: "Health & Physical Education", gradeBand: GradeBand.JUNIOR_HIGH },

  // Senior High (9–12)
  { code: "SH-ENG", name: "English", gradeBand: GradeBand.SENIOR_HIGH },
  { code: "SH-AMH", name: "Amharic", gradeBand: GradeBand.SENIOR_HIGH },
  { code: "SH-MATH", name: "Mathematics", gradeBand: GradeBand.SENIOR_HIGH },
  { code: "SH-BIO", name: "Biology", gradeBand: GradeBand.SENIOR_HIGH },
  { code: "SH-CHEM", name: "Chemistry", gradeBand: GradeBand.SENIOR_HIGH },
  { code: "SH-PHY", name: "Physics", gradeBand: GradeBand.SENIOR_HIGH },
  { code: "SH-GEO", name: "Geography", gradeBand: GradeBand.SENIOR_HIGH },
  { code: "SH-HIST", name: "History", gradeBand: GradeBand.SENIOR_HIGH },
  { code: "SH-CIV", name: "Civics", gradeBand: GradeBand.SENIOR_HIGH },
  { code: "SH-ECON", name: "Economics", gradeBand: GradeBand.SENIOR_HIGH },
  { code: "SH-ICT", name: "ICT", gradeBand: GradeBand.SENIOR_HIGH },
];

export const DEPARTMENT_OPTIONS = [
  { value: "Kindergarten", label: "Kindergarten" },
  { value: "Primary (1–5)", label: "Primary (1–5)" },
  { value: "Junior High (6–8)", label: "Junior High (6–8)" },
  { value: "Senior High (9–12)", label: "Senior High (9–12)" },
  { value: "Finance", label: "Finance" },
  { value: "Library", label: "Library" },
  { value: "Registrar Office", label: "Registrar Office" },
  { value: "Administration", label: "Administration" },
] as const;

export const TEACHER_DEPARTMENTS = DEPARTMENT_OPTIONS.filter((d) =>
  ["Kindergarten", "Primary (1–5)", "Junior High (6–8)", "Senior High (9–12)"].includes(
    d.value
  )
);

export function departmentsForRole(role: UserRole) {
  switch (role) {
    case UserRole.TEACHER:
      return TEACHER_DEPARTMENTS;
    case UserRole.FINANCE_OFFICER:
      return DEPARTMENT_OPTIONS.filter((d) => d.value === "Finance");
    case UserRole.LIBRARIAN:
      return DEPARTMENT_OPTIONS.filter((d) => d.value === "Library");
    case UserRole.REGISTRAR:
      return DEPARTMENT_OPTIONS.filter((d) => d.value === "Registrar Office");
    default:
      return DEPARTMENT_OPTIONS;
  }
}

export const GRADE_BAND_LABELS: Record<GradeBand, string> = {
  KG: "Kindergarten",
  PRIMARY: "Primary (1–5)",
  JUNIOR_HIGH: "Junior High (6–8)",
  SENIOR_HIGH: "Senior High (9–12)",
};

/** Maps teacher department dropdown → grade band subjects */
export const DEPARTMENT_TO_GRADE_BAND: Record<string, GradeBand> = {
  Kindergarten: GradeBand.KG,
  "Primary (1–5)": GradeBand.PRIMARY,
  "Junior High (6–8)": GradeBand.JUNIOR_HIGH,
  "Senior High (9–12)": GradeBand.SENIOR_HIGH,
};

export function gradeBandForDepartment(department: string): GradeBand | null {
  return DEPARTMENT_TO_GRADE_BAND[department] ?? null;
}

export function catalogSubjectsForDepartment(department: string) {
  const band = gradeBandForDepartment(department);
  if (!band) return [];
  return SUBJECT_CATALOG.filter((s) => s.gradeBand === band);
}

export function catalogSubjectsByDepartment() {
  const groups: { department: string; gradeBand: GradeBand; subjects: typeof SUBJECT_CATALOG }[] =
    [];
  for (const [department, gradeBand] of Object.entries(DEPARTMENT_TO_GRADE_BAND)) {
    groups.push({
      department,
      gradeBand,
      subjects: SUBJECT_CATALOG.filter((s) => s.gradeBand === gradeBand),
    });
  }
  return groups;
}
