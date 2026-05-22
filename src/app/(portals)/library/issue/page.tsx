import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { LibraryBranchPicker } from "@/components/library/library-branch-picker";
import { LibraryIssueManager } from "@/components/library/library-issue-manager";
import { auth } from "@/lib/auth";
import { LIBRARY_NAV } from "@/lib/nav/library-nav";
import {
  canAccessLibrary,
  defaultDueDateForBorrower,
  getBooksAvailableForIssue,
  getLibraryIssues,
  getLibraryPageBranch,
  getStudentsForLibrary,
  getTeachersForLibrary,
} from "@/lib/services/library";
import { LibraryBorrowerType } from "@prisma/client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LibraryIssuePage({
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

  if (!branchId) {
    return (
      <PortalShell title="Library" nav={LIBRARY_NAV}>
        <p className="text-slate-500">No branch configured.</p>
      </PortalShell>
    );
  }

  const [activeIssues, overdueIssues, students, teachers, books] = await Promise.all([
    getLibraryIssues(branchId, "active"),
    getLibraryIssues(branchId, "overdue"),
    getStudentsForLibrary(branchId),
    getTeachersForLibrary(branchId),
    getBooksAvailableForIssue(branchId),
  ]);

  return (
    <PortalShell
      title="Library"
      subtitle={branch?.name ?? "Lending"}
      nav={LIBRARY_NAV}
    >
      <div className="mb-6">
        <Link href="/library" className="text-sm text-indigo-600 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Issue & return</h1>
        <p className="text-slate-500">
          Lend books to students by ID, track due dates, record returns and late fines.
        </p>
      </div>

      {isSuperAdmin && (
        <LibraryBranchPicker
          branchId={branchId}
          branches={branches}
          basePath="/library/issue"
        />
      )}

      <LibraryIssueManager
        branchId={branchId}
        activeIssues={activeIssues}
        overdueIssues={overdueIssues}
        students={students}
        teachers={teachers}
        books={books}
        defaultDueDate={defaultDueDateForBorrower(5, LibraryBorrowerType.STUDENT)
          .toISOString()
          .slice(0, 10)}
      />
    </PortalShell>
  );
}
