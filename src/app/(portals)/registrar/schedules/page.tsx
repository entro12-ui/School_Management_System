import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { CalendarDays } from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { ClassScheduleManager } from "@/components/schedule/class-schedule-manager";
import { auth } from "@/lib/auth";
import { navForUser } from "@/lib/nav/portal-nav";
import {
  getClassScheduleSetup,
  getSchedulePageBranch,
} from "@/lib/services/class-schedule";

export const dynamic = "force-dynamic";

const MANAGE_ROLES: UserRole[] = [
  UserRole.REGISTRAR,
  UserRole.BRANCH_ADMIN,
  UserRole.SUPER_ADMIN,
];

export default async function RegistrarSchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !MANAGE_ROLES.includes(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, branch, isSuperAdmin } = await getSchedulePageBranch(
    session.user.role,
    session.user.branchId,
    params.branchId
  );

  const setup = branchId
    ? await getClassScheduleSetup(branchId)
    : { classes: [], teachers: [], entries: [] };

  return (
    <PortalShell
      title="Class schedules"
      subtitle={branch?.name ?? session.user.branchName ?? "Select branch"}
      nav={navForUser(session.user.role, "registrar")}
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <CalendarDays className="h-6 w-6 text-indigo-600" />
            Class schedule preparation
          </h1>
          <p className="mt-1 max-w-3xl text-slate-500">
            Assign teacher unit leaders, then prepare the weekly timetable for every class. Teachers
            and students see the schedule automatically in their portals.
          </p>
        </div>
        <Link
          href="/registrar/enroll"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Enroll teacher
        </Link>
      </div>

      {isSuperAdmin && branches.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {branches.map((item) => (
            <Link
              key={item.id}
              href={`/registrar/schedules?branchId=${item.id}`}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                item.id === branchId
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}

      {!branchId ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
          Create or select an active branch before preparing schedules.
        </div>
      ) : (
        <ClassScheduleManager
          classes={setup.classes}
          teachers={setup.teachers}
          entries={setup.entries}
          canAssignUnitLeader
        />
      )}
    </PortalShell>
  );
}
