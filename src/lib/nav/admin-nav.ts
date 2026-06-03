import type { NavItemConfig } from "./icons";

export const ADMIN_NAV: NavItemConfig[] = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/registrations", label: "Staff applications", icon: "UserCheck" },
  { href: "/registrar/enroll", label: "Enroll user", icon: "UserCheck" },
  { href: "/registrar/students", label: "Student records", icon: "Users" },
  { href: "/registrar/id-cards", label: "Student ID cards", icon: "IdCard" },
  { href: "/registrar/records", label: "Enrollment sheet", icon: "ClipboardList" },
  { href: "/admin/organization", label: "Organization", icon: "Network" },
  { href: "/hr", label: "Human Resources", icon: "Briefcase" },
  { href: "/admin/branches", label: "Branches", icon: "Users" },
  { href: "/admin/audit", label: "Audit logs", icon: "ClipboardList" },
  { href: "/admin/settings", label: "Settings", icon: "Settings" },
  { href: "/admin/reports", label: "Reports", icon: "FileText" },
];
