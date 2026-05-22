import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { LibraryBranchPicker } from "@/components/library/library-branch-picker";
import { LibraryReservationsManager } from "@/components/library/library-reservations-manager";
import { auth } from "@/lib/auth";
import { LIBRARY_NAV } from "@/lib/nav/library-nav";
import {
  canAccessLibrary,
  getLibraryPageBranch,
  getLibraryReservations,
} from "@/lib/services/library";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LibraryReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canAccessLibrary(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, branch, isSuperAdmin } = await getLibraryPageBranch(
    session.user.role,
    session.user.branchId,
    params.branchId
  );
  if (!branchId) redirect("/library");

  const reservations = await getLibraryReservations(branchId);

  return (
    <PortalShell title="Library" subtitle="Reservations" nav={LIBRARY_NAV}>
      <Link href="/library" className="text-sm text-indigo-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Hold & reservations</h1>
      <p className="mb-6 text-slate-500">
        Students reserve unavailable books; notify when a copy is returned.
      </p>
      {isSuperAdmin && (
        <LibraryBranchPicker branchId={branchId} branches={branches} basePath="/library/reservations" />
      )}
      <LibraryReservationsManager branchId={branchId} reservations={reservations} />
    </PortalShell>
  );
}
