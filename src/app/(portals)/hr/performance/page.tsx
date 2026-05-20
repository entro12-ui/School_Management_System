import { PortalShell } from "@/components/layout/portal-shell";
import { HrBranchPicker } from "@/components/hr/hr-branch-picker";
import { HrPerformanceManager } from "@/components/hr/hr-performance-manager";
import { auth } from "@/lib/auth";
import { HR_NAV } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  getHrAccessFlags,
  getHrEmployees,
  getHrPageBranch,
  getHrPerformanceReviews,
} from "@/lib/services/hr";
import { serializeHrPerformanceReviews } from "@/lib/hr/serialize";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HrPerformancePage({
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

  const [reviews, employees, access] = await Promise.all([
    getHrPerformanceReviews(branchId),
    getHrEmployees(branchId),
    getHrAccessFlags(session.user.id, session.user.role),
  ]);

  return (
    <PortalShell title="Human Resources" subtitle={branch?.name} nav={HR_NAV}>
      {isSuperAdmin && (
        <HrBranchPicker branchId={branchId} branches={branches} basePath="/hr/performance" />
      )}
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Performance reviews</h1>
      <HrPerformanceManager
        reviews={serializeHrPerformanceReviews(reviews)}
        employees={employees.map((e) => ({
          id: e.id,
          label: `${e.firstName} ${e.lastName}`,
        }))}
        canWrite={access.performanceWrite}
      />
    </PortalShell>
  );
}
