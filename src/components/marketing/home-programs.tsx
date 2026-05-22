import { BarChart3, BookOpen, GraduationCap, Users } from "lucide-react";

const PROGRAMS = [
  {
    title: "Kindergarten",
    grades: "KG",
    desc: "Play-based learning, picture books, teacher-assisted library, daily reports",
    icon: Users,
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-50 border-amber-100",
  },
  {
    title: "Primary",
    grades: "Grades 1–5",
    desc: "Subject grading, story tracking, reading rewards, parent communication",
    icon: BookOpen,
    gradient: "from-sky-400 to-blue-600",
    bg: "bg-sky-50 border-sky-100",
  },
  {
    title: "Junior High",
    grades: "Grades 6–8",
    desc: "Mid & final exams, GPA tracking, project materials, group reading",
    icon: BarChart3,
    gradient: "from-violet-400 to-purple-600",
    bg: "bg-violet-50 border-violet-100",
  },
  {
    title: "Senior High",
    grades: "Grades 9–12",
    desc: "Streams, national exam prep, transcripts, research & college resources",
    icon: GraduationCap,
    gradient: "from-emerald-400 to-teal-600",
    bg: "bg-emerald-50 border-emerald-100",
  },
];

export function HomePrograms() {
  return (
    <section id="programs" className="scroll-mt-28 mt-16 sm:mt-20">
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">
          Academic programs
        </span>
        <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          KG through{" "}
          <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">
            Grade 12
          </span>
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-slate-600">
          Tools scale from KG picture books to Grade 12 transcripts — same platform,
          age-appropriate workflows.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {PROGRAMS.map((p) => (
          <article
            key={p.title}
            className={`rounded-2xl border p-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${p.bg}`}
          >
            <div
              className={`inline-flex rounded-xl bg-gradient-to-br p-2.5 text-white shadow ${p.gradient}`}
            >
              <p.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {p.grades}
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
