"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import { LandingContentLanguageSelect } from "@/components/marketing/landing-content-language-select";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";
import { cn } from "@/lib/utils";

export function HomeHeader({
  dashboardHref,
  signedIn,
}: {
  dashboardHref: string;
  signedIn: boolean;
}) {
  const { content } = useLandingLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-premium-ink/8 bg-premium-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:gap-4 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-3" onClick={closeMenu}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-accent text-white shadow-[var(--shadow-premium-sm)] transition group-hover:bg-[#0a524b]">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[15px] font-semibold leading-none text-premium-ink">
              EduSync SMS
            </p>
            <p className="mt-1 text-[11px] tracking-wide text-premium-ink/50">
              {content.header.tagline}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Sections">
          {content.header.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-premium-ink/70 transition hover:bg-premium-ink/5 hover:text-premium-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LandingContentLanguageSelect />

          <div className="hidden items-center gap-2 lg:flex">
            {signedIn ? (
              <Link href={dashboardHref} className="marketing-btn-primary text-sm">
                {content.header.dashboard}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-premium-ink/80 transition hover:bg-premium-ink/5"
                >
                  {content.header.signIn}
                </Link>
                <a href="#contact" className="marketing-btn-primary text-sm">
                  {content.header.bookWalkthrough}
                </a>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-premium-ink/10 bg-white text-premium-ink transition hover:bg-premium-accent/5 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-marketing-nav"
            aria-label={open ? content.header.mobileMenuClose : content.header.mobileMenuOpen}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-premium-ink/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
        onClick={closeMenu}
      />

      <nav
        id="mobile-marketing-nav"
        className={cn(
          "fixed left-0 right-0 top-[65px] z-50 max-h-[calc(100vh-65px)] overflow-y-auto border-b border-premium-ink/8 bg-premium-canvas shadow-[var(--shadow-premium-md)] transition-all duration-200 lg:hidden",
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        )}
        aria-label="Mobile navigation"
        aria-hidden={!open}
      >
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="mb-4">
            <LandingContentLanguageSelect compact />
          </div>

          <ul className="space-y-1">
            {content.header.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={closeMenu}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-premium-ink/80 transition hover:bg-premium-accent/10 hover:text-premium-accent"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="mb-4 mt-4 text-sm text-premium-ink/65">{content.header.parentDraftsNote}</p>

          <div className="mt-4 space-y-2 border-t border-premium-ink/8 pt-4">
            {signedIn ? (
              <Link
                href={dashboardHref}
                onClick={closeMenu}
                className="marketing-btn-primary w-full text-sm"
              >
                {content.header.openDashboard}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="marketing-btn-ghost w-full text-sm"
                >
                  {content.header.signIn}
                </Link>
                <a
                  href="#contact"
                  onClick={closeMenu}
                  className="marketing-btn-primary w-full text-sm"
                >
                  {content.header.bookWalkthrough}
                </a>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
