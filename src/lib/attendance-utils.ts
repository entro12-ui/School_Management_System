/** Monday 00:00:00 of the week containing `date` */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString) */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD as local noon so weekday math is stable */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export type WeekDay = {
  date: Date;
  key: string;
  label: string;
  shortLabel: string;
};

/** School week: Monday–Friday */
export function getSchoolWeekDays(weekStart: Date): WeekDay[] {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return labels.map((shortLabel, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return {
      date,
      key: toDateKey(date),
      label: date.toLocaleDateString("en-ET", { weekday: "short", month: "short", day: "numeric" }),
      shortLabel,
    };
  });
}

export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(weekStart.getDate() + 4);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${weekStart.toLocaleDateString("en-ET", opts)} – ${end.toLocaleDateString("en-ET", opts)}`;
}

export function addWeeks(weekStart: Date, weeks: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export function presentFromStatus(status: string | null): boolean {
  return status === "PRESENT" || status === "LATE";
}
