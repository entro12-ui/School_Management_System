import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeCta({ dashboardHref }: { dashboardHref: string }) {
  return (
    <section className="mt-20 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white shadow-xl shadow-indigo-300/25 sm:p-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready for your branch?</h2>
          <p className="mt-3 leading-relaxed text-indigo-100">
            Leadership dashboards, MoE-ready exports, and real-time KPIs — start from
            central office or sign in to your role portal.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={dashboardHref}>
            <Button
              size="lg"
              className="bg-white text-indigo-700 hover:bg-indigo-50"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 pt-10 pb-12">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">EduSync SMS</p>
            <p className="text-xs text-slate-500">School Management · Ethiopia</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-900">Product</p>
            <ul className="mt-3 space-y-2 text-slate-600">
              <li>
                <a href="#organization" className="hover:text-indigo-600">
                  How it works
                </a>
              </li>
              <li>
                <a href="#portals" className="hover:text-indigo-600">
                  Portals
                </a>
              </li>
              <li>
                <a href="#programs" className="hover:text-indigo-600">
                  Programs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Access</p>
            <ul className="mt-3 space-y-2 text-slate-600">
              <li>
                <Link href="/login" className="hover:text-indigo-600">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-indigo-600">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/admin/organization" className="hover:text-indigo-600">
                  Hierarchy (admin)
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="font-semibold text-slate-900">Demo</p>
            <p className="mt-3 text-slate-600">
              Use <span className="font-mono text-slate-800">demo1234</span> on the login
              page for all demo accounts.
            </p>
          </div>
        </div>
      </div>
      <p className="mt-10 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} EduSync SMS · Multi-branch KG–12
      </p>
    </footer>
  );
}
