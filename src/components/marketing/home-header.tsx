import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#overview", label: "Overview" },
  { href: "#organization", label: "How it works" },
  { href: "#portals", label: "Portals" },
  { href: "#programs", label: "Programs" },
  { href: "#features", label: "Features" },
] as const;

export function HomeHeader({
  dashboardHref,
  signedIn,
}: {
  dashboardHref: string;
  signedIn: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200/60">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold tracking-tight text-slate-900">EduSync SMS</p>
            <p className="text-[11px] text-slate-500">KG–12 · Multi-Branch</p>
          </div>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Page sections"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-indigo-700"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-slate-600 hover:text-indigo-600 sm:inline"
          >
            Sign in
          </Link>
          <Link href={dashboardHref}>
            <Button size="sm">{signedIn ? "Dashboard" : "Get started"}</Button>
          </Link>
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden"
        aria-label="Page sections mobile"
      >
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
