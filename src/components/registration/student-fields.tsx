"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/input";
import {
  GRADE_LEVEL_OPTIONS,
  requiresStream,
  STREAM_OPTIONS,
} from "@/lib/grade-utils";

export function StudentFields() {
  const [gradeLevel, setGradeLevel] = useState(0);
  const showStream = requiresStream(gradeLevel);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth *">
          <Input name="dateOfBirth" type="date" required />
        </Field>
        <Field label="Gender *">
          <Select name="gender" required defaultValue="">
            <option value="" disabled>
              Select gender
            </option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </Select>
        </Field>
      </div>

      <Field label="Grade level *">
        <Select
          name="gradeLevel"
          required
          value={String(gradeLevel)}
          onChange={(e) => setGradeLevel(Number(e.target.value))}
        >
          {GRADE_LEVEL_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
      </Field>

      {showStream && (
        <Field label="Stream (Grade 11–12) *">
          <Select name="stream" required defaultValue="">
            <option value="" disabled>
              Select stream
            </option>
            {STREAM_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Guardian / parent contact</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Guardian name *">
            <Input name="guardianName" required />
          </Field>
          <Field label="Guardian phone *">
            <Input name="guardianPhone" type="tel" required />
          </Field>
        </div>
      </div>
    </>
  );
}
