import { redirect } from "next/navigation";
import { CalendarDays, UserCheck } from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { ClassScheduleBoard } from "@/components/schedule/class-schedule-board";
import { ClassScheduleManager } from "@/components/schedule/class-schedule-manager";
import { auth } from "@/lib/auth";
import { TEACHER_NAV } from "@/lib/nav/teacher-nav";
import {
  getClassScheduleSetup,
  getTeacherSchedule,
} from "@/lib/services/class-schedule";

export const dynamic = "force-dynamic";

export default async function TeacherSchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getTeacherSchedule(session.user.id);
  if (!data) redirect("/login");

  const setup = data.teacher.isScheduleUnitLeader
    ? await getClassScheduleSetup(data.teacher.branchId)
    : null;

  return (
    <PortalShell
      title="My schedule"
      subtitle={data.teacher.branch.name}
      nav={TEACHER_NAV}
    >
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <CalendarDays className="h-6 w-6 text-indigo-600" />
          Teaching schedule
        </h1>
        <p className="mt-1 text-slate-500">
          Weekly classes assigned to {data.teacher.user.firstName}{" "}
          {data.teacher.user.lastName}.
        </p>
      </div>

      {data.teacher.isScheduleUnitLeader && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <div className="flex items-center gap-2 font-medium">
            <UserCheck className="h-4 w-4" />
            Schedule unit leader access enabled
          </div>
          <p className="mt-1">
            You can prepare class schedules for your branch below. Registrar/admins can add or
            remove unit leader access.
          </p>
        </div>
      )}

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Classes I teach</h2>
          <div className="max-h-[52rem] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-4 overscroll-contain">
            <ClassScheduleBoard
              entries={data.entries}
              mode="teacher"
              title="Teacher weekly schedule sheet"
              subtitle={`${data.teacher.user.firstName} ${data.teacher.user.lastName} · ${data.teacher.branch.name}`}
              emptyMessage={
                data.teacher.isScheduleUnitLeader
                  ? "No lessons assigned to you yet. Use Prepare branch schedules below, or ask the registrar to add slots."
                  : "No class schedule has been assigned to you yet. Contact the registrar if you expected lessons here."
              }
            />
          </div>
        </section>

        {setup && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Prepare branch schedules
            </h2>
            <ClassScheduleManager
              classes={setup.classes}
              teachers={setup.teachers}
              entries={setup.entries}
              canAssignUnitLeader={false}
            />
          </section>
        )}
      </div>
    </PortalShell>
  );
}
