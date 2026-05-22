import { PortalShell } from "@/components/layout/portal-shell";
import { LibraryPublicSearch } from "@/components/library/library-public-search";
import { LibraryBorrowerAccount } from "@/components/library/library-borrower-account";
import { auth } from "@/lib/auth";
import { STUDENT_NAV } from "@/lib/nav/student-nav";
import { GRADE_BAND_OPTIONS } from "@/lib/library/constants";
import { getStudentByUserId } from "@/lib/services/student";
import { searchLibraryBooks } from "@/lib/services/library-portal";
import { getBorrowerLibraryAccount } from "@/lib/services/library-portal";
import { gradeLevelToBand } from "@/lib/grade-utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentLibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const student = await getStudentByUserId(session.user.id);
  if (!student) redirect("/login");

  const [books, account] = await Promise.all([
    searchLibraryBooks({
      branchId: student.branchId,
      gradeLevel: student.gradeLevel,
      gradeBand: gradeLevelToBand(student.gradeLevel),
    }),
    getBorrowerLibraryAccount(session.user.id, student.branchId),
  ]);

  return (
    <PortalShell title="Library" subtitle="Search & borrow" nav={STUDENT_NAV}>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">School library</h1>
      <p className="mb-6 text-slate-500">
        Search books for your grade, reserve unavailable titles, and track your loans.
      </p>

      {account && <LibraryBorrowerAccount account={account} />}

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Search catalog</h2>
      <LibraryPublicSearch
        branchId={student.branchId}
        books={books}
        gradeBands={GRADE_BAND_OPTIONS}
      />
    </PortalShell>
  );
}
