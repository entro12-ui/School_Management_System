import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { FeeStructuresManager } from "@/components/finance/fee-structures-manager";
import { FeeStructuresTable } from "@/components/finance/fee-structures-table";
import { auth } from "@/lib/auth";
import { resolveSchoolDataScope } from "@/lib/auth/school-data-scope";
import { resolveOrganizationPageBranch } from "@/lib/auth/super-admin-scope";
import { buildBandSemesterMatrix, formatGradeBand } from "@/lib/fee-structures";
import { navForUser } from "@/lib/nav/portal-nav";
import { formatSemesterLabel } from "@/lib/semester-fees";
import { canManageFinance, getFeeStructures } from "@/lib/services/finance";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function FinanceFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) redirect("/login");

  const params = await searchParams;
  const pageBranch = await resolveOrganizationPageBranch(session.user, params.branchId);

  if (pageBranch.organizationMissing) {
    return (
      <PortalShell
        title="Finance"
        subtitle="Fee structures"
        nav={navForUser(session.user.role, "finance")}
      >
        <p className="text-slate-500">
          Your account is not linked to a school organization. Contact platform support.
        </p>
      </PortalShell>
    );
  }

  const branchId = pageBranch.branchId;
  if (!branchId) {
    return (
      <PortalShell
        title="Finance"
        subtitle="Fee structures"
        nav={navForUser(session.user.role, "finance")}
      >
        <p className="text-slate-500">No branch configured for your school.</p>
      </PortalShell>
    );
  }

  const scope = await resolveSchoolDataScope(session.user, branchId);
  const [fees, branch] = await Promise.all([
    getFeeStructures(scope),
    Promise.resolve(pageBranch.branch),
  ]);

  const matrix = buildBandSemesterMatrix(fees);
  const branches = pageBranch.branches.map(({ id, name }) => ({ id, name }));

  return (
    <PortalShell
      title={session.user.role === UserRole.BRANCH_ADMIN ? "Branch Admin" : "Finance"}
      subtitle={branch?.name ?? session.user.branchName ?? "Fee structures"}
      nav={navForUser(session.user.role, "finance")}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Semester fee structures</h1>
          <p className="mt-1 text-slate-500">
            Tuition per grade band and semester (billed every 5 months). Used when creating
            student invoices.
          </p>
        </div>
        <Link
          href="/finance/payments"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Student payments →
        </Link>
      </div>

      <FeeStructuresManager
        branchId={branchId}
        branches={branches}
        matrix={matrix}
        showBranchPicker={pageBranch.isSuperAdmin}
      />

      {fees.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">All saved records</h2>
          <FeeStructuresTable
            showBranch={pageBranch.isSuperAdmin}
            fees={fees.map((f) => ({
              id: f.id,
              name: f.name,
              branchName: f.branch.name,
              gradeLabel: f.gradeBand
                ? formatGradeBand(f.gradeBand)
                : f.gradeLevel != null
                  ? `Grade ${f.gradeLevel}`
                  : "All grades",
              semesterLabel: f.term ? formatSemesterLabel(f.term) : "Any term",
              amount: Number(f.amount),
            }))}
          />
        </section>
      )}
    </PortalShell>
  );
}
