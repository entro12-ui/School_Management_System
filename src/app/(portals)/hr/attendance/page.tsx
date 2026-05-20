import { PortalShell } from "@/components/layout/portal-shell";
import { HrAttendanceManager } from "@/components/hr/hr-attendance-manager";
import { HrBranchPicker } from "@/components/hr/hr-branch-picker";
import { auth } from "@/lib/auth";
import { HR_NAV } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  getHrAccessFlags,
  getHrAttendance,
  getHrEmployees,
  getHrPageBranch,
} from "@/lib/services/hr";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HrAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canAccessHr(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, branch, isSuperAdmin } = await getHrPageBranch(
    session.user.role,
    session.user.branchId,
    params.branchId
  );

  if (!branchId) {
    return (
      <PortalShell title="Human Resources" nav={HR_NAV}>
        <p className="text-slate-500">No branch configured.</p>
      </PortalShell>
    );
  }

  const [records, employees, access] = await Promise.all([
    getHrAttendance(branchId),
    getHrEmployees(branchId),
    getHrAccessFlags(session.user.id, session.user.role),
  ]);

  return (
    <PortalShell title="Human Resources" subtitle={branch?.name} nav={HR_NAV}>
      {isSuperAdmin && (
        <HrBranchPicker branchId={branchId} branches={branches} basePath="/hr/attendance" />
      )}
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Staff attendance</h1>
      <HrAttendanceManager
        records={records}
        employees={employees.map((e) => ({
          id: e.id,
          label: `${e.firstName} ${e.lastName}`,
        }))}
        canWrite={access.attendanceWrite}
      />
    </PortalShell>
  );
}
