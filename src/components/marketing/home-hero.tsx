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
import { HeroIllustration } from "@/components/marketing/hero-illustrations";
import { MarketingEyebrow, landingPageWrapClass } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";
import { cn } from "@/lib/utils";

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
    <section id="overview" className="relative scroll-mt-28 overflow-hidden landing-hero-bg">
      <div
        className="pointer-events-none absolute inset-0 landing-grid-pattern opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-premium-accent/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-10 h-56 w-56 rounded-full bg-premium-accent/8 blur-3xl"
        aria-hidden
      />

      <div className={cn("relative pb-16 pt-10 sm:pb-20 sm:pt-14 lg:pb-24", landingPageWrapClass)}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="landing-fade-up">
            <MarketingEyebrow>{hero.eyebrow}</MarketingEyebrow>

            <h1 className="landing-hero-title landing-brand-display mt-5 text-[2.75rem] leading-[1.06] tracking-tight text-premium-ink sm:text-5xl lg:text-[3.5rem]">
              {hero.titleLine1}
              <span className="landing-hero-title-accent mt-1 block bg-gradient-to-r from-premium-accent via-[#159a8c] to-premium-accent-deep bg-clip-text font-normal text-transparent">
                {hero.titleLine2}
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-lg font-medium leading-relaxed text-premium-ink/65">
              {hero.lead}
            </p>

            <ul className="mt-7 space-y-3">
              {hero.bullets.map((text, index) => (
                <li
                  key={text}
                  className="flex items-start gap-3 text-sm font-medium text-premium-ink/80"
                  style={{ animationDelay: `${0.15 + index * 0.08}s` }}
                >
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
              <Link href="/register/school" className="marketing-btn-ghost">
                {content.header.bookWalkthrough}
              </Link>
              <a href="#contact" className="marketing-btn-ghost hidden sm:inline-flex">
                {content.header.scheduleCall}
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {hero.gallery.map((item) => (
                <figure
                  key={item.title}
                  className="landing-hero-gallery-item group overflow-hidden rounded-xl border border-premium-ink/8 bg-white shadow-[var(--shadow-premium-sm)] transition hover:border-premium-accent/25 hover:shadow-[var(--shadow-premium-md)]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-premium-warm">
                    <HeroIllustration
                      id={item.illustration}
                      title={item.alt}
                      className="object-contain transition duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <figcaption className="border-t border-premium-ink/6 px-2.5 py-2 text-center text-[10px] font-bold tracking-wide text-premium-ink/70 uppercase">
                    {item.title}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="relative landing-fade-up landing-fade-up-delay-2">
            {hero.sceneCards.map((card, index) => (
              <div
                key={card.label}
                className={cn(
                  "landing-hero-scene absolute z-20 hidden w-[148px] overflow-hidden rounded-xl border border-premium-ink/10 bg-white shadow-[var(--shadow-premium-md)] sm:block",
                  index === 0 ? "-left-4 top-8 lg:-left-8" : "-right-2 bottom-16 lg:-right-6",
                  index === 1 && "landing-hero-scene-delay"
                )}
              >
                <div className="aspect-[4/3] overflow-hidden bg-premium-warm">
                  <HeroIllustration id={card.illustration} title={card.alt} />
                </div>
                <p className="border-t border-premium-ink/6 px-2 py-1.5 text-center text-[9px] font-bold tracking-wider text-premium-accent uppercase">
                  {card.label}
                </p>
              </div>
            ))}

            <div className="landing-float relative z-10">
              <div className="landing-browser-chrome overflow-hidden">
                <div className="flex items-center gap-2 border-b border-premium-ink/8 bg-premium-canvas/80 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden />
                  <div className="ml-3 flex-1 rounded-md border border-premium-ink/8 bg-white px-3 py-1 text-[11px] text-premium-ink/40">
                    edusync.entroethiopia.com
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-premium-accent/20 bg-premium-accent px-5 py-4 text-white">
                  <div>
                    <p className="text-sm font-semibold">{hero.cardBranch}</p>
                    <p className="mt-0.5 text-xs text-white/55">{hero.cardView}</p>
                  </div>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-px bg-premium-ink/8 p-px">
                  {hero.highlights.map((item, index) => {
                    const Icon = HIGHLIGHT_ICONS[index] ?? GraduationCap;
                    return (
                      <div key={item.title} className="bg-white p-4">
                        <Icon className="h-4 w-4 text-premium-accent" strokeWidth={1.75} />
                        <p className="mt-3 text-sm font-semibold text-premium-ink">{item.title}</p>
                        <p className="mt-0.5 text-xs text-premium-ink/50">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-premium-ink/8 bg-premium-canvas/50 p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-premium-ink/40">
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
        </div>
      </div>
    </section>
  );
}
