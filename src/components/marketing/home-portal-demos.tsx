"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Crown,
  GraduationCap,
  LayoutDashboard,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";
import type { LandingPortalDemoId } from "@/lib/marketing/landing-content.types";

const DEMO_ICONS: Record<LandingPortalDemoId, typeof Crown> = {
  school: Crown,
  registrar: UserCheck,
  teacher: GraduationCap,
  parent: Users,
  student: LayoutDashboard,
};

export function HomePortalDemos() {
  const { content } = useLandingLanguage();
  const { portalDemos } = content;
  const [activeId, setActiveId] = useState<LandingPortalDemoId>("school");

  const active = useMemo(
    () => portalDemos.demos.find((demo) => demo.id === activeId) ?? portalDemos.demos[0],
    [activeId, portalDemos.demos]
  );
  const ActiveIcon = DEMO_ICONS[active.id];

  return (
    <section id="demos" className="scroll-mt-28 mt-20 sm:mt-24">
      <div className="landing-section-band">
        <MarketingSectionHeader
          eyebrow={portalDemos.eyebrow}
          title={portalDemos.title}
          lead={portalDemos.lead}
          centered
        />

        <div className="mt-10 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {portalDemos.demos.map((demo) => {
            const Icon = DEMO_ICONS[demo.id];
            const selected = demo.id === active.id;
            return (
              <button
                key={demo.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveId(demo.id)}
                className={cn(
                  "landing-demo-tab shrink-0",
                  selected && "landing-demo-tab-active"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {demo.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-premium-ink/8 bg-white shadow-[var(--shadow-premium-lg)]">
          <div className="border-b border-premium-accent/20 bg-premium-accent px-6 py-5 text-white sm:px-8 sm:py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/45">
                  {active.label}
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-snug sm:text-2xl">
                  {active.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
                  {active.description}
                </p>
              </div>
              <div className="hidden rounded-xl bg-white/10 p-3 sm:block">
                <ActiveIcon className="h-6 w-6" strokeWidth={1.75} />
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {active.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-wider text-white/40">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <ul className="space-y-2.5">
              {active.highlights.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-premium-ink/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-premium-accent" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/login" className="marketing-btn-primary shrink-0">
              {content.header.signIn}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
