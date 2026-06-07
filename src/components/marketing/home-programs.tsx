"use client";

import { BarChart3, BookOpen, GraduationCap, Users } from "lucide-react";
import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

const PROGRAM_ICONS = [Users, BookOpen, BarChart3, GraduationCap] as const;

export function HomePrograms() {
  const { content } = useLandingLanguage();
  const { programs } = content;

  return (
    <section id="programs" className="scroll-mt-28 mt-24 sm:mt-28">
      <MarketingSectionHeader
        eyebrow={programs.eyebrow}
        title={programs.title}
        lead={programs.lead}
        centered
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {programs.items.map((program, index) => {
          const Icon = PROGRAM_ICONS[index] ?? Users;
          return (
            <article key={program.title} className="marketing-card !p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-accent/10">
                <Icon className="h-5 w-5 text-premium-accent" strokeWidth={1.75} />
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-premium-ink/40">
                {program.grades}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-premium-ink">{program.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-premium-ink/60">{program.desc}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
