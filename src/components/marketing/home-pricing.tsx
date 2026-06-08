"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

export function HomePricing() {
  const { content } = useLandingLanguage();
  const { pricing } = content;

  return (
    <section id="pricing" className="scroll-mt-28 mt-24 sm:mt-28">
      <MarketingSectionHeader
        eyebrow={pricing.eyebrow}
        title={pricing.title}
        lead={pricing.lead}
        centered
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {pricing.plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-white p-6 transition-shadow duration-200",
              plan.highlighted
                ? "border-premium-accent/40 shadow-[var(--shadow-premium-md)] ring-1 ring-premium-accent/20"
                : plan.promoBadge
                  ? "border-premium-accent/25 shadow-[var(--shadow-premium-sm)] ring-1 ring-premium-accent/10"
                  : "border-premium-ink/8 shadow-[var(--shadow-premium-sm)] hover:shadow-[var(--shadow-premium-md)]"
            )}
          >
            {plan.highlighted ? (
              <span className="absolute -top-3 left-6 rounded-md bg-premium-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                {pricing.recommended}
              </span>
            ) : null}
            {plan.promoBadge ? (
              <span className="absolute -top-3 right-6 rounded-md border border-premium-accent/30 bg-premium-accent-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-premium-accent">
                {plan.promoBadge}
              </span>
            ) : null}
            <p className="text-lg font-semibold text-premium-ink">{plan.name}</p>
            <p className="mt-1 text-sm text-premium-ink/50">{plan.tagline}</p>

            <div className="mt-6 border-b border-premium-ink/8 pb-5">
              <p className="text-2xl font-semibold text-premium-ink">{plan.price}</p>
              <p className="mt-0.5 text-xs text-premium-ink/40">{plan.priceNote}</p>
            </div>

            <ul className="mt-5 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-premium-ink/70">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-premium-accent" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href={plan.ctaHref ?? "#contact"}
              className={cn(
                "mt-7 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                plan.highlighted || plan.promoBadge
                  ? "marketing-btn-primary w-full"
                  : "marketing-btn-ghost w-full"
              )}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
