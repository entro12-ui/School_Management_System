"use client";

import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

const CONTACT_VALUES = [
  {
    key: "website" as const,
    value: "www.entroethiopia.com",
    href: "https://www.entroethiopia.com/",
    icon: ExternalLink,
  },
  {
    key: "phone" as const,
    value: "+251 976 113 638",
    href: "tel:+251976113638",
    icon: Phone,
  },
  {
    key: "email" as const,
    value: "entro12@entroethiopia.com",
    href: "mailto:entro12@entroethiopia.com",
    icon: Mail,
  },
] as const;

export function HomeCta({ dashboardHref }: { dashboardHref: string }) {
  const { content } = useLandingLanguage();
  const { cta } = content;

  return (
    <section className="mt-24 overflow-hidden rounded-2xl border border-premium-accent/20 bg-premium-accent sm:mt-28">
      <div className="relative flex flex-col gap-8 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
        <div
          className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-premium-accent/15 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
            {cta.eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{cta.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">{cta.lead}</p>
        </div>
        <div className="relative flex flex-wrap gap-3">
          <Link
            href={dashboardHref}
            className="marketing-btn-ghost !border-white/30 !bg-white !text-premium-accent hover:!bg-premium-canvas"
          >
            {cta.signIn}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#contact"
            className="marketing-btn-ghost !border-white/20 !bg-transparent !text-white hover:!border-white/40 hover:!bg-white/10"
          >
            {cta.contactUs}
          </a>
        </div>
      </div>
    </section>
  );
}

export function HomeFooter() {
  const { content } = useLandingLanguage();
  const { footer } = content;

  return (
    <footer id="contact" className="mt-20 border-t border-premium-ink/10 pt-14 pb-10">
      <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-accent text-white">
              <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-semibold text-premium-ink">EduSync SMS</p>
              <p className="text-xs text-premium-ink/45">{footer.tagline}</p>
            </div>
          </div>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-premium-ink/60">
            {footer.description}
          </p>

          <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-premium-ink/45">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            {footer.location}
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-premium-ink/45">
              {footer.linksHeading}
            </h3>
            <div className="mt-4 flex flex-col gap-2.5 text-sm">
              <Link href="/login" className="text-premium-ink/65 transition hover:text-premium-accent">
                {footer.signIn}
              </Link>
              <Link href="/register" className="text-premium-ink/65 transition hover:text-premium-accent">
                {footer.staffRegistration}
              </Link>
              <a href="#pricing" className="text-premium-ink/65 transition hover:text-premium-accent">
                {footer.pricing}
              </a>
              <a href="#features" className="text-premium-ink/65 transition hover:text-premium-accent">
                {footer.modules}
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-premium-ink/45">
              {footer.contactHeading}
            </h3>
            <ul className="mt-4 space-y-4">
              {CONTACT_VALUES.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      className="group flex items-center gap-3 text-sm"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-premium-ink/8 bg-white text-premium-ink/40 transition group-hover:border-premium-accent/30 group-hover:text-premium-accent">
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <span>
                        <span className="block text-[10px] uppercase tracking-wider text-premium-ink/40">
                          {footer.contactLabels[item.key]}
                        </span>
                        <span className="font-medium text-premium-ink/75 group-hover:text-premium-accent">
                          {item.value}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-14 flex flex-col gap-4 border-t border-premium-ink/8 pt-8 text-xs text-premium-ink/40 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {footer.copyright}</p>
        <div className="flex items-center gap-5">
          <Link href="/terms" className="transition hover:text-premium-accent">
            {footer.terms}
          </Link>
          <Link href="/privacy" className="transition hover:text-premium-accent">
            {footer.privacy}
          </Link>
          <a
            href="https://www.entroethiopia.com/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-premium-accent hover:underline"
          >
            entroethiopia.com
          </a>
        </div>
      </div>
    </footer>
  );
}
