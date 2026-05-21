import type { NavItemConfig } from "./icons";

export const FINANCE_NAV: NavItemConfig[] = [
  { href: "/finance", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/finance/fees", label: "Fee structures", icon: "Wallet" },
  { href: "/finance/payments", label: "Payments", icon: "ClipboardList" },
  { href: "/finance/receipts", label: "Online receipts", icon: "FileText" },
  { href: "/finance/reports", label: "Reports", icon: "FileText" },
];
