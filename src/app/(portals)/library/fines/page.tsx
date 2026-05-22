import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { LibraryFinesManager } from "@/components/library/library-fines-manager";
import { LibraryBranchPicker } from "@/components/library/library-branch-picker";
import { auth } from "@/lib/auth";
import { LIBRARY_NAV } from "@/lib/nav/library-nav";
import {
  canAccessLibrary,
  getLibraryFines,
  getLibraryPageBranch,
} from "@/lib/services/library";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LibraryFinesPage({
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

  const fines = await getLibraryFines(branchId);

  return (
    <PortalShell title="Library" subtitle="Fines" nav={LIBRARY_NAV}>
      <Link href="/library" className="text-sm text-indigo-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Fine management</h1>
      <p className="mb-6 text-slate-500">
        Tiered overdue fines: warning (1–5 days), 50 ETB (6–10 days), higher after 10 days.
        Unpaid fines block new borrowing.
      </p>
      {isSuperAdmin && (
        <LibraryBranchPicker branchId={branchId} branches={branches} basePath="/library/fines" />
      )}
      <LibraryFinesManager branchId={branchId} fines={fines} />
    </PortalShell>
  );
}
