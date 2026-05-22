import type { NavItemConfig } from "./icons";

export const LIBRARY_NAV: NavItemConfig[] = [
  { href: "/library", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/library/catalog", label: "Catalog", icon: "BookOpen" },
  { href: "/library/issue", label: "Issue & return", icon: "ClipboardList" },
  { href: "/library/reservations", label: "Reservations", icon: "Calendar" },
  { href: "/library/fines", label: "Fines", icon: "Wallet" },
  { href: "/library/accounts", label: "Accounts", icon: "Users" },
  { href: "/library/digital", label: "Digital library", icon: "FileText" },
  { href: "/library/reports", label: "Reports", icon: "BarChart3" },
];
