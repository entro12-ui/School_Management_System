"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  CalendarCheck,
  Check,
  FileText,
  GraduationCap,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketingEyebrow, MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";
import type { LandingExperienceId } from "@/lib/marketing/landing-content.types";

const EXPERIENCE_ICONS = {
  leadership: ShieldCheck,
  teachers: GraduationCap,
  families: Users,
} as const;

const OUTCOME_ICONS = [LineChart, FileText, BellRing, CalendarCheck, MessageSquare] as const;

export function HomePlatformShowcase() {
  const { content } = useLandingLanguage();
  const { experience } = content;
  const [activeId, setActiveId] = useState<LandingExperienceId>("leadership");

  const active = useMemo(
    () => experience.experiences.find((item) => item.id === activeId) ?? experience.experiences[0],
    [activeId, experience.experiences]
  );
  const ActiveIcon = EXPERIENCE_ICONS[active.id];

  return (
    <section id="experience" className="scroll-mt-28 mt-24 sm:mt-28">
      <MarketingSectionHeader
        eyebrow={experience.eyebrow}
        title={experience.title}
        lead={experience.lead}
        centered
      />

      <div className="landing-panel landing-panel-accent mt-10">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {experience.experiences.map((item) => {
            const Icon = EXPERIENCE_ICONS[item.id];
            const selected = item.id === active.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveId(item.id)}
                className={cn("landing-demo-tab shrink-0", selected && "landing-demo-tab-active")}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-premium-ink/8 bg-white">
          <div className="grid gap-4 border-b border-premium-ink/8 bg-gradient-to-r from-premium-accent to-premium-accent-deep p-5 text-white sm:grid-cols-[1fr_auto] sm:items-start sm:p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <ActiveIcon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  {active.label}
                </p>
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-snug sm:text-xl">{active.title}</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">{active.description}</p>
            </div>

            <div className="flex flex-wrap gap-2 sm:max-w-[15rem] sm:justify-end">
              {active.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-center sm:min-w-[4.75rem]"
                >
                  <p className="text-[9px] font-medium uppercase tracking-wider text-white/45">
                    {metric.label}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold sm:text-sm">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-premium-ink/45">
              {experience.inPractice}
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {active.actions.map((action) => (
                <li
                  key={action}
                  className="flex gap-2.5 rounded-lg border border-premium-ink/6 bg-premium-canvas/50 px-3 py-2.5 text-sm leading-snug text-premium-ink/75"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-premium-accent" strokeWidth={2.5} />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-premium-ink/8 pt-6">
          <MarketingEyebrow>{experience.outcomesEyebrow}</MarketingEyebrow>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {experience.outcomes.map((outcome, index) => {
              const Icon = OUTCOME_ICONS[index] ?? LineChart;
              return (
                <article key={outcome.title} className="landing-outcome-chip">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-premium-accent" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-premium-ink">{outcome.title}</h4>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-premium-ink/55">
                      {outcome.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
