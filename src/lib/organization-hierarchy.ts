import type { UserRole } from "@prisma/client";
import { ROLE_HOME, ROLE_LABELS } from "@/lib/auth/roles";

export type OrgRoleNode = {
  role: UserRole;
  label: string;
  description: string;
  portalHref: string;
  scope: "central" | "branch" | "family";
  accent: string;
};

export type OrgModuleNode = {
  id: string;
  title: string;
  description: string;
  items: string[];
};

export const CENTRAL_OFFICE = {
  title: "Central Office",
  subtitle: "Super Admin · system-wide control",
  description:
    "Cross-branch dashboards, global settings, audit logs, and consolidated exports for leadership.",
  capabilities: [
    "All branches & enrollment",
    "Global settings & policies",
    "Audit trail & compliance",
    "PDF / Excel / CSV exports",
  ],
};

export const BRANCH_STAFF_ROLES: OrgRoleNode[] = [
  {
    role: "BRANCH_ADMIN",
    label: ROLE_LABELS.BRANCH_ADMIN,
    description: "Branch KPIs, staff, classes, registrar approvals",
    portalHref: ROLE_HOME.BRANCH_ADMIN,
    scope: "branch",
    accent: "from-violet-500 to-indigo-600",
  },
  {
    role: "REGISTRAR",
    label: ROLE_LABELS.REGISTRAR,
    description: "Enroll students, staff, and parent accounts",
    portalHref: ROLE_HOME.REGISTRAR,
    scope: "branch",
    accent: "from-sky-500 to-blue-600",
  },
  {
    role: "TEACHER",
    label: ROLE_LABELS.TEACHER,
    description: "Grading, weekly attendance, class rosters",
    portalHref: ROLE_HOME.TEACHER,
    scope: "branch",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    role: "FINANCE_OFFICER",
    label: ROLE_LABELS.FINANCE_OFFICER,
    description: "Semester fees, payments, financial reports",
    portalHref: ROLE_HOME.FINANCE_OFFICER,
    scope: "branch",
    accent: "from-amber-500 to-orange-600",
  },
  {
    role: "LIBRARIAN",
    label: ROLE_LABELS.LIBRARIAN,
    description: "Catalog, issue/return, fines",
    portalHref: ROLE_HOME.LIBRARIAN,
    scope: "branch",
    accent: "from-rose-500 to-pink-600",
  },
  {
    role: "HR_OFFICER",
    label: ROLE_LABELS.HR_OFFICER,
    description: "Employees, payroll, leave, recruitment",
    portalHref: ROLE_HOME.HR_OFFICER,
    scope: "branch",
    accent: "from-violet-500 to-purple-600",
  },
];

export const FAMILY_ROLES: OrgRoleNode[] = [
  {
    role: "PARENT",
    label: ROLE_LABELS.PARENT,
    description: "Fees, results, attendance for linked children",
    portalHref: ROLE_HOME.PARENT,
    scope: "family",
    accent: "from-cyan-500 to-blue-500",
  },
  {
    role: "STUDENT",
    label: ROLE_LABELS.STUDENT,
    description: "Personal timetable, grades, announcements",
    portalHref: ROLE_HOME.STUDENT,
    scope: "family",
    accent: "from-fuchsia-500 to-purple-600",
  },
];

export const ACADEMIC_LAYERS = [
  { label: "Grade bands", detail: "KG · Primary 1–5 · Junior 6–8 · Senior 9–12" },
  { label: "Classes", detail: "Sections per branch & academic year" },
  { label: "Homeroom", detail: "One teacher per section" },
  { label: "Students", detail: "Roster, attendance, assessments" },
];

export const INTEGRATED_MODULES: OrgModuleNode[] = [
  {
    id: "academic",
    title: "Academic",
    description: "KG–12 teaching & assessment",
    items: ["Weighted grading", "Report cards", "GPA & transcripts"],
  },
  {
    id: "attendance",
    title: "Attendance",
    description: "Daily & weekly tracking",
    items: ["Weekly sheet", "Daily summary", "Parent visibility"],
  },
  {
    id: "finance",
    title: "Finance",
    description: "Tuition & collections",
    items: ["Semester fees", "Payment plans", "Outstanding balance"],
  },
  {
    id: "library",
    title: "Library",
    description: "Resources & circulation",
    items: ["Catalog", "Issue / return", "Fines"],
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Early warning & leadership insight",
    items: ["At-risk flags", "Dropout warning", "Intervention suggestions"],
  },
  {
    id: "communication",
    title: "Communication",
    description: "Family-ready updates",
    items: ["Parent drafts", "Multilingual messages", "WhatsApp / Telegram"],
  },
];
