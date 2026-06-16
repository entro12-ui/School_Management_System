"use client";

import Link from "next/link";
import { ClipboardCheck, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

export type GradingTab = "full" | "single";

const TAB_PATHS: Record<GradingTab, string> = {
  full: "/teacher/grading",
  single: "/teacher/grading/single",
};

export function GradingModeTabs({
  active,
  subjectId,
  classId,
}: {
  active: GradingTab;
  subjectId?: string;
  classId?: string;
}) {
  function href(tab: GradingTab) {
    const params = new URLSearchParams();
    if (subjectId) params.set("subjectId", subjectId);
    if (classId) params.set("classId", classId);
    const q = params.toString();
    return q ? `${TAB_PATHS[tab]}?${q}` : TAB_PATHS[tab];
  }

  const tabs: { id: GradingTab; label: string; desc: string; icon: typeof FileSpreadsheet }[] =
    [
      {
        id: "full",
        label: "Full assessment",
        desc: "Weighted columns · total marks",
        icon: FileSpreadsheet,
      },
      {
        id: "single",
        label: "Single assessment",
        desc: "One quiz or test · weight marks",
        icon: ClipboardCheck,
      },
    ];

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <Link
            key={t.id}
            href={href(t.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 transition",
              isActive
                ? "border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-200"
                : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              <t.icon className="h-5 w-5" />
            </div>
            <div>
              <p
                className={cn(
                  "font-semibold",
                  isActive ? "text-indigo-900" : "text-slate-900"
                )}
              >
                {t.label}
              </p>
              <p className="text-sm text-slate-500">{t.desc}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
