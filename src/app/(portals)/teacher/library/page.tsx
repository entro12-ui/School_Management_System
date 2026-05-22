import { PortalShell } from "@/components/layout/portal-shell";
import { LibraryPublicSearch } from "@/components/library/library-public-search";
import { LibraryBorrowerAccount } from "@/components/library/library-borrower-account";
import { auth } from "@/lib/auth";
import { TEACHER_NAV } from "@/lib/nav/teacher-nav";
import { GRADE_BAND_OPTIONS } from "@/lib/library/constants";
import {
  getBorrowerLibraryAccount,
  searchLibraryBooks,
} from "@/lib/services/library-portal";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeacherLibraryPage() {
  const session = await auth();
  if (!session?.user?.branchId) redirect("/login");

  const branchId = session.user.branchId;
  const [books, account] = await Promise.all([
    searchLibraryBooks({ branchId }),
    getBorrowerLibraryAccount(session.user.id, branchId),
  ]);

  return (
    <PortalShell title="Library" subtitle="Search & account" nav={TEACHER_NAV}>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Library</h1>
      <p className="mb-6 text-slate-500">
        Search resources for your classes. Borrow up to 10 books for 30 days at the library desk.
      </p>
      {account && <LibraryBorrowerAccount account={account} />}
      <LibraryPublicSearch
        branchId={branchId}
        books={books}
        gradeBands={GRADE_BAND_OPTIONS}
        showReserve
      />
    </PortalShell>
  );
}
