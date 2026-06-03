import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#overview", label: "Overview" },
  { href: "#experience", label: "Experience" },
  { href: "#organization", label: "How it works" },
  { href: "#portals", label: "Portals" },
  { href: "#programs", label: "Programs" },
  { href: "#features", label: "Features" },
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
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/80 shadow-sm shadow-indigo-100/50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-400/40">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <p className="bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-sm font-bold text-transparent">
              EduSync SMS
            </p>
            <p className="text-[11px] font-medium text-slate-500">KG–12 · Ethiopia</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Sections">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-1.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 sm:inline"
          >
            Sign in
          </Link>
          <Link href={dashboardHref}>
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-indigo-300/40 hover:from-violet-700 hover:to-indigo-700"
            >
              {signedIn ? "Dashboard" : "Get started"}
            </Button>
          </Link>
        </div>
      </div>

      <nav
        className="flex gap-1.5 overflow-x-auto border-t border-indigo-100/80 px-4 py-2 md:hidden"
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
