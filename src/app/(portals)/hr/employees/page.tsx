import { PortalShell } from "@/components/layout/portal-shell";
import { HrBranchPicker } from "@/components/hr/hr-branch-picker";
import { HrEmployeesManager } from "@/components/hr/hr-employees-manager";
import { auth } from "@/lib/auth";
import { HR_MANAGER_ROLE_NAME } from "@/lib/hr/permissions";
import { hrNavForRole } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  getHrAccessFlags,
  getHrEmployees,
  getHrPageBranch,
  userIsHrManager,
} from "@/lib/services/hr";
import { ensureStaffDesignationsForBranch } from "@/lib/hr/staff-designations";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HrEmployeesPage({
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

  await ensureStaffDesignationsForBranch(branchId);

  const [employees, subjects, access, isManager] = await Promise.all([
      getHrEmployees(branchId),
      prisma.subject.findMany({
        orderBy: [{ gradeBand: "asc" }, { name: "asc" }],
        select: { id: true, name: true, gradeBand: true },
      }),
      getHrAccessFlags(session.user.id, session.user.role),
      userIsHrManager(session.user.id, session.user.role),
  ]);

  return (
    <PortalShell
      title="Human Resources"
      subtitle={branch?.name ?? "Employees"}
      nav={hrNavForRole(session.user.role)}
    >
      {isManager && (
        <p className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-900">
          You are signed in as <strong>{HR_MANAGER_ROLE_NAME}</strong> — full HR control
          for this branch.
        </p>
      )}

      {isSuperAdmin && (
        <HrBranchPicker branchId={branchId} branches={branches} basePath="/hr/employees" />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
        <p className="text-slate-500">{employees.length} records</p>
      </div>

      <HrEmployeesManager
        branchId={branchId}
        employees={employees.map((e) => ({
          ...e,
          documents: e.documents.map((d) => ({
            id: d.id,
            documentType: d.documentType,
            fileUrl: d.fileUrl,
            expiryDate: d.expiryDate?.toISOString() ?? null,
            createdAt: d.createdAt.toISOString(),
          })),
        }))}
        subjects={subjects}
        canWrite={access.employeesWrite}
      />
    </PortalShell>
  );
}
