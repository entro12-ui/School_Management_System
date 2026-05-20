import { PortalShell } from "@/components/layout/portal-shell";
import { HrBranchPicker } from "@/components/hr/hr-branch-picker";
import { HrRecruitmentManager } from "@/components/hr/hr-recruitment-manager";
import { auth } from "@/lib/auth";
import { HR_NAV } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  getHrAccessFlags,
  getHrDepartments,
  getHrPageBranch,
  getHrRecruitment,
} from "@/lib/services/hr";
import { serializeHrCandidates } from "@/lib/hr/serialize";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HrRecruitmentPage({
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

  const [jobs, departments, access] = await Promise.all([
    getHrRecruitment(branchId),
    getHrDepartments(branchId),
    getHrAccessFlags(session.user.id, session.user.role),
  ]);

  return (
    <PortalShell title="Human Resources" subtitle={branch?.name} nav={HR_NAV}>
      {isSuperAdmin && (
        <HrBranchPicker branchId={branchId} branches={branches} basePath="/hr/recruitment" />
      )}
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Recruitment</h1>
      <HrRecruitmentManager
        branchId={branchId}
        jobs={jobs.map((j) => ({
          ...j,
          candidates: serializeHrCandidates(j.candidates),
        }))}
        departments={departments}
        canWrite={access.recruitmentWrite}
      />
    </PortalShell>
  );
}
