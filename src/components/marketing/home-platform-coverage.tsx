"use client";

import {
  ClipboardCheck,
  ClipboardList,
  FileText,
  IdCard,
  Library,
  MessageSquareText,
  Package,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

const COVERAGE_ICONS = [
  UsersRound,
  IdCard,
  ClipboardCheck,
  FileText,
  Library,
  Package,
  ClipboardList,
  UserCheck,
  MessageSquareText,
  ShieldCheck,
] as const;

export function HomePlatformCoverage() {
  const { content } = useLandingLanguage();
  const { tools } = content;

  return (
    <section id="coverage" className="scroll-mt-28 mt-10 sm:mt-12">
      <div className="landing-panel landing-panel-muted">
        <MarketingSectionHeader
          eyebrow={tools.coverageEyebrow}
          title={tools.coverageTitle}
          lead={tools.coverageLead}
          centered
        />

        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {tools.coverageItems.map((item, index) => {
            const Icon = COVERAGE_ICONS[index] ?? ShieldCheck;
            return (
              <li key={item} className="landing-coverage-row">
                <Icon className="h-4 w-4 shrink-0 text-premium-accent" strokeWidth={1.75} />
                <span className="text-sm leading-snug text-premium-ink/75">{item}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
