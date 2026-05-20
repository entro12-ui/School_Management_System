"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ICONS, type NavItemConfig } from "@/lib/nav/icons";
import { X } from "lucide-react";

interface AppSidebarProps {
  nav: NavItemConfig[];
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ nav, open, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/teacher" || href === "/branch" || href === "/admin") {
      return pathname === href;
    }
    if (pathname === href) return true;
    // Avoid highlighting parent when a more specific nav item matches (e.g. grading vs grading/single)
    const hasMoreSpecificMatch = nav.some(
      (item) =>
        item.href !== href &&
        item.href.startsWith(`${href}/`) &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`))
    );
    if (hasMoreSpecificMatch) return false;
    return pathname.startsWith(`${href}/`);
  }

  const gradingHrefs = ["/teacher/grading", "/teacher/grading/single"];

  const content = (
    <nav className="flex flex-1 flex-col gap-1 p-4">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Menu
      </p>
      {nav.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const active = isActive(item.href);
        const showGradingLabel =
          item.href === "/teacher/grading" &&
          nav.some((n) => gradingHrefs.includes(n.href));

        return (
          <div key={item.href}>
            {showGradingLabel && (
              <p className="mb-1 mt-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 first:mt-0">
                Grading
              </p>
            )}
            <Link
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-slate-400")}
              />
              {item.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 lg:hidden">
          <span className="text-sm font-semibold text-slate-900">Navigation</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {content}
      </aside>
    </>
  );
}
