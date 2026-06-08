"use client";

import {
  BarChart3,
  BookOpen,
  Bot,
  ClipboardList,
  FileText,
  Library,
  MessageSquare,
  Shield,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

const MODULE_ICONS: Record<string, typeof BookOpen> = {
  academic: BookOpen,
  attendance: ClipboardList,
  finance: Wallet,
  library: Library,
  analytics: BarChart3,
  communication: MessageSquare,
  ai: Bot,
  "assistive-tools": Sparkles,
  registrar: FileText,
  hr: Users,
  security: Shield,
};

export function HomeFeatures() {
  const { content } = useLandingLanguage();
  const { modules } = content;

  return (
    <section id="features" className="scroll-mt-28 mt-24 sm:mt-28">
      <MarketingSectionHeader
        eyebrow={modules.eyebrow}
        title={modules.title}
        lead={modules.lead}
        centered
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.items.map((mod, i) => {
          const Icon = MODULE_ICONS[mod.id] ?? UserCheck;
          const featured = i === 0;
          const isAi = mod.id === "ai";

          return (
            <article
              key={mod.id}
              className={`marketing-card !p-5 ${featured ? "sm:col-span-2 lg:col-span-3 sm:!p-7" : ""} ${isAi ? "ring-1 ring-premium-accent/25" : ""}`}
            >
              <div className={featured ? "sm:flex sm:gap-10" : ""}>
                <div className={featured ? "sm:flex-1" : ""}>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${isAi ? "bg-gradient-to-br from-premium-accent to-premium-accent-deep" : "bg-premium-accent/10"}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${isAi ? "text-white" : "text-premium-accent"}`}
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-premium-ink">{mod.title}</h3>
                  <p className="mt-1 text-sm text-premium-ink/50">{mod.description}</p>
                  <ul
                    className={`mt-4 space-y-2 ${
                      featured ? "sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0" : ""
                    }`}
                  >
                    {mod.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-premium-ink/70"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-premium-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
