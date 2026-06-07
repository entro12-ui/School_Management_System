"use client";

import {
  BookOpenCheck,
  ClipboardCheck,
  FileText,
  IdCard,
  Library,
  MessageSquareText,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

const TOOL_ICONS = [
  BookOpenCheck,
  ClipboardCheck,
  UserCheck,
  FileText,
  MessageSquareText,
] as const;

const COVERAGE_ICONS = [
  UsersRound,
  IdCard,
  ClipboardCheck,
  FileText,
  Library,
  UserCheck,
  MessageSquareText,
  ShieldCheck,
] as const;

export function HomeAiCapabilities() {
  const { content } = useLandingLanguage();
  const { tools } = content;

  return (
    <section id="tools" className="scroll-mt-28 mt-24 sm:mt-28">
      <div className="rounded-2xl border border-premium-ink/8 bg-white p-8 shadow-[var(--shadow-premium-md)] sm:p-10">
        <MarketingSectionHeader
          eyebrow={tools.eyebrow}
          title={tools.title}
          lead={tools.lead}
        />

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.helpfulTools.map((feature, index) => {
            const Icon = TOOL_ICONS[index] ?? BookOpenCheck;
            return (
              <article
                key={feature.title}
                className="marketing-card !p-5 hover:!translate-y-[-1px] lg:last:col-span-1 sm:[&:nth-child(5)]:col-span-2 sm:[&:nth-child(5)]:lg:col-span-1"
              >
                <Icon className="h-5 w-5 text-premium-accent" strokeWidth={1.75} />
                <h3 className="mt-3 text-sm font-semibold text-premium-ink">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-premium-ink/55">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-xl border border-premium-ink/8 bg-premium-canvas/60 p-6">
          <h3 className="font-semibold text-premium-ink">{tools.coverageTitle}</h3>
          <p className="mt-1 text-sm text-premium-ink/55">{tools.coverageLead}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tools.coverageItems.map((item, index) => {
              const Icon = COVERAGE_ICONS[index] ?? ShieldCheck;
              return (
                <div
                  key={item}
                  className="rounded-lg border border-premium-ink/6 bg-white p-3.5"
                >
                  <Icon className="h-4 w-4 text-premium-accent" strokeWidth={1.75} />
                  <p className="mt-2 text-sm leading-relaxed text-premium-ink/70">{item}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
