import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeCta({ dashboardHref }: { dashboardHref: string }) {
  return (
    <section className="relative mt-16 overflow-hidden rounded-3xl sm:mt-20">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIuMDgiLz48L2c+PC9zdmc+')] opacity-60" />
      <div className="relative flex flex-col gap-6 p-8 text-white sm:p-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Start in minutes</h2>
          <p className="mt-3 text-indigo-100 leading-relaxed">
            Try every portal with demo accounts — one password, every role.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/login">
            <Button
              size="lg"
              className="rounded-xl bg-white font-semibold text-indigo-700 shadow-xl hover:bg-indigo-50"
            >
              Sign in now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={dashboardHref}>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl border-white/50 bg-white/10 text-white hover:bg-white/20"
            >
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeFooter() {
  return (
    <footer className="mt-14 border-t border-indigo-100/80 pt-10 pb-10">
      <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900">EduSync SMS</p>
            <p className="text-xs text-slate-500">KG–12 · Multi-branch Ethiopia</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Register
          </Link>
          <a href="#portals" className="text-slate-600 hover:text-indigo-600">
            Portals
          </a>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} EduSync SMS
      </p>
    </footer>
  );
}
