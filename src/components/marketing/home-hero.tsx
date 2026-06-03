import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  MessageSquare,
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
    title: "Analytics",
    desc: "Risk & trends",
    icon: BarChart3,
    ring: "ring-cyan-200",
    iconBg: "from-cyan-500 to-teal-500",
    card: "from-cyan-50 to-white",
  },
];

const HERO_STATS = [
  { label: "Role portals", value: "9+" },
  { label: "Grade coverage", value: "KG-12" },
  { label: "Languages", value: "3" },
] as const;

const OPERATING_SIGNALS = [
  {
    title: "At-risk student flagged",
    desc: "Grade trend and attendance need follow-up",
    icon: Brain,
    color: "text-rose-600 bg-rose-50",
  },
  {
    title: "Parent message prepared",
    desc: "WhatsApp and Telegram-ready draft",
    icon: MessageSquare,
    color: "text-cyan-600 bg-cyan-50",
  },
  {
    title: "Attendance sync complete",
    desc: "Daily class records are visible to staff",
    icon: BellRing,
    color: "text-emerald-600 bg-emerald-50",
  },
] as const;

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
      <div
        className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,0.95fr)] lg:items-center xl:gap-14">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-gradient-to-r from-violet-100 to-indigo-100 px-4 py-1.5 text-xs font-bold text-violet-800">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            Premium KG-12 school operating system
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Turn every school day into{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              clear action
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            EduSync SMS brings academics, attendance, finance, library, HR, parent
            communication, AI-supported learning, student analytics, and monthly executive
            reporting into one calm workspace, helping schools notice risks early,
            personalize support, and guide every learner with confidence.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-700">
            {[
              "Role-based portals",
              "Early warning insights",
              "AI monthly reports",
              "Family-ready communication",
              "Leadership dashboards",
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
                {signedIn ? "Open your portal" : "Explore the platform"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="rounded-xl border-violet-200">
                Join as staff
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white bg-white/80 p-3 text-center shadow-sm ring-1 ring-indigo-100/80"
              >
                <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo-200/40 to-cyan-200/30 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-white bg-white/90 shadow-2xl shadow-indigo-200/50 ring-1 ring-indigo-100">
            <div className="border-b border-slate-100 bg-slate-950 px-5 py-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                    Live school pulse
                  </p>
                  <p className="mt-1 font-bold">Today&apos;s operating board</p>
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                {HIGHLIGHTS.map((item) => (
                  <div
                    key={item.title}
                    className={`rounded-2xl border border-white bg-gradient-to-br p-4 shadow-sm ring-1 ${item.ring} ${item.card}`}
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

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-indigo-600" />
                  <p className="text-sm font-semibold text-slate-900">What needs attention</p>
                </div>
                <div className="space-y-2">
                  {OPERATING_SIGNALS.map((signal) => {
                    const Icon = signal.icon;
                    return (
                      <div
                        key={signal.title}
                        className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm"
                      >
                        <div className={`rounded-lg p-2 ${signal.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{signal.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{signal.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
