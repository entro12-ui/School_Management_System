"use client";

import { Menu, Bell, LogOut, GraduationCap } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PortalHomeLink } from "./portal-home-link";
import type { UserRole } from "@prisma/client";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string | null;
  userRole?: string;
  userRoleEnum?: UserRole;
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
  branchName,
  userPhotoUrl,
  onMenuClick,
  signOutAction,
}: AppHeaderProps) {
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
          <p className="text-xs text-slate-500">
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
