import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { ClassScheduleBoard } from "@/components/schedule/class-schedule-board";
import { auth } from "@/lib/auth";
import { STUDENT_NAV } from "@/lib/nav/student-nav";
import { getStudentClassSchedule } from "@/lib/services/class-schedule";
import { formatGradeLevel } from "@/lib/grade-utils";

export const dynamic = "force-dynamic";

export default async function StudentSchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getStudentClassSchedule(session.user.id);
  if (!data) redirect("/login");

  const subtitle = data.student.class
    ? `${data.student.class.name} · ${formatGradeLevel(data.student.class.gradeLevel)}`
    : data.student.branch.name;

  return (
    <PortalShell title="Class schedule" subtitle={subtitle} nav={STUDENT_NAV}>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <CalendarDays className="h-6 w-6 text-indigo-600" />
          My weekly class schedule
        </h1>
        <p className="mt-1 text-slate-500">
          Full day-by-day schedule for{" "}
          {data.student.class ? data.student.class.name : "your assigned class"}.
        </p>
      </div>

      {!data.student.classId ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
          You are not assigned to a class yet. Contact the registrar office.
        </div>
      ) : (
        <ClassScheduleBoard
          entries={data.entries}
          mode="student"
          title="Student weekly class schedule"
          subtitle={subtitle}
          emptyMessage="No weekly schedule has been published for your class yet."
        />
      )}
    </PortalShell>
  );
}
