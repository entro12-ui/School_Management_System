"use client";

import { useState } from "react";
import { ParentCommunicationBot } from "@/components/parent/parent-communication-bot";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import type { NavItemConfig } from "@/lib/nav/icons";
import type { UserRole } from "@prisma/client";

interface PortalLayoutProps {
  title: string;
  subtitle?: string;
  nav: NavItemConfig[];
  userName?: string | null;
  userRole?: string;
  userRoleEnum?: UserRole;
  branchName?: string | null;
  userPhotoUrl?: string | null;
  signOutAction: () => void | Promise<void>;
  children: React.ReactNode;
}

export function PortalLayout({
  title,
  subtitle,
  nav,
  userName,
  userRole,
  userRoleEnum,
  branchName,
  userPhotoUrl,
  signOutAction,
  children,
}: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar
        nav={nav}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title={title}
          subtitle={subtitle}
          userName={userName}
          userRole={userRole}
          userRoleEnum={userRoleEnum}
          branchName={branchName}
          userPhotoUrl={userPhotoUrl}
          onMenuClick={() => setSidebarOpen(true)}
          signOutAction={signOutAction}
        />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {userRoleEnum === "TEACHER" ? (
        <ParentCommunicationBot
          apiPath="/api/teacher/communication-bot"
          emptyTitle="No students available"
          emptyDescription="Assign this teacher to a class or subject before generating parent communication drafts."
          introText="Choose a student and message type to generate a parent-ready draft you can copy, download, or share."
        />
      ) : null}
    </div>
  );
}
