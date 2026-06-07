"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  CalendarCheck,
  Check,
  ChevronRight,
  FileText,
  GraduationCap,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
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
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-2">
          {experience.experiences.map((item) => {
            const Icon = EXPERIENCE_ICONS[item.id];
            const activeTab = item.id === active.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                  activeTab
                    ? "border-premium-accent/30 bg-white shadow-[var(--shadow-premium-sm)]"
                    : "border-transparent bg-white/60 hover:border-premium-ink/10 hover:bg-white"
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                    activeTab ? "bg-premium-accent text-white" : "bg-premium-accent/10 text-premium-ink"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-premium-ink">{item.label}</span>
                  <span className="mt-0.5 block text-sm text-premium-ink/55">{item.title}</span>
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    activeTab ? "text-premium-accent" : "text-premium-ink/25"
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-premium-ink/8 bg-white shadow-[var(--shadow-premium-md)]">
          <div className="border-b border-premium-accent/20 bg-premium-accent px-6 py-6 text-white sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/45">
                  {active.label}
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-snug">{active.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{active.description}</p>
              </div>
              <div className="hidden rounded-xl bg-white/10 p-3 sm:block">
                <ActiveIcon className="h-6 w-6" strokeWidth={1.75} />
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {active.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-wider text-white/40">{metric.label}</p>
                  <p className="mt-0.5 text-sm font-medium">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div>
              <p className="text-sm font-semibold text-premium-ink">{experience.inPractice}</p>
              <ul className="mt-3 space-y-2.5">
                {active.actions.map((action) => (
                  <li key={action} className="flex gap-3 text-sm leading-relaxed text-premium-ink/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-premium-accent" strokeWidth={2.5} />
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {experience.outcomes.map((outcome, index) => {
                const Icon = OUTCOME_ICONS[index] ?? LineChart;
                return (
                  <article
                    key={outcome.title}
                    className="rounded-xl border border-premium-ink/8 bg-premium-canvas/40 p-4"
                  >
                    <Icon className="h-4 w-4 text-premium-accent" strokeWidth={1.75} />
                    <h4 className="mt-2.5 text-sm font-semibold text-premium-ink">{outcome.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-premium-ink/55">
                      {outcome.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
