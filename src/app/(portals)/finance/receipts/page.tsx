import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { PaymentReceiptsQueue } from "@/components/finance/payment-receipts-queue";
import { auth } from "@/lib/auth";
import { getSchoolDataScope } from "@/lib/auth/school-data-scope";
import { navForUser } from "@/lib/nav/portal-nav";
import { canManageFinance } from "@/lib/services/finance";
import { getPendingPaymentProofs } from "@/lib/services/payment-proofs";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FinanceReceiptsPage() {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) redirect("/login");

  const scope = getSchoolDataScope(session.user);
  const proofs = await getPendingPaymentProofs(scope);

  return (
    <PortalShell
      title={session.user.role === UserRole.BRANCH_ADMIN ? "Branch Admin" : "Finance"}
      subtitle="Online payment receipts"
      nav={navForUser(session.user.role, "finance")}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Online payment receipts</h1>
        <p className="mt-1 text-slate-500">
          Students and parents upload bank receipts here. Review the invoice, then{" "}
          <strong>Approve online payment</strong>. For cash at the office, use{" "}
          <Link href="/finance/payments" className="text-indigo-600 hover:underline">
            Student payments
          </Link>{" "}
          and mark <strong>paid (cash)</strong>.
        </p>
        <p className="mt-2 text-sm font-medium text-amber-800">
          {proofs.length} receipt{proofs.length === 1 ? "" : "s"} awaiting review
        </p>
      </div>

      <PaymentReceiptsQueue proofs={proofs} />
    </PortalShell>
  );
}
