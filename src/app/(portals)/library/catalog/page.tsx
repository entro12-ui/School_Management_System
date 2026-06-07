import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { LibraryBranchPicker } from "@/components/library/library-branch-picker";
import { LibraryCatalogManager } from "@/components/library/library-catalog-manager";
import { auth } from "@/lib/auth";
import { LIBRARY_NAV } from "@/lib/nav/library-nav";
import {
  canAccessLibrary,
  getLibraryCatalog,
  getLibraryPageBranch,
} from "@/lib/services/library";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LibraryCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canAccessLibrary(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, branch, isSuperAdmin } = await getLibraryPageBranch(session.user, params.branchId);

  if (!branchId) {
    return (
      <PortalShell title="Library" nav={LIBRARY_NAV}>
        <p className="text-slate-500">No branch configured.</p>
      </PortalShell>
    );
  }

  const books = await getLibraryCatalog(branchId);

  return (
    <PortalShell
      title="Library"
      subtitle={branch?.name ?? "Catalog"}
      nav={LIBRARY_NAV}
    >
      <div className="mb-6">
        <Link href="/library" className="text-sm text-indigo-600 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Book catalog</h1>
        <p className="text-slate-500">
          Manage physical and digital titles — ISBN, category, and copy counts.
        </p>
      </div>

      {isSuperAdmin && (
        <LibraryBranchPicker
          branchId={branchId}
          branches={branches}
          basePath="/library/catalog"
        />
      )}

      <LibraryCatalogManager branchId={branchId} books={books} />
    </PortalShell>
  );
}
