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
import { landingPageWrapClass } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";
import { cn } from "@/lib/utils";

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
    <section className="relative mt-24 overflow-hidden rounded-2xl border border-premium-accent/25 bg-gradient-to-br from-premium-accent via-[#0a5c54] to-[#084840] sm:mt-28">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(255_255_255/0.12),transparent_50%)]"
        aria-hidden
      />
      <div className="relative flex flex-col gap-8 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
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
    <footer id="contact" className="landing-footer mt-0">
      <div className={cn("landing-footer-inner py-8 sm:py-10", landingPageWrapClass)}>
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:gap-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white ring-1 ring-white/40">
                <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="landing-footer-brand text-lg">EduSync SMS</p>
                <p className="landing-footer-meta text-xs">{footer.tagline}</p>
              </div>
            </div>

            <p className="landing-footer-body mt-3 max-w-md">{footer.description}</p>

            <p className="landing-footer-meta mt-3 inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-[#a8d4cc]" strokeWidth={2.5} />
              {footer.location}
            </p>
          </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <h3 className="landing-footer-heading">{footer.linksHeading}</h3>
                <div className="mt-2.5 flex flex-col gap-2">
                  <Link href="/login" className="landing-footer-link">
                    {footer.signIn}
                  </Link>
                  <Link href="/register" className="landing-footer-link">
                    {footer.staffRegistration}
                  </Link>
                  <a href="#pricing" className="landing-footer-link">
                    {footer.pricing}
                  </a>
                  <a href="#features" className="landing-footer-link">
                    {footer.modules}
                  </a>
                </div>
              </div>

              <div>
                <h3 className="landing-footer-heading">{footer.contactHeading}</h3>
                <ul className="mt-2.5 space-y-2.5">
                  {CONTACT_VALUES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.key}>
                        <a
                          href={item.href}
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                          className="group flex items-center gap-3"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/40 bg-white/15 text-white transition group-hover:border-white/55 group-hover:bg-white/22">
                            <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                          </span>
                          <span>
                            <span className="landing-footer-label block">
                              {footer.contactLabels[item.key]}
                            </span>
                            <span className="landing-footer-value group-hover:text-white">
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

        <div className="landing-footer-meta mt-8 flex flex-col gap-3 border-t border-white/30 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {footer.copyright}</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/terms" className="landing-footer-link text-sm">
              {footer.terms}
            </Link>
            <Link href="/privacy" className="landing-footer-link text-sm">
              {footer.privacy}
            </Link>
            <a
              href="https://www.entroethiopia.com/"
              target="_blank"
              rel="noreferrer"
              className="landing-footer-link text-sm !text-[#c8e4de] hover:!text-white"
            >
              entroethiopia.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
