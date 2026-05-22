import { PortalShell } from "@/components/layout/portal-shell";
import { HrAssetsManager } from "@/components/hr/hr-assets-manager";
import { HrBranchPicker } from "@/components/hr/hr-branch-picker";
import { auth } from "@/lib/auth";
import { hrNavForRole } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  getHrAccessFlags,
  getHrAssets,
  getHrPageBranch,
} from "@/lib/services/hr";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HrAssetsPage({
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

  const [assets, access] = await Promise.all([
    getHrAssets(branchId),
    getHrAccessFlags(session.user.id, session.user.role),
  ]);

  return (
    <PortalShell title="Human Resources" subtitle={branch?.name} nav={hrNavForRole(session.user.role)}>
      {isSuperAdmin && (
        <HrBranchPicker branchId={branchId} branches={branches} basePath="/hr/assets" />
      )}
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Assets</h1>
      <HrAssetsManager branchId={branchId} assets={assets} canWrite={access.assetsWrite} />
    </PortalShell>
  );
}
