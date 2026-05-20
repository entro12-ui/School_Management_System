import { PortalShell } from "@/components/layout/portal-shell";
import { HrBranchPicker } from "@/components/hr/hr-branch-picker";
import { HrPayrollManager } from "@/components/hr/hr-payroll-manager";
import { auth } from "@/lib/auth";
import { HR_NAV } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  getHrAccessFlags,
  getHrEmployees,
  getHrPageBranch,
  getHrPayrollData,
} from "@/lib/services/hr";
import {
  serializeHrPayrollRecords,
  serializeHrSalaries,
} from "@/lib/hr/serialize";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function payrollMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function HrPayrollPage({
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

  const [payroll, employees, access] = await Promise.all([
    getHrPayrollData(branchId),
    getHrEmployees(branchId),
    getHrAccessFlags(session.user.id, session.user.role),
  ]);

  return (
    <PortalShell title="Human Resources" subtitle={branch?.name} nav={HR_NAV}>
      {isSuperAdmin && (
        <HrBranchPicker branchId={branchId} branches={branches} basePath="/hr/payroll" />
      )}
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Payroll</h1>
      <HrPayrollManager
        branchId={branchId}
        salaries={serializeHrSalaries(payroll.salaries)}
        records={serializeHrPayrollRecords(payroll.records)}
        employees={employees.map((e) => ({
          id: e.id,
          label: `${e.firstName} ${e.lastName}`,
        }))}
        payrollMonth={payrollMonth()}
        canWrite={access.payrollWrite}
        canRun={access.payrollRun}
      />
    </PortalShell>
  );
}
