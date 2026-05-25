"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ClassScheduleBoard } from "@/components/schedule/class-schedule-board";
import {
  createClassScheduleEntry,
  deleteClassScheduleEntry,
  setScheduleUnitLeader,
} from "@/lib/actions/class-schedule";
import {
  CLASS_SCHEDULE_DAY_LABELS,
  CLASS_SCHEDULE_DAYS,
  type ClassScheduleEntryRow,
  type ScheduleClassOption,
  type ScheduleTeacherOption,
} from "@/lib/services/class-schedule";
import { formatGradeLevel } from "@/lib/grade-utils";

export function ClassScheduleManager({
  classes,
  teachers,
  entries,
  canAssignUnitLeader,
}: {
  classes: ScheduleClassOption[];
  teachers: ScheduleTeacherOption[];
  entries: ClassScheduleEntryRow[];
  canAssignUnitLeader: boolean;
}) {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedClass = classes.find((klass) => klass.id === selectedClassId) ?? null;
  const subjectOptions = selectedClass?.subjects ?? [];
  const teacherOptions = useMemo(() => {
    if (!selectedSubjectId) return teachers;
    return teachers.filter((teacher) => teacher.subjectIds.includes(selectedSubjectId));
  }, [selectedSubjectId, teachers]);
  const sheetPeriods = useMemo(() => {
    const maxPeriod = Math.max(8, ...entries.map((entry) => entry.period));
    return Array.from({ length: maxPeriod }, (_, index) => index + 1);
  }, [entries]);
  const scheduledClassIds = useMemo(
    () => new Set(entries.map((entry) => entry.classId)),
    [entries]
  );

  function run(action: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setMessage(result.message ?? "Saved.");
        router.refresh();
      } else {
        setError(result.error ?? "Action failed.");
      }
    });
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    run(async () => {
      const result = await createClassScheduleEntry(formData);
      if (result.success) {
        form.reset();
        setSelectedClassId("");
        setSelectedSubjectId("");
      }
      return result;
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      )}

      {canAssignUnitLeader && (
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-white p-2 text-indigo-600 shadow-sm">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Assign schedule unit leaders</h2>
              <p className="text-sm text-slate-600">
                A unit leader is still a teacher, but can prepare class schedules from the teacher
                portal.
              </p>
            </div>
          </div>
          {teachers.length === 0 ? (
            <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-500">
              No teachers registered yet.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/80 bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">{teacher.name}</p>
                    <p className="text-xs text-slate-500">
                      {teacher.employeeId} · {teacher.email}
                    </p>
                    {teacher.isScheduleUnitLeader && (
                      <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Unit leader
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={teacher.isScheduleUnitLeader ? "outline" : "default"}
                    disabled={pending}
                    onClick={() =>
                      run(() => setScheduleUnitLeader(teacher.id, !teacher.isScheduleUnitLeader))
                    }
                  >
                    {teacher.isScheduleUnitLeader ? "Remove" : "Assign"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Prepare class schedule</h2>
            <p className="text-sm text-slate-500">
              Choose a class, subject, teacher, day, and period. Conflicts are blocked
              automatically.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="grid gap-4 lg:grid-cols-3">
          <Field label="Class *">
            <Select
              name="classId"
              required
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSubjectId("");
              }}
            >
              <option value="">Select class</option>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name} · {formatGradeLevel(klass.gradeLevel)} · {klass.academicYear}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Subject *">
            <Select
              name="subjectId"
              required
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">Select subject</option>
              {subjectOptions.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Teacher *">
            <Select name="teacherId" required disabled={!selectedSubjectId}>
              <option value="">Select teacher</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} · {teacher.employeeId}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Day *">
            <Select name="day" required defaultValue="">
              <option value="">Select day</option>
              {CLASS_SCHEDULE_DAYS.map((day) => (
                <option key={day} value={day}>
                  {CLASS_SCHEDULE_DAY_LABELS[day]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Period *">
            <Input name="period" type="number" min={1} max={12} required placeholder="1" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <Input name="startTime" type="time" />
            </Field>
            <Field label="End">
              <Input name="endTime" type="time" />
            </Field>
          </div>

          <Field label="Room">
            <Input name="room" placeholder="Optional" />
          </Field>

          <Field label="Notes">
            <Input name="notes" placeholder="Optional" />
          </Field>

          <div className="flex items-end">
            <Button type="submit" disabled={pending || classes.length === 0 || teachers.length === 0}>
              {pending ? "Saving..." : "Add schedule"}
            </Button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Generated class schedules</h2>
          <p className="text-sm text-slate-500">
            {entries.length} schedule slot{entries.length === 1 ? "" : "s"} prepared.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Day / Period</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Teacher</th>
                <th className="px-4 py-3 font-medium">Time / Room</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No schedules prepared yet. Use the form above to add the weekly plan.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{entry.dayLabel}</p>
                      <p className="text-xs text-slate-500">Period {entry.period}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {entry.className}
                      <p className="text-xs text-slate-400">{entry.gradeLabel}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {entry.subjectName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.teacherName}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {entry.startTime || entry.endTime ? (
                        <span>
                          {entry.startTime ?? "--:--"} - {entry.endTime ?? "--:--"}
                        </span>
                      ) : (
                        <span className="text-slate-400">No time set</span>
                      )}
                      {entry.room && <p className="text-xs text-slate-400">Room {entry.room}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => run(() => deleteClassScheduleEntry(entry.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Professional schedule sheet
        </h2>
        <ClassScheduleBoard
          entries={entries}
          mode="class"
          title="Branch weekly schedule sheet"
          subtitle="Prepared timetable for classes, teachers, rooms, and periods"
          periods={sheetPeriods}
          emptyMessage="No schedules prepared yet. Use the form above to create the sheet."
        />
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            All class schedule sheets
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Construct and review one complete weekly sheet for every class. Blank cells show free
            periods; classes without entries are still listed so the assigned unit leader can finish
            them.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total classes
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{classes.length}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Classes scheduled
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {scheduledClassIds.size}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Need schedule
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {Math.max(classes.length - scheduledClassIds.size, 0)}
              </p>
            </div>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
            No classes found for this branch.
          </div>
        ) : (
          classes.map((klass) => {
            const classEntries = entries.filter((entry) => entry.classId === klass.id);
            return (
              <ClassScheduleBoard
                key={klass.id}
                entries={classEntries}
                mode="student"
                title={`${klass.name} schedule sheet`}
                subtitle={`${formatGradeLevel(klass.gradeLevel)} · ${klass.academicYear}`}
                periods={sheetPeriods}
                emptyMessage="No schedule entries yet for this class."
              />
            );
          })
        )}
      </section>
    </div>
  );
}
