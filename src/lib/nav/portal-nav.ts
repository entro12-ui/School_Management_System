import { UserRole } from "@prisma/client";
import { ADMIN_NAV } from "./admin-nav";
import { BRANCH_NAV } from "./branch-nav";
import { FINANCE_NAV } from "./finance-nav";
import { REGISTRAR_NAV } from "./registrar-nav";
import type { NavItemConfig } from "./icons";

/** Sidebar nav for shared routes — branch admin keeps branch portal nav. */
export function navForUser(role: UserRole, area: "registrar" | "finance"): NavItemConfig[] {
  if (role === UserRole.BRANCH_ADMIN) return BRANCH_NAV;
  if (role === UserRole.SUPER_ADMIN) return ADMIN_NAV;
  if (area === "finance") return FINANCE_NAV;
  return REGISTRAR_NAV;
}
