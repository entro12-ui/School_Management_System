"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AttendanceStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  saveWeeklyAttendance,
  type WeeklyAttendanceEntry,
} from "@/lib/actions/attendance";
import {
  formatWeekRange,
  parseDateKey,
  presentFromStatus,
  type WeekDay,
} from "@/lib/attendance-utils";
import { ChevronLeft, ChevronRight, Check, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type Student = { id: string; studentId: string; name: string; gradeLevel: number };

type Grid = Record<string, Record<string, AttendanceStatus | null>>;

function buildInitialChecked(grid: Grid, students: Student[], days: WeekDay[]) {
  const state: Record<string, Record<string, boolean>> = {};
  for (const s of students) {
    state[s.id] = {};
    for (const d of days) {
      state[s.id][d.key] = presentFromStatus(grid[s.id]?.[d.key] ?? null);
    }
  }
  return state;
}

export function WeeklyAttendanceSheet({
  classId,
  className,
  weekStartIso,
  prevWeekIso,
  nextWeekIso,
  students,
  days,
  grid,
}: {
  classId: string;
  className: string;
  weekStartIso: string;
  prevWeekIso: string;
  nextWeekIso: string;
  students: Student[];
  days: WeekDay[];
  grid: Grid;
}) {
  const [checked, setChecked] = useState(() =>
    buildInitialChecked(grid, students, days)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stats = useMemo(() => {
    let total = 0;
    let present = 0;
    for (const s of students) {
      for (const d of days) {
        total++;
        if (checked[s.id]?.[d.key]) present++;
      }
    }
    return { total, present, absent: total - present };
  }, [checked, students, days]);

  function toggle(studentId: string, dayKey: string) {
    setChecked((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [dayKey]: !prev[studentId]?.[dayKey],
      },
    }));
  }

  function markColumn(dayKey: string, value: boolean) {
    setChecked((prev) => {
      const next = { ...prev };
      for (const s of students) {
        next[s.id] = { ...next[s.id], [dayKey]: value };
      }
      return next;
    });
  }

  function markRow(studentId: string, value: boolean) {
    setChecked((prev) => {
      const next = { ...prev };
      next[studentId] = {};
      for (const d of days) {
        next[studentId][d.key] = value;
      }
      return next;
    });
  }

  function handleSave() {
    setMessage(null);
    setError(null);
    const entries: WeeklyAttendanceEntry[] = [];
    for (const s of students) {
      for (const d of days) {
        entries.push({
          studentId: s.id,
          date: d.key,
          present: checked[s.id]?.[d.key] ?? false,
        });
      }
    }

    startTransition(async () => {
      const result = await saveWeeklyAttendance(classId, weekStartIso, entries);
      if (result.success) setMessage(result.message);
      else setError(result.error);
    });
  }

  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
        No students in this class. Select another class or enroll students first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/teacher/attendance?classId=${encodeURIComponent(classId)}&week=${prevWeekIso}`}
            prefetch
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-[140px] text-center">
            <p className="text-sm font-semibold text-slate-900">
              {formatWeekRange(parseDateKey(weekStartIso))}
            </p>
            <p className="text-xs text-slate-500">{className}</p>
          </div>
          <Link
            href={`/teacher/attendance?classId=${encodeURIComponent(classId)}&week=${nextWeekIso}`}
            prefetch
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            {stats.present} present
          </span>
          <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
            {stats.absent} absent
          </span>
          <Button onClick={handleSave} disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? "Saving…" : "Save week"}
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Check the box if the student was <strong>present</strong> that day. Unchecked =
        absent. Use column &quot;All&quot; to mark everyone present for a day.
      </p>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="sticky left-0 z-10 min-w-[200px] bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700">
                Student
              </th>
              {days.map((d) => (
                <th
                  key={d.key}
                  className="min-w-[88px] border-l border-slate-100 px-2 py-3 text-center"
                >
                  <div className="font-semibold text-slate-700">{d.shortLabel}</div>
                  <div className="text-xs font-normal text-slate-400">
                    {d.date.getDate()}/{d.date.getMonth() + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => markColumn(d.key, true)}
                    className="mt-1 text-xs text-indigo-600 hover:underline"
                  >
                    All ✓
                  </button>
                </th>
              ))}
              <th className="min-w-[72px] border-l border-slate-100 px-2 py-3 text-center text-xs text-slate-500">
                Week
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, rowIdx) => {
              const rowPresent = days.filter((d) => checked[student.id]?.[d.key]).length;
              return (
                <tr
                  key={student.id}
                  className={cn(
                    "border-b border-slate-50 hover:bg-slate-50/80",
                    rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  )}
                >
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5">
                    <div className="font-medium text-slate-900">{student.name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono">{student.studentId}</span>
                      <button
                        type="button"
                        onClick={() => markRow(student.id, true)}
                        className="text-indigo-600 hover:underline"
                      >
                        All week
                      </button>
                    </div>
                  </td>
                  {days.map((d) => {
                    const isPresent = checked[student.id]?.[d.key] ?? false;
                    return (
                      <td
                        key={d.key}
                        className="border-l border-slate-100 px-2 py-2.5 text-center"
                      >
                        <label className="inline-flex cursor-pointer items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isPresent}
                            onChange={() => toggle(student.id, d.key)}
                            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            aria-label={`${student.name} ${d.label} present`}
                          />
                        </label>
                      </td>
                    );
                  })}
                  <td className="border-l border-slate-100 px-2 py-2.5 text-center text-xs font-medium text-slate-600">
                    {rowPresent}/{days.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-medium text-slate-600">
              <td className="sticky left-0 bg-slate-50 px-4 py-2 text-xs">Daily total</td>
              {days.map((d) => {
                const count = students.filter((s) => checked[s.id]?.[d.key]).length;
                return (
                  <td key={d.key} className="border-l border-slate-100 px-2 py-2 text-center text-xs">
                    <span className="inline-flex items-center gap-0.5 text-emerald-700">
                      <Check className="h-3 w-3" />
                      {count}
                    </span>
                  </td>
                );
              })}
              <td className="border-l border-slate-100" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
