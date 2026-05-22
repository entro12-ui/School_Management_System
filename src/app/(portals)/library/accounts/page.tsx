import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { LibraryBranchPicker } from "@/components/library/library-branch-picker";
import { auth } from "@/lib/auth";
import { LIBRARY_NAV } from "@/lib/nav/library-nav";
import {
  canAccessLibrary,
  getLibraryAccounts,
  getLibraryPageBranch,
} from "@/lib/services/library";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LibraryAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canAccessLibrary(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, isSuperAdmin } = await getLibraryPageBranch(
    session.user.role,
    session.user.branchId,
    params.branchId
  );
  if (!branchId) redirect("/library");

  const accounts = await getLibraryAccounts(branchId);

  return (
    <PortalShell title="Library" subtitle="Accounts" nav={LIBRARY_NAV}>
      <Link href="/library" className="text-sm text-indigo-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Borrower accounts</h1>
      <p className="mb-6 text-slate-500">Students and staff with books currently on loan.</p>
      {isSuperAdmin && (
        <LibraryBranchPicker branchId={branchId} branches={branches} basePath="/library/accounts" />
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">ID / Class</th>
              <th className="px-4 py-3 font-medium">Active loans</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No active borrowers.
                </td>
              </tr>
            ) : (
              accounts.map((a) => (
                <tr key={a.userId}>
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3">{a.role}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {a.studentCode ?? "—"}
                    {a.className ? ` · ${a.className}` : ""}
                  </td>
                  <td className="px-4 py-3 font-medium text-indigo-700">{a.activeLoans}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
