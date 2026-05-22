export const DEMO_PASSWORD = "demo1234";

export type DemoAccount = {
  email: string;
  role: string;
  password: string;
  group: "central" | "branch" | "family";
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "superadmin@school.et",
    role: "Super Admin",
    password: DEMO_PASSWORD,
    group: "central",
  },
  {
    email: "admin.addis@school.et",
    role: "Branch Admin",
    password: DEMO_PASSWORD,
    group: "branch",
  },
  {
    email: "registrar.addis@school.et",
    role: "Registrar",
    password: DEMO_PASSWORD,
    group: "branch",
  },
  {
    email: "teacher.addis@school.et",
    role: "Teacher",
    password: DEMO_PASSWORD,
    group: "branch",
  },
  {
    email: "finance.addis@school.et",
    role: "Finance",
    password: DEMO_PASSWORD,
    group: "branch",
  },
  {
    email: "library.addis@school.et",
    role: "Librarian",
    password: DEMO_PASSWORD,
    group: "branch",
  },
  {
    email: "hr.addis@school.et",
    role: "HR Manager",
    password: DEMO_PASSWORD,
    group: "branch",
  },
  {
    email: "parent@school.et",
    role: "Parent",
    password: DEMO_PASSWORD,
    group: "family",
  },
  {
    email: "student@school.et",
    role: "Student (KG)",
    password: DEMO_PASSWORD,
    group: "family",
  },
  {
    email: "student.grade10@school.et",
    role: "Student (G10)",
    password: DEMO_PASSWORD,
    group: "family",
  },
];

export const DEMO_GROUP_LABELS: Record<DemoAccount["group"], string> = {
  central: "Central office",
  branch: "Branch staff",
  family: "Families",
};
