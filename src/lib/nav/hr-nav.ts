import { UserRole } from "@prisma/client";
import type { NavItemConfig } from "./icons";

export const HR_NAV: NavItemConfig[] = [
  { href: "/hr", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/hr/employees", label: "Employees", icon: "Users" },
  { href: "/hr/id-cards", label: "Employee ID cards", icon: "IdCard" },
  { href: "/hr/departments", label: "Departments", icon: "Network" },
  { href: "/hr/attendance", label: "Attendance", icon: "ClipboardList" },
  { href: "/hr/leave", label: "Leave", icon: "Calendar" },
  { href: "/hr/payroll", label: "Payroll", icon: "Wallet" },
  { href: "/hr/performance", label: "Performance", icon: "BarChart3" },
  { href: "/hr/training", label: "Training", icon: "GraduationCap" },
  { href: "/hr/assets", label: "Assets", icon: "BookOpen" },
  { href: "/hr/recruitment", label: "Recruitment", icon: "UserCheck" },
  { href: "/hr/settings", label: "HR roles", icon: "Shield" },
];

/** Sidebar for HR pages — includes portal home when opened from super admin or branch admin. */
export function hrNavForRole(role: UserRole): NavItemConfig[] {
  const portalHome: NavItemConfig[] =
    role === UserRole.SUPER_ADMIN
      ? [{ href: "/admin", label: "Home", icon: "LayoutDashboard" }]
      : role === UserRole.BRANCH_ADMIN
        ? [{ href: "/branch", label: "Home", icon: "LayoutDashboard" }]
        : [];

  return [...portalHome, ...HR_NAV];
}
