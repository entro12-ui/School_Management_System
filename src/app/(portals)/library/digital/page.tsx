import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { LibraryBranchPicker } from "@/components/library/library-branch-picker";
import { auth } from "@/lib/auth";
import { LIBRARY_NAV } from "@/lib/nav/library-nav";
import { GRADE_BAND_LIBRARY_LABELS } from "@/lib/library/borrowing-rules";
import {
  canAccessLibrary,
  getDigitalLibrary,
  getLibraryPageBranch,
} from "@/lib/services/library";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LibraryDigitalPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canAccessLibrary(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, isSuperAdmin } = await getLibraryPageBranch(session.user, params.branchId);
  if (!branchId) redirect("/library");

  const books = await getDigitalLibrary(branchId);

  return (
    <PortalShell title="Library" subtitle="Digital" nav={LIBRARY_NAV}>
      <Link href="/library" className="text-sm text-indigo-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Digital library</h1>
      <p className="mb-6 text-slate-500">eBooks, PDFs, and online resources — access via link.</p>
      {isSuperAdmin && (
        <LibraryBranchPicker branchId={branchId} branches={branches} basePath="/library/digital" />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {books.length === 0 ? (
          <p className="text-slate-500">No digital titles. Mark books as digital in the catalog.</p>
        ) : (
          books.map((b) => (
            <article key={b.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold">{b.title}</h3>
              {b.author && <p className="text-sm text-slate-500">{b.author}</p>}
              <p className="mt-1 text-xs text-slate-400">
                {b.gradeBand ? GRADE_BAND_LIBRARY_LABELS[b.gradeBand] : "All levels"} ·{" "}
                {b.subject ?? b.category}
              </p>
              {b.digitalUrl ? (
                <a
                  href={b.digitalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline"
                >
                  Open resource →
                </a>
              ) : (
                <p className="mt-2 text-sm text-amber-700">URL not set — ask librarian</p>
              )}
            </article>
          ))
        )}
      </div>
    </PortalShell>
  );
}
