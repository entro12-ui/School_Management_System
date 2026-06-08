"use client";

import { Building2, Globe2, Landmark, Network } from "lucide-react";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

const TRUST_ICONS = [Building2, Network, Landmark, Globe2] as const;

export function HomeTrustStrip() {
  const { content } = useLandingLanguage();
  const { trust } = content;

  return (
    <section className="mt-16 sm:mt-20" aria-label={trust.label}>
      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-premium-ink/40">
        {trust.label}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {trust.items.map((item, index) => {
          const Icon = TRUST_ICONS[index] ?? Building2;
          return (
            <div
              key={item}
              className="inline-flex items-center gap-2.5 rounded-full border border-premium-ink/8 bg-white px-4 py-2.5 text-sm font-medium text-premium-ink/70 shadow-[var(--shadow-premium-sm)]"
            >
              <Icon className="h-4 w-4 text-premium-accent" strokeWidth={1.75} />
              {item}
            </div>
          );
        })}
      </div>
    </section>
  );
}
