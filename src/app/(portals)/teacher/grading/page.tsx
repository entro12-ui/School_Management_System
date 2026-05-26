import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { WeightedGradingPanel } from "@/components/teacher/weighted-grading-panel";
import { TEACHER_NAV } from "@/lib/nav/teacher-nav";
import { getGradingPageData } from "@/lib/services/grading-page";

export const dynamic = "force-dynamic";

export default async function TeacherGradingPage({
  searchParams,
}: {
  searchParams: Promise<{ subjectId?: string; classId?: string }>;
}) {
  const params = await searchParams;
  const data = await getGradingPageData(params);

  return (
    <PortalShell
      title="Full assessment"
      subtitle={data.teacher.branch.name}
      nav={TEACHER_NAV}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Full assessment</h1>
          <p className="text-slate-500">
            Weighted columns (100 marks total), student marks, and total marks per student.
            Use the left menu to open <strong>Single assessment</strong> for a one-off quiz.
          </p>
        </div>
        <Link
          href="/teacher/reports"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          View report cards →
        </Link>
      </div>

      <WeightedGradingPanel
        subjects={data.subjects}
        classesBySubject={data.classesBySubject}
        studentsByClass={data.studentsByClass}
        initialSheets={data.initialSheets}
        initialSubjectId={data.initialSubjectId}
        initialClassId={data.initialClassId}
      />
    </PortalShell>
  );
}
