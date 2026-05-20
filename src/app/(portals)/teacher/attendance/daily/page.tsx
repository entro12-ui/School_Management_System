import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { AttendanceTable } from "@/components/teacher/attendance-table";
import { auth } from "@/lib/auth";
import { TEACHER_NAV } from "@/lib/nav/teacher-nav";
import {
  getBranchAttendance,
  getTeacherByUserId,
  getTeacherClassOptions,
} from "@/lib/services/teacher";
import { redirect } from "next/navigation";
import { Field, Select } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function TeacherDailyAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; classId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) redirect("/login");

  const params = await searchParams;
  const dateStr = params.date ?? new Date().toISOString().slice(0, 10);
  const classes = await getTeacherClassOptions(session.user.id);
  const requestedClassId = params.classId;
  const classId =
    requestedClassId && classes.some((c) => c.id === requestedClassId)
      ? requestedClassId
      : classes[0]?.id;

  const date = new Date(dateStr + "T12:00:00");
  const rows = await getBranchAttendance(teacher.branchId, date, classId);

  const present = rows.filter((r) => r.status === "PRESENT").length;
  const absent = rows.filter((r) => r.status === "ABSENT").length;

  return (
    <PortalShell
      title="Daily attendance"
      subtitle={`${teacher.branch.name} · View only`}
      nav={TEACHER_NAV}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily attendance</h1>
          <p className="text-slate-500">Read-only summary for a single day.</p>
        </div>
        <Link
          href="/teacher/attendance"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Weekly sheet
        </Link>
      </div>

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4"
      >
        <Field label="Date">
          <input
            type="date"
            name="date"
            defaultValue={dateStr}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Class">
          {classes.length === 0 ? (
            <p className="text-sm text-slate-500">No classes assigned.</p>
          ) : (
            <Select name="classId" defaultValue={classId ?? ""}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isHomeroom ? " (homeroom)" : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Filter
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
          {present} present
        </span>
        <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
          {absent} absent
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
          {rows.length} students
        </span>
      </div>

      <AttendanceTable rows={rows} />
    </PortalShell>
  );
}
