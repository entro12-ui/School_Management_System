import { PortalShell } from "@/components/layout/portal-shell";
import { HrBranchPicker } from "@/components/hr/hr-branch-picker";
import { HrDepartmentsManager } from "@/components/hr/hr-departments-manager";
import { auth } from "@/lib/auth";
import { HR_NAV } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  getHrAccessFlags,
  getHrDepartments,
  getHrDesignations,
  getHrPageBranch,
} from "@/lib/services/hr";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HrDepartmentsPage({
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

  const [departments, designations, access] = await Promise.all([
    getHrDepartments(branchId),
    getHrDesignations(branchId),
    getHrAccessFlags(session.user.id, session.user.role),
  ]);

  return (
    <PortalShell title="Human Resources" subtitle={branch?.name} nav={HR_NAV}>
      {isSuperAdmin && (
        <HrBranchPicker branchId={branchId} branches={branches} basePath="/hr/departments" />
      )}
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Departments & designations</h1>
      <HrDepartmentsManager
        branchId={branchId}
        departments={departments}
        designations={designations}
        canWrite={access.departmentsWrite}
      />
    </PortalShell>
  );
}
