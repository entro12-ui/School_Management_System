import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layout/portal-shell";
import { HrBranchPicker } from "@/components/hr/hr-branch-picker";
import { HrEmployeeIdCardGenerator } from "@/components/hr/hr-employee-id-card-generator";
import { auth } from "@/lib/auth";
import { hrNavForRole } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  getGeneratedHrEmployeeIdCards,
  getHrEmployeesForIdCards,
  getHrPageBranch,
} from "@/lib/services/hr";

export const dynamic = "force-dynamic";

export default async function HrEmployeeIdCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canAccessHr(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, branch, isSuperAdmin } = await getHrPageBranch(session.user, params.branchId);

  if (!branchId) {
    return (
      <PortalShell title="Human Resources" nav={hrNavForRole(session.user.role)}>
        <p className="text-slate-500">No branch configured.</p>
      </PortalShell>
    );
  }

  const [employees, generatedCards] = await Promise.all([
    getHrEmployeesForIdCards(branchId),
    getGeneratedHrEmployeeIdCards(branchId),
  ]);

  return (
    <PortalShell
      title="Human Resources"
      subtitle={branch?.name ?? "Employee ID cards"}
      nav={hrNavForRole(session.user.role)}
    >
      {isSuperAdmin && (
        <HrBranchPicker branchId={branchId} branches={branches} basePath="/hr/id-cards" />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Generate employee ID cards</h1>
        <p className="text-slate-500">
          Create, track, view, and print employee identity cards using HR employee records.
        </p>
      </div>

      <HrEmployeeIdCardGenerator
        employees={employees}
        generatedCards={generatedCards}
        showBranch={isSuperAdmin}
      />
    </PortalShell>
  );
}
