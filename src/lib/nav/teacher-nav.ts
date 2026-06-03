import type { NavItemConfig } from "./icons";

export const TEACHER_NAV: NavItemConfig[] = [
  { href: "/teacher", label: "Home", icon: "LayoutDashboard" },
  { href: "/teacher/classes", label: "My classes", icon: "Users" },
  { href: "/teacher/grading", label: "Grading", icon: "ClipboardList" },
  { href: "/teacher/attendance", label: "Attendance", icon: "UserCheck" },
  { href: "/teacher/schedule", label: "Schedule", icon: "Calendar" },
  { href: "/teacher/reports", label: "Report cards", icon: "FileText" },
  { href: "/teacher/library", label: "Library", icon: "BookOpen" },
];
