import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { FeeStructuresManager } from "@/components/finance/fee-structures-manager";
import { FeeStructuresTable } from "@/components/finance/fee-structures-table";
import { auth } from "@/lib/auth";
import { buildBandSemesterMatrix, formatGradeBand } from "@/lib/fee-structures";
import { navForUser } from "@/lib/nav/portal-nav";
import { formatSemesterLabel } from "@/lib/semester-fees";
import { canManageFinance, getFeeStructures } from "@/lib/services/finance";
import { prisma } from "@/lib/prisma";
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
  const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;

  let branchId = session.user.branchId ?? undefined;
  if (isSuperAdmin) {
    branchId = params.branchId;
    if (!branchId) {
      const first = await prisma.branch.findFirst({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true },
      });
      branchId = first?.id;
    }
  }

  if (!branchId) {
    return (
      <PortalShell
        title="Finance"
        subtitle="Fee structures"
        nav={navForUser(session.user.role, "finance")}
      >
        <p className="text-slate-500">No branch configured.</p>
      </PortalShell>
    );
  }

  const [fees, branches, branch] = await Promise.all([
    getFeeStructures(branchId),
    isSuperAdmin
      ? prisma.branch.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true },
    }),
  ]);

  const matrix = buildBandSemesterMatrix(fees);

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
        showBranchPicker={isSuperAdmin}
      />

      {fees.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">All saved records</h2>
          <FeeStructuresTable
            showBranch={isSuperAdmin}
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
