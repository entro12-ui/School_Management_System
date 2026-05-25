import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { DashboardGraphs } from "@/components/dashboard/dashboard-graphs";
import { auth } from "@/lib/auth";
import { REGISTRAR_NAV } from "@/lib/nav/registrar-nav";
import { getRegistrarDashboardCharts } from "@/lib/services/dashboard-charts";
import { redirect } from "next/navigation";
import { CalendarDays, GraduationCap, UserCheck, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RegistrarPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const branchId = session.user.branchId;
  const charts = branchId ? await getRegistrarDashboardCharts(branchId) : [];

  return (
    <PortalShell
      title="Registrar Office"
      subtitle={session.user.branchName ?? "Enrollment"}
      nav={REGISTRAR_NAV}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Registrar office</h1>
        <p className="text-slate-500">
          Enroll students, teachers, parents, and staff. Each person receives a one-time password
          for first sign-in, then sets their own password.
        </p>
      </div>

      {charts.length > 0 && <DashboardGraphs charts={charts} />}

      <div className={`grid gap-4 md:grid-cols-2 ${charts.length > 0 ? "mt-8" : ""}`}>
        <Link
          href="/registrar/enroll"
          className="flex items-center gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-6 transition hover:border-indigo-300"
        >
          <UserCheck className="h-10 w-10 text-indigo-600" />
          <div>
            <h2 className="font-semibold text-slate-900">Enroll new user</h2>
            <p className="text-sm text-slate-600">
              Create student, teacher, finance, librarian, or parent accounts with OTP
            </p>
          </div>
        </Link>
        <Link
          href="/registrar/students"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300"
        >
          <GraduationCap className="h-10 w-10 text-indigo-600" />
          <div>
            <h2 className="font-semibold text-slate-900">Student records</h2>
            <p className="text-sm text-slate-600">
              All students — grades, assessments, GPA, and attendance
            </p>
          </div>
        </Link>
        <Link
          href="/registrar/schedules"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300"
        >
          <CalendarDays className="h-10 w-10 text-indigo-600" />
          <div>
            <h2 className="font-semibold text-slate-900">Class schedules</h2>
            <p className="text-sm text-slate-600">
              Assign unit leaders and prepare weekly class timetables
            </p>
          </div>
        </Link>
        <Link
          href="/registrar/records"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300"
        >
          <Users className="h-10 w-10 text-indigo-600" />
          <div>
            <h2 className="font-semibold text-slate-900">Enrollment sheet</h2>
            <p className="text-sm text-slate-600">
              Search, filter, update, delete — view emails and one-time passwords
            </p>
          </div>
        </Link>
      </div>

      <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
        <Users className="h-4 w-4" />
        Public self-registration is disabled except for registrar office applications.
      </p>
    </PortalShell>
  );
}
