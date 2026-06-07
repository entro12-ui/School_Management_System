"use client";

import { useState } from "react";
import { BarChart3, Bot, Sparkles } from "lucide-react";
import { UserRole } from "@prisma/client";
import { ContentLanguagePicker } from "@/components/parent/content-language-picker";
import { ParentCommunicationBot } from "@/components/parent/parent-communication-bot";
import { StudentAiToolsPanel } from "@/components/students/student-ai-tools-panel";
import { StudentRiskInsightPanel } from "@/components/students/student-risk-insight-panel";
import type { ParentCommunicationContentLanguage } from "@/lib/parent-communication";
import type { StudentPerformanceRisk } from "@/lib/services/student-performance-analytics";
import { cn } from "@/lib/utils";

type HubTab = "analytics" | "communication" | "ai";

const tabs: { id: HubTab; label: string; icon: React.ReactNode }[] = [
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "communication", label: "Communication", icon: <Bot className="h-4 w-4" /> },
  { id: "ai", label: "AI support", icon: <Sparkles className="h-4 w-4" /> },
];

export function StudentIntelligenceHub({
  studentId,
  studentName,
  userRole,
  risk,
}: {
  studentId: string;
  studentName: string;
  userRole: UserRole;
  risk: StudentPerformanceRisk;
}) {
  const [activeTab, setActiveTab] = useState<HubTab>("analytics");
  const [contentLanguage, setContentLanguage] =
    useState<ParentCommunicationContentLanguage>("en");
  const commApiPath = `/api/staff/student-communication?studentId=${encodeURIComponent(studentId)}`;

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-slate-50/50 p-1">
      <div className="rounded-t-lg bg-white px-5 pb-4 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Student Intelligence Hub
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">
          Analytics, communication & AI for every department
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Early warning signals, family-ready parent drafts, and teaching assistance — all tied
          to {studentName}&apos;s live school records.
        </p>

        <div
          role="tablist"
          aria-label="Student intelligence sections"
          className="mt-5 flex flex-wrap gap-2"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-b-lg bg-white p-5 pt-2">
        {activeTab === "analytics" ? (
          <div role="tabpanel">
            <StudentRiskInsightPanel risk={risk} />
          </div>
        ) : null}

        {activeTab === "communication" ? (
          <div role="tabpanel" className="space-y-4">
            <ContentLanguagePicker
              value={contentLanguage}
              onChange={setContentLanguage}
            />
            <p className="text-sm text-slate-600">
              Generate parent drafts from this student&apos;s grades, attendance, and fee
              records in{" "}
              <span className="font-medium text-slate-900">
                {contentLanguage === "am" ? "Amharic" : "English"}
              </span>
              , then share via WhatsApp or Telegram.
            </p>
            <ParentCommunicationBot
              variant="embedded"
              forcedChildId={studentId}
              apiPath={commApiPath}
              contentLanguage={contentLanguage}
              onContentLanguageChange={setContentLanguage}
              hideContentLanguagePicker
              emptyTitle="Student not available for communication drafts"
              emptyDescription="This student record could not be loaded or you may not have access."
              introText=" Choose a message type to draft a family-ready update for this student's guardian."
            />
          </div>
        ) : null}

        {activeTab === "ai" ? (
          <div role="tabpanel">
            <StudentAiToolsPanel studentName={studentName} userRole={userRole} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
