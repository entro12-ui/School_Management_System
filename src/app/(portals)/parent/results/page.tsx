import { PortalShell } from "@/components/layout/portal-shell";
import { ChildTabs } from "@/components/parent/child-tabs";
import { NoChildrenMessage } from "@/components/parent/no-children";
import { ParentGradesTable } from "@/components/parent/parent-grades-table";
import { auth } from "@/lib/auth";
import { PARENT_NAV } from "@/lib/nav/parent-nav";
import {
  getChildForParent,
  getChildResultsSummary,
  getChildrenForParent,
} from "@/lib/services/parent";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ParentResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const { children } = await getChildrenForParent(session.user.id);

  if (children.length === 0) {
    return (
      <PortalShell title="Parent Portal" subtitle="Results" nav={PARENT_NAV}>
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Results</h1>
        <NoChildrenMessage />
      </PortalShell>
    );
  }

  const childId = params.childId ?? children[0].id;
  const child = await getChildForParent(session.user.id, childId);
  if (!child) redirect("/parent/results");

  const { grades, gpaRecords, computedGpa, showGpa } = await getChildResultsSummary(
    child.id,
    child.gradeBand,
    child.gradeLevel,
    child.classId
  );

  return (
    <PortalShell
      title="Parent Portal"
      subtitle={`${child.firstName} ${child.lastName}`}
      nav={PARENT_NAV}
    >
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Results & grades</h1>
      <p className="mb-6 text-slate-500">
        Assessment scores for {child.firstName} only — {child.gradeLabel}, {child.className}
      </p>

      <ChildTabs linkedChildren={children} activeChildId={child.id} basePath="/parent/results" />

      {showGpa && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-indigo-800">Estimated GPA</p>
            <p className="mt-1 text-3xl font-bold text-indigo-900">
              {computedGpa != null ? computedGpa.toFixed(2) : "—"}
            </p>
          </div>
          {gpaRecords[0] && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Official record</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {gpaRecords[0].gpa.toFixed(2)}
              </p>
              <p className="text-xs text-slate-400">
                {gpaRecords[0].term.replace("_", " ")} · {gpaRecords[0].yearLabel}
              </p>
            </div>
          )}
        </div>
      )}

      {grades.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No grades recorded yet for {child.firstName}.
        </p>
      ) : (
        <ParentGradesTable
          grades={grades.map((g) => ({
            id: g.id,
            title: g.title,
            subject: g.subject,
            type: g.type,
            score: g.score,
            maxScore: g.maxScore,
            marksEarned: g.percent,
            date: g.date.toISOString(),
          }))}
        />
      )}
    </PortalShell>
  );
}
