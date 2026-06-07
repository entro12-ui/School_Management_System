import Link from "next/link";
import { GraduationCap } from "lucide-react";

export type LegalSection = {
  heading: string;
  body: string[];
};

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-premium-canvas">
      <header className="border-b border-premium-ink/8 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-premium-accent text-white">
              <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <span className="text-sm font-semibold text-premium-ink">EduSync SMS</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-premium-accent hover:underline">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-accent">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-premium-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-premium-ink/45">Last updated: {updated}</p>
        <p className="mt-6 text-base leading-relaxed text-premium-ink/65">{intro}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-premium-ink">
                {i + 1}. {section.heading}
              </h2>
              {section.body.map((paragraph, j) => (
                <p key={j} className="mt-2 text-sm leading-relaxed text-premium-ink/65">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-premium-ink/8 pt-6 text-xs text-premium-ink/40">
          © {new Date().getFullYear()} EduSync SMS · Entro Ethiopia Software Development PLC.
          All rights reserved.
        </div>
      </main>
    </div>
  );
}
