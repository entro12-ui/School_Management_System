import { PortalShell } from "@/components/layout/portal-shell";
import { ChildTabs } from "@/components/parent/child-tabs";
import { NoChildrenMessage } from "@/components/parent/no-children";
import { ParentAttendanceTable } from "@/components/parent/parent-attendance-table";
import { auth } from "@/lib/auth";
import { PARENT_NAV } from "@/lib/nav/parent-nav";
import {
  getChildAttendanceForParent,
  getChildForParent,
  getChildrenForParent,
} from "@/lib/services/parent";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const { children } = await getChildrenForParent(session.user.id);

  if (children.length === 0) {
    return (
      <PortalShell title="Parent Portal" subtitle="Attendance" nav={PARENT_NAV}>
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Attendance</h1>
        <NoChildrenMessage />
      </PortalShell>
    );
  }

  const childId = params.childId ?? children[0].id;
  const child = await getChildForParent(session.user.id, childId);
  if (!child) redirect("/parent/attendance");

  const { records, summary } = await getChildAttendanceForParent(child.id);

  return (
    <PortalShell
      title="Parent Portal"
      subtitle={`${child.firstName} ${child.lastName}`}
      nav={PARENT_NAV}
    >
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Attendance</h1>
      <p className="mb-6 text-slate-500">Last 90 days for {child.firstName} only</p>

      <ChildTabs linkedChildren={children} activeChildId={child.id} basePath="/parent/attendance" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-800">{summary.present}</p>
          <p className="text-xs text-emerald-700">Present</p>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-800">{summary.absent}</p>
          <p className="text-xs text-red-700">Absent</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-800">{summary.late}</p>
          <p className="text-xs text-amber-700">Late</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{summary.excused}</p>
          <p className="text-xs text-slate-600">Excused</p>
        </div>
      </div>

      {records.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No attendance records yet.
        </p>
      ) : (
        <ParentAttendanceTable
          records={records.map((r) => ({
            id: r.id,
            date: r.date.toISOString(),
            status: r.status,
            checkIn: r.checkIn?.toISOString() ?? null,
          }))}
        />
      )}
    </PortalShell>
  );
}
