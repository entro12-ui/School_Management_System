import Link from "next/link";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { OrganizationHierarchySection } from "@/components/organization/organization-hierarchy-section";

export const dynamic = "force-dynamic";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  GraduationCap,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

const modules = [
  {
    title: "KG Section",
    desc: "Play-based assessment, daily reports, parent communication",
    icon: Users,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    title: "Primary (1–5)",
    desc: "Subject grading, exams, quizzes, report cards",
    icon: BookOpen,
    gradient: "from-sky-500 to-blue-600",
  },
  {
    title: "Junior High (6–8)",
    desc: "Mid/final exams, GPA tracking",
    icon: BarChart3,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    title: "Senior High (9–12)",
    desc: "Streams, national exam prep, transcripts",
    icon: GraduationCap,
    gradient: "from-emerald-500 to-teal-600",
  },
];

const features = [
  { title: "Academic", items: ["Continuous assessment", "Term exams", "GPA (9–12)", "Transcripts"] },
  { title: "Attendance", items: ["Biometric/RFID ready", "Late alerts", "Parent SMS", "Staff attendance"] },
  { title: "Financial", items: ["Tuition by grade/stream", "Scholarships", "Payment plans", "Reminders"] },
  { title: "Library", items: ["Issue/return", "Digital catalog", "E-resources", "Fine management"] },
];

export default async function HomePage() {
  const session = await auth();
  const dashboardHref = session?.user
    ? ROLE_HOME[session.user.role]
    : "/login";

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -right-32 top-48 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl"
          aria-hidden
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold tracking-tight text-slate-900">EduSync SMS</p>
              <p className="text-xs text-slate-500">KG–12 · Multi-Branch Ethiopia</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/organization"
              className="hidden text-sm font-medium text-slate-600 hover:text-indigo-600 sm:inline"
            >
              Organization
            </Link>
            <Link href={dashboardHref}>
              <Button>
                {session ? "Go to dashboard" : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <Sparkles className="h-4 w-4" />
            Central Office · Real-time sync across branches
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            School Management
            <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              built for every role
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Super Admin oversight, branch operations, teacher grading, finance, library,
            and family portals — one hierarchy, one system, KG through Grade 12.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="shadow-lg shadow-indigo-200">
                Register online
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline">
                Super Admin
              </Button>
            </Link>
          </div>
        </section>

        <section
          id="organization"
          className="mt-20 scroll-mt-24 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10"
        >
          <OrganizationHierarchySection variant="marketing" />
        </section>

        <section className="mt-16">
          <h2 className="text-center text-xl font-semibold text-slate-900">
            Grade bands & programs
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500">
            Every branch runs the full KG–12 stack with role-appropriate tools.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((m) => (
              <div
                key={m.title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`inline-flex rounded-xl bg-gradient-to-br p-2.5 text-white shadow ${m.gradient}`}
                >
                  <m.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{m.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-xl font-semibold text-slate-900">Advanced features</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-100"
              >
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-indigo-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white shadow-xl shadow-indigo-300/30 sm:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Leadership dashboards</h2>
              <p className="mt-3 max-w-xl text-indigo-100 leading-relaxed">
                Branch KPIs and consolidated views — enrollment, attendance, fee collection,
                and exam readiness. Export for MoE audit (PDF, Excel, CSV).
              </p>
              <Link
                href="/admin"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                Open central dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex gap-6 opacity-90">
              <Building2 className="h-14 w-14" />
              <Wallet className="h-14 w-14" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
