"use client";

import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

export function HomeWorkflowSteps() {
  const { content } = useLandingLanguage();
  const { workflow } = content;

  return (
    <section id="workflow" className="scroll-mt-28 mt-24 sm:mt-28">
      <MarketingSectionHeader
        eyebrow={workflow.eyebrow}
        title={workflow.title}
        lead={workflow.lead}
        centered
      />

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {workflow.steps.map((step, index) => (
          <article key={step.step} className="landing-step-card relative">
            {index < workflow.steps.length - 1 ? (
              <span
                className="pointer-events-none absolute -right-3 top-10 hidden h-px w-6 bg-premium-ink/10 md:block"
                aria-hidden
              />
            ) : null}
            <span className="landing-step-number">{step.step}</span>
            <h3 className="mt-5 text-lg font-semibold text-premium-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-premium-ink/60">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
