import type { NavItemConfig } from "./icons";

export const TEACHER_NAV: NavItemConfig[] = [
  { href: "/teacher", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/teacher/grading", label: "Full assessment", icon: "FileSpreadsheet" },
  { href: "/teacher/grading/single", label: "Single assessment", icon: "ClipboardCheck" },
  { href: "/teacher/attendance", label: "Weekly sheet", icon: "ClipboardList" },
  { href: "/teacher/students", label: "Students", icon: "Users" },
  { href: "/teacher/classes", label: "My classes", icon: "GraduationCap" },
  { href: "/teacher/reports", label: "Report cards", icon: "FileText" },
];
