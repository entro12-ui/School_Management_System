import { PortalShell } from "@/components/layout/portal-shell";
import { HrBranchPicker } from "@/components/hr/hr-branch-picker";
import { HrLeaveManager } from "@/components/hr/hr-leave-manager";
import { auth } from "@/lib/auth";
import { hrNavForRole } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  getHrAccessFlags,
  getHrEmployees,
  getHrLeaveRequests,
  getHrLeaveTypes,
  getHrPageBranch,
} from "@/lib/services/hr";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HrLeavePage({
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
      <PortalShell title="Human Resources" nav={hrNavForRole(session.user.role)}>
        <p className="text-slate-500">No branch configured.</p>
      </PortalShell>
    );
  }

  const [leaveTypes, requests, employees, access] = await Promise.all([
    getHrLeaveTypes(branchId),
    getHrLeaveRequests(branchId),
    getHrEmployees(branchId),
    getHrAccessFlags(session.user.id, session.user.role),
  ]);

  const employeeOpts = employees.map((e) => ({
    id: e.id,
    label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
  }));

  return (
    <PortalShell title="Human Resources" subtitle={branch?.name} nav={hrNavForRole(session.user.role)}>
      {isSuperAdmin && (
        <HrBranchPicker branchId={branchId} branches={branches} basePath="/hr/leave" />
      )}
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Leave management</h1>
      <HrLeaveManager
        branchId={branchId}
        leaveTypes={leaveTypes}
        requests={requests}
        employees={employeeOpts}
        canWrite={access.leaveWrite}
        canApprove={access.leaveApprove}
      />
    </PortalShell>
  );
}
