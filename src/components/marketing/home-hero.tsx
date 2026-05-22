import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const HIGHLIGHTS = [
  {
    title: "Academics",
    desc: "KG–12 grading, exams, transcripts",
    icon: GraduationCap,
    color: "from-indigo-500 to-violet-600",
  },
  {
    title: "Finance",
    desc: "Semester fees & payment tracking",
    icon: Wallet,
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Library",
    desc: "Catalog, loans, digital resources",
    icon: BookOpen,
    color: "from-rose-500 to-pink-600",
  },
  {
    title: "Reports",
    desc: "Dashboards & MoE-ready exports",
    icon: BarChart3,
    color: "from-emerald-500 to-teal-600",
  },
];

export function HomeHero({
  dashboardHref,
  signedIn,
}: {
  dashboardHref: string;
  signedIn: boolean;
}) {
  return (
    <section
      id="overview"
      className="scroll-mt-28 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14"
    >
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 sm:text-sm">
          <Sparkles className="h-3.5 w-3.5" />
          KG–12 · Multi-branch school management
        </div>

        <h1 className="mt-5 text-3xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          One school system for{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
            every role
          </span>
        </h1>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
          EduSync connects central office, branch staff, teachers, finance, library, HR, and
          family portals — organized by role, not by campus names on the home page.
        </p>

        <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
          {[
            "Role-based sign-in for each portal",
            "Registrar enrollment with OTP onboarding",
            "Integrated fees, grading, library & HR",
          ].map((text) => (
            <li key={text} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              {text}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={signedIn ? dashboardHref : "/login"}>
            <Button size="lg" className="shadow-lg shadow-indigo-200/80">
              {signedIn ? "Open my portal" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              Apply to join staff
            </Button>
          </Link>
          <a href="#organization">
            <Button size="lg" variant="ghost">
              How it works
            </Button>
          </a>
        </div>
      </div>

      <div className="relative">
        <div
          className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-100/80 to-violet-100/50 blur-2xl"
          aria-hidden
        />
        <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-md shadow-slate-200/50 sm:p-5"
            >
              <div
                className={`inline-flex rounded-xl bg-gradient-to-br p-2 text-white shadow-sm ${item.color}`}
              >
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900 sm:text-base">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
