"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

export function HomeFaq() {
  const { content } = useLandingLanguage();
  const { faq } = content;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-28 mt-24 sm:mt-28">
      <div className="landing-section-band">
        <MarketingSectionHeader eyebrow={faq.eyebrow} title={faq.title} centered />

        <div className="mt-10 divide-y divide-premium-ink/8 rounded-2xl border border-premium-ink/8 bg-white shadow-[var(--shadow-premium-sm)]">
          {faq.items.map((item, index) => {
            const open = openIndex === index;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition hover:bg-premium-canvas/50 sm:px-6"
                >
                  <span className="text-sm font-semibold text-premium-ink sm:text-base">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0 text-premium-ink/40 transition-transform",
                      open && "rotate-180 text-premium-accent"
                    )}
                  />
                </button>
                {open ? (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-premium-ink/65 sm:px-6">
                    {item.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
