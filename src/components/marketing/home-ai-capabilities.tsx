import {
  Bot,
  BrainCircuit,
  ClipboardCheck,
  CreditCard,
  FileText,
  IdCard,
  Library,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
} from "lucide-react";

const AI_CAPABILITIES = [
  {
    title: "AI Study Tutor",
    description:
      "Student-facing tutor support for guided explanations, learning help, and context-aware study conversations.",
    icon: Bot,
    accent: "from-cyan-500 to-blue-600",
  },
  {
    title: "AI Lesson Planner",
    description:
      "Teacher planning assistant that generates objectives, activities, assessments, and differentiated support by grade and subject.",
    icon: BrainCircuit,
    accent: "from-violet-500 to-indigo-600",
  },
  {
    title: "Student Performance Analytics",
    description:
      "Early warning insights that combine grade trends and attendance patterns to flag at-risk students.",
    icon: ClipboardCheck,
    accent: "from-rose-500 to-pink-600",
  },
  {
    title: "AI Monthly Report Generator",
    description:
      "Owner-ready executive summaries that combine enrollment, academics, attendance, finance, and branch performance into one professional monthly report.",
    icon: FileText,
    accent: "from-amber-500 to-orange-600",
  },
  {
    title: "Smart Parent Communication",
    description:
      "Multilingual, tone-aware draft messages for progress updates, attendance alerts, fee reminders, and meeting requests.",
    icon: MessageSquareText,
    accent: "from-emerald-500 to-teal-600",
  },
] as const;

const PLATFORM_COVERAGE = [
  "Multi-branch leadership dashboards, branch comparison, and AI monthly reports",
  "Student enrollment, records, ID cards, transcripts, and registration flows",
  "Teacher class rosters, grading, assignments, exams, and attendance",
  "Finance fee structures, payment tracking, proof review, receipts, and reports",
  "Library catalog, digital resources, issue/return, reservations, fines, and reading logs",
  "HR departments, employees, payroll, leave, recruitment, training, assets, and ID cards",
  "Parent and student portals for attendance, results, fees, library, GPA, and schedules",
  "Role-based access control, audit logs, secure authentication, and mandatory password change",
] as const;

const COVERAGE_ICONS = [
  UsersRound,
  IdCard,
  ClipboardCheck,
  CreditCard,
  Library,
  UserCheck,
  FileText,
  ShieldCheck,
] as const;

export function HomeAiCapabilities() {
  return (
    <section id="ai" className="scroll-mt-28 mt-16 sm:mt-20">
      <div className="rounded-3xl border border-indigo-100 bg-white/90 p-6 shadow-xl shadow-indigo-100/40 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered school support
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Practical AI where it helps{" "}
              <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
                teachers, students, and leaders
              </span>
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              AI in EduSync SMS is designed as a support layer, not a replacement for
              educators. It helps teachers prepare lessons faster, helps students study,
              helps leaders generate monthly executive reports, and helps staff
              communicate clearly with families.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {AI_CAPABILITIES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                >
                  <div
                    className={`inline-flex rounded-xl bg-gradient-to-br p-2.5 text-white shadow ${feature.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Complete platform coverage</h3>
              <p className="mt-1 text-sm text-slate-500">
                Beyond AI, the system covers daily operations across every major school
                department.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORM_COVERAGE.map((item, index) => {
              const Icon = COVERAGE_ICONS[index] ?? ShieldCheck;
              return (
                <div key={item} className="rounded-xl bg-white p-3 shadow-sm">
                  <Icon className="h-4 w-4 text-indigo-600" />
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
