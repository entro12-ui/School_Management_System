"use client";

import { useEffect, useMemo, useState } from "react";
import { GradeBand } from "@prisma/client";
import {
  GRADE_BAND_LABELS,
  gradeBandForDepartment,
} from "@/lib/academic-catalog";

type Subject = {
  id: string;
  code: string;
  name: string;
  gradeBand: GradeBand;
};

export function TeacherSubjectPicker({
  subjects,
  department,
}: {
  subjects: Subject[];
  department: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const gradeBand = gradeBandForDepartment(department);

  const departmentSubjects = useMemo(() => {
    if (!gradeBand) return [];
    return subjects
      .filter((s) => s.gradeBand === gradeBand)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects, gradeBand]);

  useEffect(() => {
    setSelected((prev) =>
      prev.filter((id) => departmentSubjects.some((s) => s.id === id))
    );
  }, [department, departmentSubjects]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const departmentLabel = gradeBand ? GRADE_BAND_LABELS[gradeBand] : department;

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">
        Subjects to teach *{" "}
        <span className="font-normal text-slate-400">
          ({departmentLabel} — select all subjects this teacher will teach)
        </span>
      </p>
      {selected.map((id) => (
        <input key={id} type="hidden" name="subjectIds" value={id} />
      ))}

      {!gradeBand ? (
        <p className="mt-2 text-sm text-amber-700">Choose a teaching department above first.</p>
      ) : departmentSubjects.length === 0 ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No subjects in the database for {departmentLabel}. Run{" "}
          <code className="text-xs">npm run db:sync-subjects</code> on the server.
        </p>
      ) : (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            {departmentLabel} department
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {departmentSubjects.length} subjects — e.g. English, Civics, Chemistry, Biology…
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {departmentSubjects.map((s) => {
              const isOn = selected.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    isOn
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    checked={isOn}
                    onChange={() => toggle(s.id)}
                  />
                  <span className="font-medium">{s.name}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs font-medium text-indigo-600 hover:underline"
              onClick={() => setSelected(departmentSubjects.map((s) => s.id))}
            >
              Select all in this department
            </button>
            <button
              type="button"
              className="text-xs text-slate-500 hover:underline"
              onClick={() => setSelected([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {gradeBand && selected.length === 0 && (
        <p className="mt-2 text-xs text-amber-600">Select at least one subject</p>
      )}
    </div>
  );
}
