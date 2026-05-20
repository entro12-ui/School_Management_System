"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/input";
import {
  loadWeightedGradingSheet,
  saveWeightedGradingSheet,
  type SavedSheetPayload,
} from "@/lib/actions/grading-weighted";
import {
  AssessmentSummaryBar,
  WeightTotalBadge,
} from "@/components/teacher/assessment-summary-bar";
import { buildFullAssessmentStats } from "@/lib/grading-display";
import {
  computeWeightedTotal,
  defaultComponents,
  newComponentId,
  sumWeightMarks,
  TOTAL_WEIGHT_MARKS,
  weightsAreValid,
  type WeightComponent,
} from "@/lib/grading-weighted";

type Subject = { id: string; name: string; code: string; gradeBand: string };
type ClassOption = { id: string; name: string; gradeLevel: number };
type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  class: { name: string } | null;
};

function sheetKey(subjectId: string, classId: string) {
  return `${subjectId}:${classId}`;
}

function scoresFromSheet(sheet: SavedSheetPayload | undefined) {
  const next: Record<string, Record<string, string>> = {};
  if (!sheet) return next;
  for (const row of sheet.rows) {
    next[row.studentId] = {};
    for (const c of sheet.components) {
      const colId = c.assessmentId ?? c.id;
      const val = row.scores[colId];
      if (val !== null && val !== undefined) {
        next[row.studentId][colId] = String(val);
      }
    }
  }
  return next;
}

function applySheetToState(
  sheet: SavedSheetPayload | undefined,
  setComponents: (c: WeightComponent[]) => void,
  setScores: (s: Record<string, Record<string, string>>) => void
) {
  if (sheet && sheet.components.length > 0) {
    setComponents(sheet.components);
    setScores(scoresFromSheet(sheet));
  } else {
    setComponents(defaultComponents());
    setScores({});
  }
}

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

