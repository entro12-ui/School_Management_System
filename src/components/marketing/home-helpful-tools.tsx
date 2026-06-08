"use client";

import {
  BookOpenCheck,
  ClipboardCheck,
  FileText,
  MessageSquareText,
  UserCheck,
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

export function HomeHelpfulTools() {
  const { content } = useLandingLanguage();
  const { tools } = content;

  return (
    <section id="tools" className="scroll-mt-28 mt-24 sm:mt-28">
      <div className="landing-panel landing-panel-accent">
        <MarketingSectionHeader
          eyebrow={tools.eyebrow}
          title={tools.title}
          lead={tools.lead}
          centered
        />

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {tools.helpfulTools.map((feature, index) => {
            const Icon = TOOL_ICONS[index] ?? BookOpenCheck;
            return (
              <article key={feature.title} className="landing-tool-card">
                <span className="landing-icon-well">
                  <Icon className="h-4 w-5 text-premium-accent" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-premium-ink">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-premium-ink/55">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
