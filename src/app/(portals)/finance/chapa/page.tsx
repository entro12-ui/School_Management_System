import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { FinanceChapaTransactionsTable } from "@/components/finance/chapa-transactions-table";
import { auth } from "@/lib/auth";
import { navForUser } from "@/lib/nav/portal-nav";
import { canManageFinance } from "@/lib/services/finance";
import {
  getChapaTransactionStats,
  getChapaTransactionsForFinance,
} from "@/lib/services/chapa-transactions";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FinanceChapaPage() {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) redirect("/login");

  const branchId =
    session.user.role === UserRole.SUPER_ADMIN ? undefined : session.user.branchId ?? undefined;

  const [rows, stats] = await Promise.all([
    getChapaTransactionsForFinance(branchId),
    getChapaTransactionStats(branchId),
  ]);

  return (
    <PortalShell
      title={session.user.role === UserRole.BRANCH_ADMIN ? "Branch Admin" : "Finance"}
      subtitle="Chapa online payments"
      nav={navForUser(session.user.role, "finance")}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Chapa transactions</h1>
        <p className="mt-1 max-w-3xl text-slate-500">
          Chapa payments are confirmed automatically — no manual approval like uploaded bank
          receipts. Use this page to audit every Chapa attempt, reference number, and invoice
          status. Semester balances also appear on{" "}
          <Link href="/finance/payments" className="text-indigo-600 hover:underline">
            Student payments
          </Link>
          .
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Successful</p>
          <p className="text-2xl font-bold text-emerald-900">{stats.success}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">Pending</p>
          <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm text-red-800">Failed / cancelled</p>
          <p className="text-2xl font-bold text-red-900">{stats.failed}</p>
        </div>
      </div>

      <FinanceChapaTransactionsTable rows={rows} />
    </PortalShell>
  );
}