export function WeightedGradingPanel({
  subjects,
  classesBySubject,
  studentsByClass,
  initialSheets = {},
  initialSubjectId,
  initialClassId,
}: {
  subjects: Subject[];
  classesBySubject: Record<string, ClassOption[]>;
  studentsByClass: Record<string, Student[]>;
  initialSheets?: Record<string, SavedSheetPayload>;
  initialSubjectId?: string;
  initialClassId?: string;
}) {
  const initial = resolveInitialSelection(
    subjects,
    classesBySubject,
    initialSubjectId,
    initialClassId
  );
  const firstKey =
    initial.subjectId && initial.classId
      ? sheetKey(initial.subjectId, initial.classId)
      : "";

  const [subjectId, setSubjectId] = useState(initial.subjectId);
  const [classId, setClassId] = useState(initial.classId);
  const [components, setComponents] = useState<WeightComponent[]>(() => {
    const sheet = firstKey ? initialSheets[firstKey] : undefined;
    return sheet?.components.length ? sheet.components : defaultComponents();
  });
  const [scores, setScores] = useState<Record<string, Record<string, string>>>(() =>
    scoresFromSheet(firstKey ? initialSheets[firstKey] : undefined)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [pending, startTransition] = useTransition();

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadSeq = useRef(0);
  const skipAutoSave = useRef(true);

  const classes = classesBySubject[subjectId] ?? [];
  const students = useMemo(
    () => (classId ? (studentsByClass[`${subjectId}:${classId}`] ?? []) : []),
    [classId, subjectId, studentsByClass]
  );
  const totalWeight = sumWeightMarks(components);
  const weightsValid = weightsAreValid(components);

  const applySheet = useCallback(
    (sheet: SavedSheetPayload | undefined) => {
      applySheetToState(sheet, setComponents, setScores);
    },
    []
  );

  const persistSheet = useCallback(
    async (silent = false) => {
      if (!subjectId || !classId || !weightsValid) return false;

      const numericScores: Record<string, Record<string, number>> = {};
      for (const s of students) {
        for (const c of components) {
          const raw = scores[s.id]?.[c.id];
          if (raw === undefined || raw === "") continue;
          const num = parseFloat(raw);
          if (Number.isNaN(num)) continue;
          if (!numericScores[c.id]) numericScores[c.id] = {};
          numericScores[c.id][s.id] = num;
        }
      }

      if (!silent) setSaveStatus("saving");

      const result = await saveWeightedGradingSheet({
        subjectId,
        classId,
        components,
        scores: numericScores,
      });

      if (result.success) {
        if (result.sheet) {
          skipAutoSave.current = true;
          applySheet(result.sheet);
          skipAutoSave.current = false;
        }
        if (!silent) {
          setMessage(result.message);
          setError(null);
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        return true;
      }

      if (!silent) setError(result.error);
      setSaveStatus("idle");
      return false;
    },
    [subjectId, classId, weightsValid, students, components, scores, applySheet]
  );

  useEffect(() => {
    if (!subjectId || !classId) return;

    const seq = ++loadSeq.current;
    skipAutoSave.current = true;

    (async () => {
      const sheet = await loadWeightedGradingSheet(subjectId, classId);
      if (seq !== loadSeq.current) return;
      if (sheet && sheet.components.length > 0) {
        applySheet({
          components: sheet.components,
          rows: sheet.rows.map((r) => ({
            studentId: r.studentId,
            scores: r.scores,
          })),
        });
      } else {
        const key = sheetKey(subjectId, classId);
        const fromServer = initialSheets[key];
        if (fromServer?.components.length) {
          applySheet(fromServer);
        } else {
          applySheet(undefined);
        }
      }
      skipAutoSave.current = false;
    })();
  }, [subjectId, classId, initialSheets, applySheet]);

  useEffect(() => {
    if (skipAutoSave.current) return;
    if (!weightsValid || !subjectId || !classId) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      startTransition(() => {
        void persistSheet(true);
      });
    }, 1200);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [scores, components, subjectId, classId, weightsValid, persistSheet]);

  function onSubjectChange(id: string) {
    skipAutoSave.current = true;
    setSubjectId(id);
    const first = classesBySubject[id]?.[0];
    setClassId(first?.id ?? "");
    setMessage(null);
    setError(null);
    skipAutoSave.current = false;
  }

  function onClassChange(id: string) {
    skipAutoSave.current = true;
    setClassId(id);
    setMessage(null);
    setError(null);
    skipAutoSave.current = false;
  }

  function updateComponent(id: string, patch: Partial<WeightComponent>) {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  function addComponent() {
    setComponents((prev) => [
      ...prev,
      { id: newComponentId(), label: "Assignment", weightMarks: 0, maxScore: 100 },
    ]);
  }

  function removeComponent(id: string) {
    if (components.length <= 1) return;
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setScores((prev) => {
      const next = { ...prev };
      for (const sid of Object.keys(next)) {
        const row = { ...next[sid] };
        delete row[id];
        next[sid] = row;
      }
      return next;
    });
  }

  function setScore(studentId: string, columnId: string, value: string) {
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? {}), [columnId]: value },
    }));
  }

  const weightedByStudent = useMemo(() => {
    const out: Record<string, number | null> = {};
    for (const s of students) {
      const rowScores: Record<string, number | null> = {};
      for (const c of components) {
        const raw = scores[s.id]?.[c.id];
        rowScores[c.id] =
          raw === undefined || raw === "" ? null : parseFloat(raw);
      }
      out[s.id] = computeWeightedTotal(components, rowScores);
    }
    return out;
  }, [students, components, scores]);

  const fullStats = useMemo(
    () =>
      buildFullAssessmentStats(
        components,
        scores,
        students.map((s) => s.id)
      ),
    [components, scores, students]
  );

  const gradeColumns = useMemo<DataTableColumn<Student>[]>(() => {
    const cols: DataTableColumn<Student>[] = [
      {
        id: "studentId",
        header: "Student ID",
        sortable: true,
        sortValue: (s) => s.studentId,
        cellClassName: "font-mono text-xs",
        cell: (s) => s.studentId,
      },
      {
        id: "name",
        header: "Name",
        sortable: true,
        sortValue: (s) => `${s.lastName} ${s.firstName}`,
        cell: (s) => (
          <span className="font-medium text-slate-900">
            {s.firstName} {s.lastName}
          </span>
        ),
      },
      {
        id: "class",
        header: "Class",
        sortable: true,
        sortValue: (s) => s.class?.name ?? "",
        cell: (s) => s.class?.name ?? "—",
      },
    ];

    for (const c of components) {
      cols.push({
        id: c.id,
        header: (
          <div className="text-center">
            <div>{c.label}</div>
            <div className="text-xs font-normal text-indigo-600">{c.weightMarks} marks</div>
          </div>
        ),
        headerClassName: "text-center min-w-[88px]",
        cellClassName: "px-2 py-2",
        sortable: true,
        sortValue: (s) => parseFloat(scores[s.id]?.[c.id] ?? "") || -1,
        cell: (s) => (
          <input
            type="number"
            min={0}
            max={c.maxScore}
            step={0.5}
            value={scores[s.id]?.[c.id] ?? ""}
            onChange={(e) => setScore(s.id, c.id, e.target.value)}
            onBlur={() => {
              if (weightsValid) {
                startTransition(() => void persistSheet(true));
              }
            }}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm"
            placeholder="—"
            title={`${c.label} (weight ${c.weightMarks} marks)`}
          />
        ),
      });
    }

    cols.push({
      id: "weightedTotal",
      header: (
        <div className="text-center">
          <div>Total marks</div>
          <div className="text-xs font-normal text-indigo-600">
            (sum · max {fullStats.maxTotalMarks})
          </div>
        </div>
      ),
      headerClassName: "text-center bg-indigo-50 text-indigo-900",
      cellClassName: "text-center font-semibold text-indigo-700 bg-indigo-50/50",
      sortable: true,
      sortValue: (s) => weightedByStudent[s.id] ?? -1,
      cell: (s) => {
        const total = weightedByStudent[s.id];
        return total !== null && total !== undefined ? total : "—";
      },
    });

    return cols;
  }, [
    components,
    scores,
    weightsValid,
    weightedByStudent,
    fullStats.maxTotalMarks,
    persistSheet,
    startTransition,
  ]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!weightsValid) {
      setError(`Weights must total ${TOTAL_WEIGHT_MARKS} marks (currently ${totalWeight}).`);
      return;
    }

    startTransition(async () => {
      await persistSheet(false);
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
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900">
        <strong>Full assessment sheet:</strong> add columns with mark weights (total{" "}
        <strong>{TOTAL_WEIGHT_MARKS} marks</strong>), enter scores, then read each student&apos;s{" "}
        <strong>total marks</strong> (sum of all columns). Auto-saves as you type.
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        {saveStatus === "saving" && <span className="text-indigo-600">Saving…</span>}
        {saveStatus === "saved" && (
          <span className="text-emerald-600">All changes saved</span>
        )}
        {saveStatus === "idle" && weightsValid && (
          <span className="text-slate-400">Marks auto-save as you type</span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject you teach">
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

      {students.length > 0 && (
        <AssessmentSummaryBar
          title="Full assessment totals"
          items={[
            {
              label: "Weight marks (columns)",
              value: `${fullStats.weightTotal} / ${fullStats.targetWeightMarks}`,
              hint: "Distribution across assessments",
              variant: weightsValid ? "success" : "warning",
            },
            {
              label: "Full assessment max total",
              value: String(fullStats.maxTotalMarks),
              hint: "Sum of each column max marks",
              variant: "accent",
            },
            {
              label: "Class average total",
              value:
                fullStats.classAverageTotal !== null
                  ? String(fullStats.classAverageTotal)
                  : "—",
              hint: "Average of student total marks",
              variant: "default",
            },
            {
              label: "Students graded",
              value: `${fullStats.studentTotals.filter((t) => t !== null).length} / ${students.length}`,
              hint: "With at least one mark entered",
              variant: "default",
            },
          ]}
        />
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Assessment mark weights</h2>
          <WeightTotalBadge current={totalWeight} />
        </div>

        <div className="space-y-2">
          {components.map((c) => (
            <div
              key={c.id}
              className="grid gap-2 sm:grid-cols-[1fr_100px_100px_auto] items-end"
            >
              <Field label="Column name">
                <Input
                  value={c.label}
                  onChange={(e) => updateComponent(c.id, { label: e.target.value })}
                  placeholder="e.g. Quiz 1"
                />
              </Field>
              <Field label="Weight (marks)">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={c.weightMarks}
                  onChange={(e) =>
                    updateComponent(c.id, {
                      weightMarks: Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Max marks">
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={c.maxScore}
                  onChange={(e) =>
                    updateComponent(c.id, { maxScore: Number(e.target.value) })
                  }
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => removeComponent(c.id)}
                disabled={components.length <= 1}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" className="mt-3" onClick={addComponent}>
          + Add column
        </Button>
      </div>

      {students.length > 0 && (
        <DataTable
          data={students}
          columns={gradeColumns}
          rowKey={(s) => s.id}
          searchPlaceholder="Search student name, ID, class…"
          getSearchText={(s) =>
            [s.studentId, s.firstName, s.lastName, s.class?.name ?? ""].join(" ")
          }
          filters={
            [...new Set(students.map((s) => s.class?.name).filter(Boolean))].length > 1
              ? [
                  {
                    id: "class",
                    label: "Class",
                    options: [...new Set(students.map((s) => s.class?.name ?? "—"))].map(
                      (c) => ({ value: c, label: c })
                    ),
                    predicate: (s, v) => (s.class?.name ?? "—") === v,
                  },
                ]
              : []
          }
          pageSize={20}
          recordLabel="student"
          minWidth="800px"
        />
      )}

      {!weightsValid && students.length > 0 && (
        <p className="text-sm text-amber-700">
          Adjust column weights to total {TOTAL_WEIGHT_MARKS} marks before entering marks.
        </p>
      )}

      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <Button
        type="submit"
        disabled={pending || students.length === 0 || !weightsValid}
      >
        {pending ? "Saving…" : "Save now"}
      </Button>
    </form>
  );
}
