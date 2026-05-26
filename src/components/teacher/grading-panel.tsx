"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AssessmentType } from "@prisma/client";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { AssessmentSummaryBar } from "@/components/teacher/assessment-summary-bar";
import { averageStudentTotals } from "@/lib/grading-display";
import { TOTAL_WEIGHT_MARKS } from "@/lib/grading-weighted";
import { saveGrades } from "@/lib/actions/grading";
import type { SavedSingleAssessment } from "@/lib/services/single-assessment";

type Subject = { id: string; name: string; code: string; gradeBand: string };
type ClassOption = { id: string; name: string; gradeLevel: number };
type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  class: { name: string } | null;
};

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: "QUIZ", label: "Quiz" },
  { value: "MIDTERM", label: "Midterm" },
  { value: "FINAL", label: "Final" },
  { value: "CONTINUOUS", label: "Continuous assessment" },
  { value: "PLAY_BASED", label: "Play-based (KG)" },
];

function resolveInitialSelection(
  subjects: Subject[],
  classesBySubject: Record<string, ClassOption[]>,
  initialSubjectId?: string,
  initialClassId?: string
) {
  const subjectIds = new Set(subjects.map((s) => s.id));
  let subjectId = initialSubjectId && subjectIds.has(initialSubjectId)
    ? initialSubjectId
    : subjects[0]?.id ?? "";
  let classId = initialClassId ?? "";

  if (classId) {
    const subjectForClass = subjects.find((s) =>
      classesBySubject[s.id]?.some((c) => c.id === classId)
    );
    if (subjectForClass) subjectId = subjectForClass.id;
    else classId = "";
  }

  const classes = classesBySubject[subjectId] ?? [];
  if (!classId || !classes.some((c) => c.id === classId)) {
    classId = classes[0]?.id ?? "";
  }

  return { subjectId, classId };
}

function formatAssessmentDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ET", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GradingPanel({
  subjects,
  classesBySubject,
  studentsByClass,
  singleAssessmentsByClass = {},
  initialSubjectId,
  initialClassId,
}: {
  subjects: Subject[];
  classesBySubject: Record<string, ClassOption[]>;
  studentsByClass: Record<string, Student[]>;
  singleAssessmentsByClass?: Record<string, SavedSingleAssessment[]>;
  initialSubjectId?: string;
  initialClassId?: string;
}) {
  const router = useRouter();
  const initial = resolveInitialSelection(
    subjects,
    classesBySubject,
    initialSubjectId,
    initialClassId
  );
  const [subjectId, setSubjectId] = useState(initial.subjectId);
  const [classId, setClassId] = useState(initial.classId);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AssessmentType>("QUIZ");
  const [maxScore, setMaxScore] = useState(100);
  const [weightMarks, setWeightMarks] = useState(25);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [expandedSavedId, setExpandedSavedId] = useState<string | null>(null);
  const [highlightSavedId, setHighlightSavedId] = useState<string | null>(null);

  const classes = classesBySubject[subjectId] ?? [];
  const students = classId ? (studentsByClass[`${subjectId}:${classId}`] ?? []) : [];
  const comboKey = classId ? `${subjectId}:${classId}` : "";
  const savedForClass = comboKey ? (singleAssessmentsByClass[comboKey] ?? []) : [];

  const enteredScores = useMemo(() => {
    return students
      .map((s) => parseFloat(scores[s.id] ?? ""))
      .filter((n) => !Number.isNaN(n));
  }, [students, scores]);

  const classAverage = averageStudentTotals(enteredScores);
  const enteredCount = enteredScores.length;

  function onSubjectChange(id: string) {
    setSubjectId(id);
    const first = classesBySubject[id]?.[0];
    setClassId(first?.id ?? "");
    setScores({});
  }

  function onClassChange(id: string) {
    setClassId(id);
    setScores({});
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const grades = students
      .map((s) => ({
        studentId: s.id,
        score: parseFloat(scores[s.id] ?? ""),
      }))
      .filter((g) => !Number.isNaN(g.score));

    if (!title.trim()) {
      setError("Enter an assessment title.");
      return;
    }
    if (weightMarks < 0 || weightMarks > TOTAL_WEIGHT_MARKS) {
      setError(`Weight must be between 0 and ${TOTAL_WEIGHT_MARKS} marks.`);
      return;
    }
    if (grades.length === 0) {
      setError("Enter at least one score.");
      return;
    }

    startTransition(async () => {
      const result = await saveGrades(
        subjectId,
        classId,
        title.trim(),
        type,
        maxScore,
        weightMarks,
        grades
      );
      if (result.success) {
        setMessage(result.message);
        setScores({});
        setTitle("");
        if (result.assessmentId) {
          setExpandedSavedId(result.assessmentId);
          setHighlightSavedId(result.assessmentId);
        }
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (subjects.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        No subjects assigned yet. Contact your branch admin to assign subjects after
        registration approval.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-sm text-sky-900">
        <strong>Single assessment:</strong> one quiz or test with its own{" "}
        <strong>weight marks</strong> and <strong>max score</strong>. Student score is the
        mark earned; full value for this assessment is the max score.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject">
          <Select
            value={subjectId}
            onChange={(e) => onSubjectChange(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.gradeBand.replace("_", " ")})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Class (grade cohort)">
          <Select
            value={classId}
            onChange={(e) => onClassChange(e.target.value)}
            required
          >
            <option value="" disabled>
              Select class
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Assessment mark weights
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Assessment title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3 Quiz"
              required
            />
          </Field>
          <Field label="Type">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as AssessmentType)}
            >
              {ASSESSMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Weight (marks)">
            <Input
              type="number"
              min={0}
              max={TOTAL_WEIGHT_MARKS}
              step={1}
              value={weightMarks}
              onChange={(e) => setWeightMarks(Number(e.target.value))}
            />
          </Field>
          <Field label="Max marks (full value)">
            <Input
              type="number"
              min={1}
              max={1000}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
            />
          </Field>
        </div>
      </div>

      {students.length > 0 && (
        <AssessmentSummaryBar
          title="Single assessment values"
          items={[
            {
              label: "Assessment weight",
              value: `${weightMarks} marks`,
              hint: `Share of term (${TOTAL_WEIGHT_MARKS} marks total on full sheet)`,
              variant: "accent",
            },
            {
              label: "Full assessment value",
              value: String(maxScore),
              hint: "Maximum marks per student",
              variant: "default",
            },
            {
              label: "Class average score",
              value: classAverage !== null ? String(classAverage) : "—",
              hint: `From ${enteredCount} entered`,
              variant: "default",
            },
            {
              label: "Completion",
              value: `${enteredCount} / ${students.length}`,
              hint: "Students with a score",
              variant: enteredCount === students.length ? "success" : "warning",
            },
          ]}
        />
      )}

      {students.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Student ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 text-center font-medium">
                  Score
                  <span className="block text-xs font-normal text-indigo-600">
                    / {maxScore} max
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium bg-indigo-50 text-indigo-900">
                  % of full
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => {
                const raw = scores[s.id];
                const num = raw !== undefined && raw !== "" ? parseFloat(raw) : null;
                const pct =
                  num !== null && maxScore > 0
                    ? Math.round((num / maxScore) * 1000) / 10
                    : null;
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-xs">{s.studentId}</td>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{s.class?.name ?? "—"}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        max={maxScore}
                        step={0.5}
                        value={scores[s.id] ?? ""}
                        onChange={(e) =>
                          setScores((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm"
                        placeholder="—"
                      />
                    </td>
                    <td className="bg-indigo-50/50 px-4 py-2 text-center text-sm font-medium text-indigo-800">
                      {pct !== null ? `${pct}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <Button type="submit" disabled={pending || students.length === 0}>
        {pending ? "Saving…" : "Save assessment"}
      </Button>

      {classId && (
        <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Saved assessments</h2>
              <p className="text-xs text-slate-500">
                Scores you saved for this class and subject appear here. Parents see them under
                Results after sync.
              </p>
            </div>
            <Link
              href="/teacher/reports"
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              All report cards →
            </Link>
          </div>

          {savedForClass.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              No saved assessments yet for this class. Enter scores above and click{" "}
              <strong>Save assessment</strong>.
            </p>
          ) : (
            <ul className="space-y-2">
              {savedForClass.map((a) => {
                const open = expandedSavedId === a.id;
                const highlighted = highlightSavedId === a.id;
                const avg =
                  a.grades.length > 0
                    ? Math.round(
                        (a.grades.reduce((s, g) => s + g.score, 0) / a.grades.length) * 10
                      ) / 10
                    : null;
                return (
                  <li
                    key={a.id}
                    className={`overflow-hidden rounded-lg border bg-white ${
                      highlighted
                        ? "border-emerald-300 ring-2 ring-emerald-100"
                        : "border-slate-200"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50"
                      onClick={() =>
                        setExpandedSavedId((id) => (id === a.id ? null : a.id))
                      }
                    >
                      {open ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-slate-900">{a.title}</span>
                        <span className="ml-2 text-xs capitalize text-slate-500">
                          {a.type.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </span>
                      <span className="hidden text-xs text-slate-500 sm:inline">
                        {a.grades.length} students · weight {a.weightMarks}m · max {a.maxScore}
                        {avg !== null ? ` · avg ${avg}` : ""}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatAssessmentDate(a.date)}
                      </span>
                    </button>
                    {open && (
                      <div className="border-t border-slate-100 px-4 pb-3">
                        <table className="mt-2 w-full text-sm">
                          <thead className="text-left text-xs text-slate-500">
                            <tr>
                              <th className="py-1 font-medium">Student</th>
                              <th className="py-1 text-center font-medium">Score</th>
                              <th className="py-1 text-center font-medium">% of max</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {a.grades.map((g) => {
                              const pct =
                                a.maxScore > 0
                                  ? Math.round((g.score / a.maxScore) * 1000) / 10
                                  : null;
                              return (
                                <tr key={g.studentId}>
                                  <td className="py-1.5">
                                    <span className="font-medium text-slate-800">
                                      {g.name}
                                    </span>
                                    <span className="ml-2 font-mono text-xs text-slate-400">
                                      {g.studentCode}
                                    </span>
                                  </td>
                                  <td className="py-1.5 text-center font-medium text-slate-900">
                                    {g.score}
                                    <span className="text-slate-400"> / {a.maxScore}</span>
                                  </td>
                                  <td className="py-1.5 text-center text-indigo-700">
                                    {pct !== null ? `${pct}%` : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </form>
  );
}
