"use client";

import {
  Bot,
  BrainCircuit,
  ClipboardCheck,
  FileText,
  MessageSquareText,
} from "lucide-react";
import { MarketingEyebrow } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

const AI_ICONS = [Bot, BrainCircuit, ClipboardCheck, FileText, MessageSquareText] as const;

export function HomeAiCapabilities() {
  const { content } = useLandingLanguage();
  const { ai } = content;

  return (
    <section id="ai" className="scroll-mt-28 mt-24 sm:mt-28">
      <div className="landing-panel landing-panel-accent relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-premium-accent/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <MarketingEyebrow centered>{ai.eyebrow}</MarketingEyebrow>

          <h2 className="landing-brand-display mt-4 text-[1.875rem] font-normal leading-tight tracking-tight text-premium-ink sm:text-4xl">
            {ai.title}{" "}
            <span className="bg-gradient-to-r from-premium-accent to-premium-accent-deep bg-clip-text text-transparent">
              {ai.titleHighlight}
            </span>
          </h2>

          <p className="mt-3 text-base font-medium leading-relaxed text-premium-ink/65 sm:text-lg">
            {ai.lead}
          </p>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ai.capabilities.map((feature, index) => {
            const Icon = AI_ICONS[index] ?? Bot;
            const isLast = index === ai.capabilities.length - 1;
            return (
              <article
                key={feature.title}
                className={
                  isLast
                    ? "landing-tool-card sm:col-span-2 lg:col-span-1"
                    : "landing-tool-card"
                }
              >
                <span className="landing-icon-well bg-gradient-to-br from-premium-accent to-premium-accent-deep text-white">
                  <Icon className="h-4 w-5 text-white" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-premium-ink">{feature.title}</h3>
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
