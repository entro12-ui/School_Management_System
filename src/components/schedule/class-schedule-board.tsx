import type { ClassScheduleDay } from "@prisma/client";
import {
  CLASS_SCHEDULE_DAY_LABELS,
  CLASS_SCHEDULE_DAYS,
  type ClassScheduleEntryRow,
} from "@/lib/services/class-schedule";

export function ClassScheduleBoard({
  entries,
  mode = "class",
  emptyMessage = "No schedule entries yet.",
  title = "Weekly class schedule",
  subtitle,
  periods,
}: {
  entries: ClassScheduleEntryRow[];
  mode?: "class" | "teacher" | "student";
  emptyMessage?: string;
  title?: string;
  subtitle?: string;
  periods?: number[];
}) {
  if (entries.length === 0 && (!periods || periods.length === 0)) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const byDay = new Map<ClassScheduleDay, ClassScheduleEntryRow[]>();
  for (const day of CLASS_SCHEDULE_DAYS) byDay.set(day, []);
  for (const entry of entries) byDay.get(entry.day)?.push(entry);

  const sheetPeriods =
    periods && periods.length > 0
      ? periods
      : [...new Set(entries.map((entry) => entry.period))].sort((a, b) => a - b);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-5 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
          Professional timetable sheet
        </p>
        <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && <p className="text-sm text-slate-300">{subtitle}</p>}
          </div>
          <p className="text-xs text-slate-300">
            {entries.length} lesson{entries.length === 1 ? "" : "s"} · {sheetPeriods.length} period
            {sheetPeriods.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
              <th className="sticky left-0 top-0 z-30 w-32 border border-slate-200 bg-slate-100 px-4 py-3 font-bold">
                Day
              </th>
              {sheetPeriods.map((period) => (
                <th
                  key={period}
                  className="sticky top-0 z-20 min-w-[10rem] border border-slate-200 bg-slate-100 px-4 py-3 font-bold"
                >
                  Period {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLASS_SCHEDULE_DAYS.map((day) => (
              <tr key={day} className="align-top">
                <th className="sticky left-0 z-10 border border-slate-200 bg-slate-50 px-4 py-4 text-left font-bold text-slate-900 shadow-[1px_0_0_#e2e8f0]">
                  {CLASS_SCHEDULE_DAY_LABELS[day]}
                  <p className="mt-1 text-xs font-normal text-slate-500">
                    {(byDay.get(day) ?? []).length} lesson
                    {(byDay.get(day) ?? []).length === 1 ? "" : "s"}
                  </p>
                </th>
                {sheetPeriods.map((period) => {
                  const slots = (byDay.get(day) ?? []).filter(
                    (entry) => entry.period === period
                  );
                  return (
                    <td key={`${day}-${period}`} className="border border-slate-200 p-2">
                      {slots.length === 0 ? (
                        <div className="flex min-h-[7rem] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 text-xs text-slate-300">
                          Free
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {slots.map((entry) => (
                            <div
                              key={entry.id}
                              className="min-h-[7rem] rounded-lg border border-indigo-100 bg-indigo-50/70 p-3"
                            >
                              <p className="font-bold leading-snug text-slate-950">
                                {entry.subjectName}
                              </p>
                              <p className="mt-1 text-xs font-medium text-indigo-800">
                                {secondaryLine(entry, mode)}
                              </p>
                              {(entry.startTime || entry.endTime || entry.room) && (
                                <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                                  {(entry.startTime || entry.endTime) && (
                                    <p>
                                      Time: {entry.startTime ?? "--:--"} -{" "}
                                      {entry.endTime ?? "--:--"}
                                    </p>
                                  )}
                                  {entry.room && <p>Room: {entry.room}</p>}
                                </div>
                              )}
                              {entry.notes && (
                                <p className="mt-2 border-t border-indigo-100 pt-2 text-xs text-slate-500">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function secondaryLine(entry: ClassScheduleEntryRow, mode: "class" | "teacher" | "student") {
  if (mode === "teacher") return `${entry.className} · ${entry.gradeLabel}`;
  if (mode === "student") return entry.teacherName;
  return `${entry.className} · ${entry.gradeLabel} · ${entry.teacherName}`;
}
