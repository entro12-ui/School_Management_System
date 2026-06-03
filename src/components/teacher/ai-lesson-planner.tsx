"use client";

import { useMemo, useState } from "react";
import {
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Layers3,
  Lightbulb,
  Loader2,
  Printer,
  Sparkles,
  Target,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";

type GradeOption = {
  value: number;
  label: string;
  classCount: number;
};

type SubjectOption = {
  id: string;
  name: string;
};

type LessonPlan = {
  title: string;
  overview: string;
  standards: string[];
  objectives: string[];
  activities: { phase: string; description: string; duration: string }[];
  assessments: string[];
  differentiation: { level: string; strategy: string }[];
  materials: string[];
};

const GRADE_CONTEXT: Record<
  string,
  {
    standardFocus: string;
    teachingStyle: string;
    assessmentStyle: string;
  }
> = {
  KG: {
    standardFocus: "foundational language, numeracy, social interaction, and play-based discovery",
    teachingStyle: "short, visual, story-led activities with movement and repetition",
    assessmentStyle: "observation, oral response, matching, drawing, and participation checks",
  },
  PRIMARY: {
    standardFocus: "core literacy, numeracy, vocabulary, practical understanding, and guided practice",
    teachingStyle: "teacher modeling, group practice, concrete examples, and simple reflection",
    assessmentStyle: "exit tickets, short exercises, oral questioning, and notebook review",
  },
  JUNIOR: {
    standardFocus: "conceptual understanding, problem solving, subject vocabulary, and evidence-based explanation",
    teachingStyle: "inquiry, collaborative tasks, worked examples, and structured discussion",
    assessmentStyle: "quick quizzes, applied tasks, peer explanation, and rubric-based checks",
  },
  SENIOR: {
    standardFocus: "exam readiness, analytical reasoning, independent practice, and real-world application",
    teachingStyle: "case analysis, advanced practice, debate, research prompts, and exam-style review",
    assessmentStyle: "performance tasks, written responses, exam-style questions, and self-evaluation",
  },
};

function gradeBandFor(level: number) {
  if (level === 0) return "KG";
  if (level <= 5) return "PRIMARY";
  if (level <= 8) return "JUNIOR";
  return "SENIOR";
}

function normalizeTopic(topic: string) {
  return topic.trim().replace(/\s+/g, " ");
}

function fileSafeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function formatLessonPlanText(plan: LessonPlan) {
  const lines = [
    plan.title,
    "",
    "Overview",
    plan.overview,
    "",
    "Curriculum standards alignment",
    ...plan.standards.map((item) => `- ${item}`),
    "",
    "Learning objectives",
    ...plan.objectives.map((item) => `- ${item}`),
    "",
    "Lesson activities",
    ...plan.activities.map(
      (activity) => `- ${activity.phase} (${activity.duration}): ${activity.description}`
    ),
    "",
    "Assessment checks",
    ...plan.assessments.map((item) => `- ${item}`),
    "",
    "Differentiation by learning level",
    ...plan.differentiation.map((item) => `- ${item.level}: ${item.strategy}`),
    "",
    "Materials",
    ...plan.materials.map((item) => `- ${item}`),
  ];

  return lines.join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatListHtml(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function formatLessonPlanHtml(plan: LessonPlan) {
  return `
    <html>
      <head>
        <title>${escapeHtml(plan.title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; line-height: 1.55; padding: 32px; }
          h1 { font-size: 26px; margin-bottom: 8px; }
          h2 { font-size: 17px; margin-top: 26px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          p, li { font-size: 14px; }
          .activity { margin: 10px 0; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; }
          .phase { font-weight: 700; }
          .duration { color: #475569; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(plan.title)}</h1>
        <p>${escapeHtml(plan.overview)}</p>
        <h2>Curriculum standards alignment</h2>
        ${formatListHtml(plan.standards)}
        <h2>Learning objectives</h2>
        ${formatListHtml(plan.objectives)}
        <h2>Lesson activities</h2>
        ${plan.activities
          .map(
            (activity) => `
              <div class="activity">
                <div class="phase">${escapeHtml(activity.phase)}</div>
                <div class="duration">${escapeHtml(activity.duration)}</div>
                <p>${escapeHtml(activity.description)}</p>
              </div>
            `
          )
          .join("")}
        <h2>Assessment checks</h2>
        ${formatListHtml(plan.assessments)}
        <h2>Differentiation by learning level</h2>
        ${formatListHtml(plan.differentiation.map((item) => `${item.level}: ${item.strategy}`))}
        <h2>Materials</h2>
        ${formatListHtml(plan.materials)}
      </body>
    </html>
  `;
}

function generateLessonPlan({
  gradeLabel,
  gradeLevel,
  subject,
  topic,
}: {
  gradeLabel: string;
  gradeLevel: number;
  subject: string;
  topic: string;
}): LessonPlan {
  const cleanTopic = normalizeTopic(topic);
  const band = gradeBandFor(gradeLevel);
  const context = GRADE_CONTEXT[band];

  return {
    title: `${subject} lesson plan: ${cleanTopic}`,
    overview: `A structured ${gradeLabel} ${subject} lesson on ${cleanTopic}, designed to connect curriculum expectations with active learning, formative assessment, and differentiated support.`,
    standards: [
      `Align the lesson to ${context.standardFocus}.`,
      `Use examples and learning tasks appropriate for ${gradeLabel} learners.`,
      `Connect ${cleanTopic} to prior knowledge, classroom discussion, and measurable learning evidence.`,
    ],
    objectives: [
      `Students will explain the main idea of ${cleanTopic} using accurate ${subject} vocabulary.`,
      `Students will apply ${cleanTopic} through guided practice and one independent task.`,
      `Students will show understanding through ${context.assessmentStyle}.`,
    ],
    activities: [
      {
        phase: "Engage",
        duration: "5-8 min",
        description: `Open with a question, image, quick story, or real-life example that introduces ${cleanTopic} and reveals what students already know.`,
      },
      {
        phase: "Teach",
        duration: "12-15 min",
        description: `Model the key idea step by step using ${context.teachingStyle}. Highlight two or three essential terms students must remember.`,
      },
      {
        phase: "Practice",
        duration: "15-20 min",
        description: `Students work in pairs or small groups on a task that applies ${cleanTopic}. Circulate and support misconceptions immediately.`,
      },
      {
        phase: "Reflect",
        duration: "5-7 min",
        description: `Close with an exit question: “What is one thing you now understand about ${cleanTopic}, and where do you still need help?”`,
      },
    ],
    assessments: [
      `Ask three targeted oral questions during guided practice to check conceptual understanding.`,
      `Collect a short exit ticket or exercise focused on ${cleanTopic}.`,
      `Use student responses to group learners for the next lesson: reteach, practice, or enrichment.`,
    ],
    differentiation: [
      {
        level: "Support",
        strategy: `Provide vocabulary cards, worked examples, sentence starters, or teacher-guided practice for students who need more structure.`,
      },
      {
        level: "Core",
        strategy: `Give standard practice tasks that require students to explain and apply ${cleanTopic} independently.`,
      },
      {
        level: "Extension",
        strategy: `Challenge advanced learners with a real-world problem, comparison task, mini-research prompt, or exam-style question.`,
      },
    ],
    materials: [
      "Board or projector",
      "Student notebooks",
      "Short practice worksheet or exercise prompt",
      "Exit ticket questions",
    ],
  };
}

export function AiLessonPlanner({
  gradeOptions,
  subjectOptions,
}: {
  gradeOptions: GradeOption[];
  subjectOptions: SubjectOption[];
}) {
  const [gradeValue, setGradeValue] = useState(
    gradeOptions[0] ? String(gradeOptions[0].value) : ""
  );
  const [subjectId, setSubjectId] = useState(subjectOptions[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGrade = useMemo(
    () => gradeOptions.find((grade) => String(grade.value) === gradeValue) ?? null,
    [gradeOptions, gradeValue]
  );
  const selectedSubject = useMemo(
    () => subjectOptions.find((subject) => subject.id === subjectId) ?? null,
    [subjectId, subjectOptions]
  );

  function handleGenerate() {
    const cleanTopic = normalizeTopic(topic);
    if (!selectedGrade || !selectedSubject) {
      setError("Select a grade and subject first.");
      return;
    }
    if (cleanTopic.length < 3) {
      setError("Enter a topic with at least 3 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      setLessonPlan(
        generateLessonPlan({
          gradeLabel: selectedGrade.label,
          gradeLevel: selectedGrade.value,
          subject: selectedSubject.name,
          topic: cleanTopic,
        })
      );
      setLoading(false);
    }, 450);
  }

  function downloadLessonPlan() {
    if (!lessonPlan) return;
    const text = formatLessonPlanText(lessonPlan);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileSafeName(lessonPlan.title) || "lesson-plan"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function printLessonPlan() {
    if (!lessonPlan) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setError("Popup blocked. Please allow popups to print the lesson plan.");
      return;
    }
    printWindow.document.write(formatLessonPlanHtml(lessonPlan));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  const disabled = gradeOptions.length === 0 || subjectOptions.length === 0;

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-lg shadow-indigo-100/40">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-100 ring-1 ring-white/15">
              <Sparkles className="h-3.5 w-3.5" />
              AI Lesson Planner
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Plan a complete lesson from one topic
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">
              Select a grade and subject, enter today&apos;s topic, and generate objectives,
              activities, assessments, curriculum alignment, and differentiated support
              for multiple learning levels.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Objectives", icon: Target },
              { label: "Activities", icon: Lightbulb },
              { label: "Assessments", icon: ClipboardCheck },
              { label: "Differentiation", icon: UsersRound },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                  <Icon className="h-4 w-4 text-cyan-200" />
                  <p className="mt-2 font-semibold">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
          <div className="grid gap-4">
            <Field label="Grade">
              <Select
                value={gradeValue}
                onChange={(event) => setGradeValue(event.target.value)}
                disabled={disabled}
                className="h-11 rounded-xl border-indigo-100 bg-white font-medium"
              >
                {gradeOptions.map((grade) => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                    {grade.classCount > 0
                      ? ` · ${grade.classCount} class${grade.classCount === 1 ? "" : "es"}`
                      : ""}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Subject">
              <Select
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                disabled={disabled}
                className="h-11 rounded-xl border-indigo-100 bg-white font-medium"
              >
                {subjectOptions.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Topic">
              <Input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleGenerate();
                }}
                placeholder="Example: Photosynthesis, Fractions, Ethiopian history..."
                className="h-11 rounded-xl border-indigo-100 bg-white"
                disabled={disabled}
              />
            </Field>

            {disabled ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Assign this teacher to at least one class and subject before generating plans.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={disabled || loading}
              className="h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Generate lesson plan
            </Button>
          </div>
        </div>

        <div className="min-h-[360px] rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
          {lessonPlan ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                  Generated plan
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{lessonPlan.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{lessonPlan.overview}</p>
              </div>

              <LessonSection
                icon={Layers3}
                title="Curriculum standards alignment"
                items={lessonPlan.standards}
              />
              <LessonSection icon={Target} title="Learning objectives" items={lessonPlan.objectives} />

              <div>
                <SectionTitle icon={Lightbulb} title="Lesson activities" />
                <div className="mt-3 grid gap-3">
                  {lessonPlan.activities.map((activity) => (
                    <div
                      key={activity.phase}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{activity.phase}</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                          {activity.duration}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {activity.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <LessonSection
                icon={ClipboardCheck}
                title="Assessment checks"
                items={lessonPlan.assessments}
              />

              <div>
                <SectionTitle icon={UsersRound} title="Differentiation by learning level" />
                <div className="mt-3 grid gap-3">
                  {lessonPlan.differentiation.map((item) => (
                    <div key={item.level} className="rounded-xl bg-indigo-50/70 p-3">
                      <p className="text-sm font-semibold text-indigo-900">{item.level}</p>
                      <p className="mt-1 text-sm leading-6 text-indigo-800/80">{item.strategy}</p>
                    </div>
                  ))}
                </div>
              </div>

              <LessonSection icon={CheckCircle2} title="Materials" items={lessonPlan.materials} />

              <div className="flex flex-wrap gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadLessonPlan}
                  className="rounded-xl border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                >
                  <Download className="h-4 w-4" />
                  Download plan
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={printLessonPlan}
                  className="rounded-xl"
                >
                  <Printer className="h-4 w-4" />
                  Print plan
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <Brain className="h-10 w-10 text-indigo-300" />
              <h3 className="mt-4 font-semibold text-slate-900">Ready when you are</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Choose a grade, subject, and topic to create a classroom-ready lesson plan
                with objectives, activities, assessment ideas, and learning-level support.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
        <Icon className="h-4 w-4" />
      </div>
      <h4 className="font-semibold text-slate-900">{title}</h4>
    </div>
  );
}

function LessonSection({
  icon,
  title,
  items,
}: {
  icon: LucideIcon;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <SectionTitle icon={icon} title={title} />
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
