"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BellRing,
  Brain,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EXPERIENCES = [
  {
    id: "leadership",
    label: "Leadership",
    title: "A live command center for every campus",
    description:
      "Central office can compare branches, monitor enrollment, spot performance risks, and review audit activity without waiting for manual reports.",
    icon: ShieldCheck,
    accent: "from-violet-600 to-indigo-600",
    metrics: [
      { label: "Branch visibility", value: "All campuses" },
      { label: "Risk review", value: "Daily" },
      { label: "Export-ready", value: "PDF / Excel / CSV" },
    ],
    actions: [
      "Track enrollment, attendance, revenue, and outstanding fees together.",
      "Flag students who need urgent academic or attendance intervention.",
      "Keep leadership decisions grounded in one trusted system record.",
    ],
  },
  {
    id: "teachers",
    label: "Teachers",
    title: "Less paperwork, more teaching time",
    description:
      "Teachers manage class rosters, daily attendance, single-assessment grading, and weekly reports from one focused workspace.",
    icon: GraduationCap,
    accent: "from-emerald-500 to-teal-600",
    metrics: [
      { label: "Class work", value: "Roster + grades" },
      { label: "Attendance", value: "Daily / weekly" },
      { label: "Insights", value: "Trend-aware" },
    ],
    actions: [
      "Enter marks once and reuse them for reports, portals, and analytics.",
      "See which students are slipping before exam season arrives.",
      "Coordinate with parents through clear, ready-to-use updates.",
    ],
  },
  {
    id: "families",
    label: "Families",
    title: "Parents and students stay connected",
    description:
      "Families can follow attendance, results, fees, library activity, transcripts, and AI-supported learning from secure role-based portals.",
    icon: Users,
    accent: "from-cyan-500 to-blue-600",
    metrics: [
      { label: "Parent portal", value: "Linked children" },
      { label: "Student portal", value: "Self-service" },
      { label: "Messages", value: "Multilingual" },
    ],
    actions: [
      "Give parents timely visibility into performance, attendance, and fees.",
      "Help students access schedules, assignments, GPA, and transcripts.",
      "Create professional WhatsApp or Telegram-ready parent messages.",
    ],
  },
] as const;

const OUTCOMES = [
  {
    title: "Early warning analytics",
    description: "Combines grade trends and attendance records to flag at-risk students.",
    icon: Brain,
  },
  {
    title: "Attendance-to-action flow",
    description: "Absence patterns become visible to staff and families before they grow.",
    icon: BellRing,
  },
  {
    title: "Academic continuity",
    description: "Grades, GPA, transcripts, and reports share the same student record.",
    icon: LineChart,
  },
  {
    title: "Family communication",
    description: "Parent message drafts support English, Amharic, and Afaan Oromo.",
    icon: MessageSquare,
  },
] as const;

export function HomePlatformShowcase() {
  const [activeId, setActiveId] = useState<(typeof EXPERIENCES)[number]["id"]>(
    EXPERIENCES[0].id
  );
  const active = useMemo(
    () => EXPERIENCES.find((item) => item.id === activeId) ?? EXPERIENCES[0],
    [activeId]
  );
  const ActiveIcon = active.icon;

  return (
    <section id="experience" className="scroll-mt-28 mt-16 sm:mt-20">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 shadow-sm ring-1 ring-indigo-100">
            <Activity className="h-3.5 w-3.5" />
            Interactive experience
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            A school system that feels{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              alive and accountable
            </span>
          </h2>
          <p className="mt-3 text-slate-600">
            EduSync connects the daily work of administrators, teachers, families,
            finance, HR, and library teams so every decision is backed by the latest
            student record.
          </p>

          <div className="mt-6 grid gap-3">
            {EXPERIENCES.map((item) => {
              const Icon = item.icon;
              const activeTab = item.id === active.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl border p-4 text-left transition",
                    activeTab
                      ? "border-indigo-200 bg-white shadow-lg shadow-indigo-100"
                      : "border-white bg-white/70 hover:border-indigo-100 hover:bg-white"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                      item.accent
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">{item.label}</span>
                    <span className="mt-0.5 block text-sm text-slate-500">{item.title}</span>
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-slate-300 transition group-hover:text-indigo-500",
                      activeTab && "translate-x-0.5 text-indigo-500"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white bg-white/90 shadow-2xl shadow-indigo-200/40 ring-1 ring-indigo-100/80">
          <div className={cn("bg-gradient-to-br p-6 text-white sm:p-8", active.accent)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white/80">{active.label} workspace</p>
                <h3 className="mt-2 text-2xl font-bold">{active.title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                  {active.description}
                </p>
              </div>
              <div className="hidden rounded-2xl bg-white/15 p-3 backdrop-blur sm:block">
                <ActiveIcon className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {active.metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                  <p className="text-xs text-white/70">{metric.label}</p>
                  <p className="mt-1 font-bold">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:p-8">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-semibold text-slate-900">What changes day to day</p>
              </div>
              <ul className="space-y-2">
                {active.actions.map((action) => (
                  <li key={action} className="flex gap-2 text-sm leading-6 text-slate-600">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {OUTCOMES.map((outcome) => {
                const Icon = outcome.icon;
                return (
                  <article
                    key={outcome.title}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Icon className="h-5 w-5 text-indigo-600" />
                    <h4 className="mt-3 font-semibold text-slate-900">{outcome.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {outcome.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
