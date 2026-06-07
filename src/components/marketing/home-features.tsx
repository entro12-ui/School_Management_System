"use client";

import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

export function HomeFeatures() {
  const { content } = useLandingLanguage();
  const { modules } = content;

  return (
    <section id="features" className="scroll-mt-28 mt-24 sm:mt-28">
      <MarketingSectionHeader
        eyebrow={modules.eyebrow}
        title={modules.title}
        lead={modules.lead}
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.items.map((mod, i) => (
          <article
            key={mod.id}
            className={`marketing-card !p-5 ${
              i === 0 ? "sm:col-span-2 lg:col-span-3 sm:!p-7" : ""
            }`}
          >
            <div className={i === 0 ? "sm:flex sm:gap-10" : ""}>
              <div className={i === 0 ? "sm:flex-1" : ""}>
                <h3 className="text-base font-semibold text-premium-ink">{mod.title}</h3>
                <p className="mt-1 text-sm text-premium-ink/50">{mod.description}</p>
                <ul
                  className={`mt-4 space-y-2 ${
                    i === 0 ? "sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0" : ""
                  }`}
                >
                  {mod.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-premium-ink/70"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-premium-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
