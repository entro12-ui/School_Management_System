import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { FinancePaymentsTable } from "@/components/finance/payments-table";
import { auth } from "@/lib/auth";
import { navForUser } from "@/lib/nav/portal-nav";
import {
  canManageFinance,
  getFinancePaymentsSheet,
} from "@/lib/services/finance";
import { getPendingPaymentProofs } from "@/lib/services/payment-proofs";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FinancePaymentsPage() {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) redirect("/login");

  const branchId =
    session.user.role === UserRole.SUPER_ADMIN ? undefined : session.user.branchId ?? undefined;

  const [rows, pendingReceipts] = await Promise.all([
    getFinancePaymentsSheet(branchId),
    getPendingPaymentProofs(branchId),
  ]);

  const invoicedCount = rows.filter((r) =>
    r.semesters.some((s) => s.paymentId !== null)
  ).length;

  return (
    <PortalShell
      title={session.user.role === UserRole.BRANCH_ADMIN ? "Branch Admin" : "Finance"}
      subtitle={session.user.branchName ?? "Semester tuition — 5 months per semester"}
      nav={navForUser(session.user.role, "finance")}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Student payments</h1>
        <p className="mt-1 text-slate-500">
          <strong>Cash:</strong> mark paid here when the family pays at the office.{" "}
          <strong>Online:</strong> Chapa payments are auto-confirmed — review them on{" "}
          <Link href="/finance/chapa" className="text-indigo-600 hover:underline">
            Chapa payments
          </Link>
          . Uploaded bank receipts are on{" "}
          <Link href="/finance/receipts" className="text-indigo-600 hover:underline">
            Online receipts
          </Link>
          {pendingReceipts.length > 0 && (
            <span className="font-medium text-amber-700">
              {" "}
              ({pendingReceipts.length} pending)
            </span>
          )}
          .
        </p>
        {rows.length > 0 && invoicedCount === 0 && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            No semester invoices yet — click <strong>Sync Semester 1 invoices</strong> below to
            create them for all students (uses your fee structures).
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="font-medium text-slate-700">No active students</p>
          <p className="mt-2 text-sm text-slate-500">
            Enroll students first, then return here to manage semester payments.
          </p>
        </div>
      ) : (
        <FinancePaymentsTable
          rows={rows}
          showBranch={session.user.role === UserRole.SUPER_ADMIN}
        />
      )}
    </PortalShell>
  );
}
