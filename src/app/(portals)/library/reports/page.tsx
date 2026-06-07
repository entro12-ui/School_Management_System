import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { LibraryBranchPicker } from "@/components/library/library-branch-picker";
import { auth } from "@/lib/auth";
import { LIBRARY_NAV } from "@/lib/nav/library-nav";
import {
  canAccessLibrary,
  getLibraryPageBranch,
} from "@/lib/services/library";
import {
  getLibraryReportSummary,
  getReadingStatsByGrade,
} from "@/lib/services/library-reports";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LibraryReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canAccessLibrary(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, isSuperAdmin } = await getLibraryPageBranch(session.user, params.branchId);
  if (!branchId) redirect("/library");

  const [report, readingByGrade] = await Promise.all([
    getLibraryReportSummary(branchId),
    getReadingStatsByGrade(branchId),
  ]);

  return (
    <PortalShell title="Library" subtitle="Reports" nav={LIBRARY_NAV}>
      <Link href="/library" className="text-sm text-indigo-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Reports & analytics</h1>

      {isSuperAdmin && (
        <LibraryBranchPicker branchId={branchId} branches={branches} basePath="/library/reports" />
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Most borrowed</h2>
          <ul className="space-y-2 text-sm">
            {report.mostBorrowed.map((b) => (
              <li key={b.bookId} className="flex justify-between">
                <span>{b.title}</span>
                <span className="font-medium text-indigo-700">{b.count} loans</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Active readers</h2>
          <ul className="space-y-2 text-sm">
            {report.activeReaders.map((r, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {r.name} ({r.role})
                </span>
                <span className="font-medium">{r.loans} returns</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-red-700">Overdue ({report.overdue.length})</h2>
          {report.overdue.length === 0 ? (
            <p className="text-sm text-slate-500">No overdue books.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {report.overdue.map((o, i) => (
                <li key={i}>
                  {o.bookTitle} — {o.borrowerName} ({o.studentCode}) — due{" "}
                  {new Date(o.dueDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Inventory by grade band</h2>
          <ul className="space-y-2 text-sm">
            {report.inventoryByBand.map((g) => (
              <li key={g.gradeBand} className="flex justify-between">
                <span>{g.gradeBand}</span>
                <span>{g.count} titles</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-500">Lost books: {report.lostBooks}</p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">Reading program (by grade)</h2>
          <ul className="space-y-2 text-sm">
            {readingByGrade.map((g) => (
              <li key={g.gradeLevel} className="flex justify-between">
                <span>{g.gradeLabel}</span>
                <span>{g.booksRead} books logged</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
