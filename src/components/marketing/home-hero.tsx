"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BookOpen,
  CalendarDays,
  Check,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Wallet,
} from "lucide-react";
import { MarketingEyebrow } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

const HIGHLIGHT_ICONS = [GraduationCap, Wallet, BookOpen, CalendarDays] as const;
const TODAY_ICONS = [BellRing, MessageSquare, ClipboardList] as const;

export function HomeHero({
  dashboardHref,
  signedIn,
}: {
  dashboardHref: string;
  signedIn: boolean;
}) {
  const { content } = useLandingLanguage();
  const hero = content.hero;

  return (
    <section id="overview" className="scroll-mt-28">
      <div className="relative overflow-hidden rounded-2xl border border-premium-ink/8 bg-white p-8 shadow-[var(--shadow-premium-lg)] sm:p-10 lg:p-12">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-premium-accent/8 blur-3xl"
          aria-hidden
        />

        <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <MarketingEyebrow>{hero.eyebrow}</MarketingEyebrow>

            <h1 className="mt-5 text-[2.5rem] font-semibold leading-[1.12] tracking-tight text-premium-ink sm:text-5xl">
              {hero.titleLine1}
              <span className="block text-premium-accent">{hero.titleLine2}</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-premium-ink/65">
              {hero.lead}
            </p>

            <ul className="mt-7 space-y-3">
              {hero.bullets.map((text) => (
                <li key={text} className="flex items-start gap-3 text-sm text-premium-ink/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-premium-accent/10">
                    <Check className="h-3 w-3 text-premium-accent" strokeWidth={2.5} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={signedIn ? dashboardHref : "/login"} className="marketing-btn-primary">
                {signedIn ? content.header.openPortal : content.header.signInToSchool}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#contact" className="marketing-btn-ghost">
                {content.header.scheduleCall}
              </a>
            </div>
          </div>

          <div className="marketing-card overflow-hidden !transform-none hover:!transform-none hover:!shadow-[var(--shadow-premium-sm)]">
            <div className="flex items-center justify-between border-b border-premium-accent/20 bg-premium-accent px-5 py-4 text-white">
              <div>
                <p className="text-sm font-medium">{hero.cardBranch}</p>
                <p className="mt-0.5 text-xs text-white/55">{hero.cardView}</p>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-premium-accent" aria-hidden />
            </div>

            <div className="grid grid-cols-2 gap-px bg-premium-ink/8 p-px">
              {hero.highlights.map((item, index) => {
                const Icon = HIGHLIGHT_ICONS[index] ?? GraduationCap;
                return (
                  <div key={item.title} className="bg-white p-4">
                    <Icon className="h-4 w-4 text-premium-accent" strokeWidth={1.75} />
                    <p className="mt-3 text-sm font-medium text-premium-ink">{item.title}</p>
                    <p className="mt-0.5 text-xs text-premium-ink/50">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-premium-ink/8 bg-premium-canvas/50 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-premium-ink/40">
                {hero.todayLabel}
              </p>
              <div className="space-y-2">
                {hero.todayItems.map((item, index) => {
                  const Icon = TODAY_ICONS[index] ?? BellRing;
                  return (
                    <div
                      key={item.title}
                      className="flex gap-3 rounded-lg border border-premium-ink/6 bg-white px-3 py-2.5"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-premium-ink/35" />
                      <div>
                        <p className="text-sm font-medium text-premium-ink">{item.title}</p>
                        <p className="text-xs text-premium-ink/50">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
