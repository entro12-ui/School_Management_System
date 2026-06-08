"use client";

import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

export function HomeStatsBar() {
  const { content } = useLandingLanguage();

  return (
    <div className="relative -mt-6 sm:-mt-8">
      <div className="rounded-2xl border border-premium-ink/8 bg-white px-4 py-6 shadow-[var(--shadow-premium-md)] sm:px-8 sm:py-7">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
          {content.stats.items.map((stat) => (
            <div
              key={stat.label}
              className="landing-stat-divider relative text-center sm:text-left"
            >
              <p className="text-2xl font-semibold tracking-tight text-premium-accent sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-premium-ink/50 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
