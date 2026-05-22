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
    desc: "Grades & transcripts",
    icon: GraduationCap,
    ring: "ring-violet-200",
    iconBg: "from-violet-500 to-purple-600",
    card: "from-violet-50 to-white",
  },
  {
    title: "Finance",
    desc: "Fees & payments",
    icon: Wallet,
    ring: "ring-amber-200",
    iconBg: "from-amber-500 to-orange-500",
    card: "from-amber-50 to-white",
  },
  {
    title: "Library",
    desc: "Books & digital",
    icon: BookOpen,
    ring: "ring-rose-200",
    iconBg: "from-rose-500 to-pink-600",
    card: "from-rose-50 to-white",
  },
  {
    title: "Reports",
    desc: "KPIs & exports",
    icon: BarChart3,
    ring: "ring-cyan-200",
    iconBg: "from-cyan-500 to-teal-500",
    card: "from-cyan-50 to-white",
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
      className="scroll-mt-28 relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-white via-indigo-50/30 to-violet-50/50 p-8 shadow-xl shadow-indigo-200/30 sm:p-10 lg:p-12"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-violet-400/30 to-cyan-400/20 blur-2xl"
        aria-hidden
      />

      <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-gradient-to-r from-violet-100 to-indigo-100 px-4 py-1.5 text-xs font-bold text-violet-800">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            Premium KG–12 platform · Ethiopia
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Run your whole school on{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              one beautiful system
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Academics, finance, library, HR, and family portals — built for every role from
            kindergarten through Grade 12.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-700">
            {[
              "Role-based portals",
              "Real-time sync",
              "MoE-ready reports",
            ].map((text) => (
              <li key={text} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={signedIn ? dashboardHref : "/login"}>
              <Button
                size="lg"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 shadow-lg shadow-indigo-400/40 hover:from-violet-700 hover:to-indigo-700"
              >
                {signedIn ? "Open portal" : "Sign in free"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="rounded-xl border-violet-200">
                Join as staff
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className={`rounded-2xl border border-white bg-gradient-to-br p-4 shadow-md ring-1 ${item.ring} ${item.card}`}
            >
              <div
                className={`inline-flex rounded-xl bg-gradient-to-br p-2.5 text-white shadow ${item.iconBg}`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 font-bold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
