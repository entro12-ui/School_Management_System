import Link from "next/link";
import { GraduationCap } from "lucide-react";

const NAV = [
  { href: "#overview", label: "Platform" },
  { href: "#experience", label: "Experience" },
  { href: "#ai", label: "AI" },
  { href: "#portals", label: "Portals" },
  { href: "#features", label: "Modules" },
  { href: "#programs", label: "KG-12" },
  { href: "#contact", label: "Contact" },
] as const;

export function HomeHeader({
  dashboardHref,
  signedIn,
}: {
  dashboardHref: string;
  signedIn: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-indigo-100/70 bg-white/90 shadow-sm shadow-indigo-100/50 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-400/40 transition group-hover:scale-105">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <p className="bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-base font-extrabold leading-tight text-transparent">
              EduSync SMS
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              SchoolHub by Entro Ethiopia
            </p>
          </div>
        </Link>

        <nav
          className="hidden items-center rounded-full border border-slate-200/80 bg-white/80 p-1 shadow-sm lg:flex"
          aria-label="Sections"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={signedIn ? dashboardHref : "/login"}
            className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </div>

      <nav
        className="flex gap-1.5 overflow-x-auto border-t border-indigo-100/80 px-4 py-2 lg:hidden"
        aria-label="Sections mobile"
      >
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
