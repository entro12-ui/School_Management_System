import type { NavItemConfig } from "./icons";

export const BRANCH_NAV: NavItemConfig[] = [
  { href: "/branch", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/branch/students", label: "Students", icon: "Users" },
  { href: "/branch/staff", label: "Staff", icon: "GraduationCap" },
  { href: "/branch/classes", label: "Classes", icon: "BookOpen" },
  { href: "/finance/payments", label: "Fee payments", icon: "Wallet" },
  { href: "/hr", label: "Human Resources", icon: "Briefcase" },
  { href: "/registrar/enroll", label: "Enroll user", icon: "UserCheck" },
  { href: "/registrar/students", label: "Student records", icon: "Users" },
  { href: "/registrar/id-cards", label: "Student ID cards", icon: "IdCard" },
  { href: "/registrar/records", label: "Enrollment sheet", icon: "ClipboardList" },
  { href: "/registrar/schedules", label: "Class schedules", icon: "Calendar" },
  { href: "/branch/registrations", label: "Staff applications", icon: "ClipboardList" },
  { href: "/branch/audit", label: "Audit log", icon: "FileText" },
  { href: "/branch/inspection", label: "Inspection", icon: "ClipboardCheck" },
  { href: "/branch/reports", label: "Reports", icon: "Download" },
];
