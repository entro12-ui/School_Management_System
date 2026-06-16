import type { NavItemConfig } from "./icons";

export const INVENTORY_NAV: NavItemConfig[] = [
  { href: "/inventory", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/inventory/items", label: "Items", icon: "Package" },
  { href: "/inventory/categories", label: "Categories", icon: "Network" },
  { href: "/inventory/locations", label: "Locations", icon: "Building2" },
  { href: "/inventory/stock", label: "Stock", icon: "ClipboardList" },
  { href: "/inventory/assets", label: "Assets", icon: "Briefcase" },
  { href: "/inventory/requests", label: "Requests", icon: "ClipboardCheck" },
  { href: "/inventory/suppliers", label: "Suppliers", icon: "Truck" },
  { href: "/inventory/purchase-orders", label: "Purchase orders", icon: "FileSpreadsheet" },
  { href: "/inventory/alerts", label: "Alerts", icon: "Shield" },
  { href: "/inventory/reports", label: "Reports", icon: "BarChart3" },
];

export const INVENTORY_REQUEST_NAV: NavItemConfig[] = [
  { href: "/inventory/requests", label: "My requests", icon: "ClipboardCheck" },
];
