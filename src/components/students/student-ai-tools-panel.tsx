import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarRange,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { UserRole } from "@prisma/client";

type AiTool = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  badge?: string;
  note?: string;
};

export function StudentAiToolsPanel({
  studentName,
  userRole,
}: {
  studentName: string;
  userRole: UserRole;
}) {
  const tools: AiTool[] = [
    {
      id: "study-tutor",
      title: "AI Study Tutor",
      description:
        "Personalized practice and explanations tied to the student's grade level and recent assessments.",
      icon: <GraduationCap className="h-5 w-5 text-indigo-600" />,
      href: userRole === UserRole.STUDENT ? "/student/ai-tutor" : undefined,
      note:
        userRole === UserRole.STUDENT
          ? undefined
          : `Available in the student portal for ${studentName}.`,
    },
    {
      id: "lesson-planner",
      title: "AI Lesson Planner",
      description:
        "Generate lesson outlines, activities, and differentiation ideas for this student's class.",
      icon: <BookOpen className="h-5 w-5 text-indigo-600" />,
      href:
        userRole === UserRole.TEACHER || userRole === UserRole.SUPER_ADMIN
          ? "/teacher"
          : undefined,
      note:
        userRole === UserRole.TEACHER || userRole === UserRole.SUPER_ADMIN
          ? "Open the teacher dashboard to plan lessons for this class."
          : "Teachers can access this from their dashboard.",
    },
    {
      id: "monthly-report",
      title: "AI Monthly Report Generator",
      description:
        "Branch-wide monthly summaries with attendance, finance, and academic highlights.",
      icon: <CalendarRange className="h-5 w-5 text-indigo-600" />,
      href:
        userRole === UserRole.SUPER_ADMIN || userRole === UserRole.BRANCH_ADMIN
          ? "/admin/reports"
          : undefined,
      note:
        userRole === UserRole.SUPER_ADMIN || userRole === UserRole.BRANCH_ADMIN
          ? undefined
          : "Branch and system admins can generate monthly leadership reports.",
    },
    {
      id: "comm-bot",
      title: "Parent Communication AI Bot",
      description:
        "Draft family-ready updates in English or Amharic with WhatsApp and Telegram sharing.",
      icon: <Bot className="h-5 w-5 text-indigo-600" />,
      badge: "Communication tab",
      note: "Use the Communication tab to generate drafts for this student's guardian.",
    },
    {
      id: "risk-insights",
      title: "Risk insights",
      description:
        "At-risk flags, dropout warnings, grade-attendance correlation, and intervention suggestions.",
      icon: <BarChart3 className="h-5 w-5 text-indigo-600" />,
      badge: "Analytics tab",
      note: "See the Analytics tab for this student's early warning profile.",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div>
            <p className="font-semibold text-indigo-950">Teaching & learning assistance</p>
            <p className="mt-1 text-sm text-indigo-900/80">
              AI tools connected to {studentName}&apos;s records. Open the linked workspace or
              use the tabs above for student-specific actions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <article
            key={tool.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                {tool.icon}
              </div>
              {tool.badge ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {tool.badge}
                </span>
              ) : null}
            </div>
            <h4 className="mt-4 font-semibold text-slate-900">{tool.title}</h4>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{tool.description}</p>
            {tool.note ? (
              <p className="mt-3 text-xs text-slate-500">{tool.note}</p>
            ) : null}
            {tool.href ? (
              <Link
                href={tool.href}
                className="mt-4 inline-flex w-fit text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Open tool →
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
