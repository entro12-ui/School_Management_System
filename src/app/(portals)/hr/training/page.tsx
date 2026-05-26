import { PortalShell } from "@/components/layout/portal-shell";
import { HrBranchPicker } from "@/components/hr/hr-branch-picker";
import { HrTrainingManager } from "@/components/hr/hr-training-manager";
import { auth } from "@/lib/auth";
import { hrNavForRole } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  getHrAccessFlags,
  getHrEmployees,
  getHrPageBranch,
  getHrTrainings,
} from "@/lib/services/hr";
import { serializeHrTrainings } from "@/lib/hr/serialize";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HrTrainingPage({
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

  const [trainings, employees, access] = await Promise.all([
    getHrTrainings(branchId),
    getHrEmployees(branchId),
    getHrAccessFlags(session.user.id, session.user.role),
  ]);

  return (
    <PortalShell title="Human Resources" subtitle={branch?.name} nav={hrNavForRole(session.user.role)}>
      {isSuperAdmin && (
        <HrBranchPicker branchId={branchId} branches={branches} basePath="/hr/training" />
      )}
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Training</h1>
      <HrTrainingManager
        branchId={branchId}
        trainings={serializeHrTrainings(trainings)}
        employees={employees.map((e) => ({
          id: e.id,
          label: `${e.firstName} ${e.lastName}`,
        }))}
        canWrite={access.trainingWrite}
      />
    </PortalShell>
  );
}
