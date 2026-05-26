"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";
import { ROLE_HOME } from "@/lib/auth/roles";
import { Home } from "lucide-react";

function portalHomeHref(role: UserRole, pathname: string): string | null {
  if (role === UserRole.SUPER_ADMIN) {
    if (pathname.startsWith("/hr")) return ROLE_HOME.SUPER_ADMIN;
    if (
      pathname.startsWith("/finance") ||
      pathname.startsWith("/registrar") ||
      pathname.startsWith("/library") ||
      pathname.startsWith("/branch")
    ) {
      return ROLE_HOME.SUPER_ADMIN;
    }
    return null;
  }

  if (role === UserRole.BRANCH_ADMIN && pathname.startsWith("/hr")) {
    return ROLE_HOME.BRANCH_ADMIN;
  }

  return null;
}

export function PortalHomeLink({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const href = portalHomeHref(role, pathname);
  if (!href) return null;

  const label = role === UserRole.SUPER_ADMIN ? "Super admin home" : "Branch home";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
    >
      <Home className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">Home</span>
    </Link>
  );
}
