import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { WeeklyAttendanceSheet } from "@/components/teacher/weekly-attendance-sheet";
import { auth } from "@/lib/auth";
import { TEACHER_NAV } from "@/lib/nav/teacher-nav";
import {
  addWeeks,
  getWeekStart,
  parseDateKey,
  toDateKey,
} from "@/lib/attendance-utils";
import { getWeeklyAttendanceSheet } from "@/lib/services/attendance";
import { getTeacherByUserId, getTeacherClassOptions } from "@/lib/services/teacher";
import { redirect } from "next/navigation";
import { Field, Select } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; week?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) redirect("/login");

  const params = await searchParams;

  const classes = await getTeacherClassOptions(session.user.id);

  const requestedClassId = params.classId;
  const classId =
    requestedClassId && classes.some((c) => c.id === requestedClassId)
      ? requestedClassId
      : classes[0]?.id;
  if (!classId) {
    return (
      <PortalShell
        title="Weekly attendance"
        subtitle={teacher.branch.name}
        nav={TEACHER_NAV}
      >
        <p className="text-slate-500">
          No classes linked to your subjects or homeroom. Contact your branch admin.
        </p>
      </PortalShell>
    );
  }

  const weekStart = params.week
    ? getWeekStart(parseDateKey(params.week))
    : getWeekStart(new Date());

  const weekStartIso = toDateKey(weekStart);
  const prevWeekIso = toDateKey(addWeeks(weekStart, -1));
  const nextWeekIso = toDateKey(addWeeks(weekStart, 1));

  const sheet = await getWeeklyAttendanceSheet(
    teacher.branchId,
    classId,
    weekStart
  );

  return (
    <PortalShell
      title="Weekly attendance sheet"
      subtitle={teacher.branch.name}
      nav={TEACHER_NAV}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Weekly attendance sheet</h1>
          <p className="text-slate-500">
            Mark each student present with a checkbox for Mon–Fri, then save the week.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href={`/teacher/attendance/daily?classId=${classId}`}
            className="font-medium text-indigo-600 hover:underline"
          >
            Daily view →
          </Link>
          <Link
            href="/teacher/classes"
            className="font-medium text-indigo-600 hover:underline"
          >
            My classes →
          </Link>
        </div>
      </div>

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4"
      >
        <Field label="Class">
          <Select name="classId" defaultValue={classId}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isHomeroom ? " (homeroom)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        <input type="hidden" name="week" value={weekStartIso} />
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        >
          Load class
        </button>
      </form>

      {sheet.class && (
        <WeeklyAttendanceSheet
          key={`${classId}-${weekStartIso}`}
          classId={classId}
          className={sheet.class.name}
          weekStartIso={weekStartIso}
          prevWeekIso={prevWeekIso}
          nextWeekIso={nextWeekIso}
          students={sheet.students}
          days={sheet.days}
          grid={sheet.grid}
        />
      )}
    </PortalShell>
  );
}
