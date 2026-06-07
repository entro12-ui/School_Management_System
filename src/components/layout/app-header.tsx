"use client";

import { Menu, Bell, LogOut, GraduationCap, Building2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PortalHomeLink } from "./portal-home-link";
import type { UserRole } from "@prisma/client";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string | null;
  userRole?: string;
  userRoleEnum?: UserRole;
  organizationName?: string | null;
  branchName?: string | null;
  userPhotoUrl?: string | null;
  onMenuClick: () => void;
  signOutAction: () => void | Promise<void>;
}

export function AppHeader({
  title,
  subtitle,
  userName,
  userRole,
  userRoleEnum,
  organizationName,
  branchName,
  userPhotoUrl,
  onMenuClick,
  signOutAction,
}: AppHeaderProps) {
  const locationLabel = [organizationName, branchName].filter(Boolean).join(" · ");

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200/80 bg-white px-4">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-portal-sidebar text-white sm:flex">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>

      {organizationName && (
        <div
          className="flex max-w-[8rem] shrink-0 items-center gap-1 truncate rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-800 sm:max-w-[12rem] sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs lg:max-w-xs"
          title={locationLabel}
        >
          <Building2 className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
          <span className="truncate">{organizationName}</span>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-4">
        {userRoleEnum && <PortalHomeLink role={userRoleEnum} />}

        <button
          type="button"
          className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <UserAvatar name={userName} photoUrl={userPhotoUrl} size="md" className="shrink-0" />

        <div className="hidden text-right md:block">
          <p className="text-sm font-medium text-slate-900">{userName}</p>
          {organizationName ? (
            <p className="truncate text-xs font-medium text-indigo-700">{organizationName}</p>
          ) : null}
          <p className="truncate text-xs text-slate-500">
            {userRole}
            {branchName ? ` · ${branchName}` : ""}
          </p>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
