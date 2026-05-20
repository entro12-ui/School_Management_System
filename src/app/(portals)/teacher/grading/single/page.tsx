import { PortalShell } from "@/components/layout/portal-shell";
import { GradingPanel } from "@/components/teacher/grading-panel";
import { TEACHER_NAV } from "@/lib/nav/teacher-nav";
import { getGradingPageData } from "@/lib/services/grading-page";

export const dynamic = "force-dynamic";

export default async function TeacherSingleGradingPage({
  searchParams,
}: {
  searchParams: Promise<{ subjectId?: string; classId?: string }>;
}) {
  const params = await searchParams;
  const data = await getGradingPageData(params);

  return (
    <PortalShell
      title="Single assessment"
      subtitle={data.teacher.branch.name}
      nav={TEACHER_NAV}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Single assessment</h1>
        <p className="text-slate-500">
          One quiz or test with weight marks and max score. Use the left menu to open{" "}
          <strong>Full assessment</strong> for the term grading sheet.
        </p>
      </div>

      <GradingPanel
        subjects={data.subjects}
        classesBySubject={data.classesBySubject}
        studentsByClass={data.studentsByClass}
        singleAssessmentsByClass={data.singleAssessmentsByClass}
        initialSubjectId={data.initialSubjectId}
        initialClassId={data.initialClassId}
      />
    </PortalShell>
  );
}
