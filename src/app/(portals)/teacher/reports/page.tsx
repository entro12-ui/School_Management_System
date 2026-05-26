import { PortalShell } from "@/components/layout/portal-shell";
import { TeacherReportsPanel } from "@/components/teacher/teacher-reports-panel";
import { auth } from "@/lib/auth";
import { TEACHER_NAV } from "@/lib/nav/teacher-nav";
import { getTeacherReportCards } from "@/lib/services/teacher-reports";
import { getTeacherByUserId } from "@/lib/services/teacher";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) redirect("/login");

  const subjectIds = teacher.staffSubjects.map((s) => s.subjectId);
  const reportData = await getTeacherReportCards(
    teacher.id,
    teacher.branchId,
    subjectIds
  );

  return (
    <PortalShell
      title="Report cards"
      subtitle={teacher.branch.name}
      nav={TEACHER_NAV}
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Report cards</h1>
          <p className="mt-1 max-w-2xl text-slate-500">
            Professional class reports from your weighted grading sheets — one row per
            class and subject, with student rosters, column marks, and total marks.
          </p>
        </div>
        <Link
          href="/teacher/grading"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <ClipboardCheck className="h-4 w-4" />
          Grading
        </Link>
      </div>

      <TeacherReportsPanel data={reportData} />
    </PortalShell>
  );
}
