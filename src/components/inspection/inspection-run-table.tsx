"use client";

import Link from "next/link";
import type { InspectionRunListItem } from "@/lib/inspection/types";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  FINALIZED: "Finalized",
};

export function InspectionRunTable({
  runs,
  basePath = "/branch/inspection",
}: {
  runs: InspectionRunListItem[];
  basePath?: string;
}) {
  if (runs.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        No inspection sessions yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            {basePath.startsWith("/admin") && (
              <th className="px-4 py-3 font-medium">Branch</th>
            )}
            <th className="px-4 py-3 font-medium">Inspector</th>
            <th className="px-4 py-3 font-medium">Academic year</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {runs.map((run) => (
            <tr key={run.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3">
                {new Date(run.inspectionDate).toLocaleDateString("en-ET", {
                  dateStyle: "medium",
                })}
              </td>
              {basePath.startsWith("/admin") && (
                <td className="px-4 py-3">{run.branchName}</td>
              )}
              <td className="px-4 py-3">{run.inspectorName}</td>
              <td className="px-4 py-3">{run.academicYearName ?? "—"}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {STATUS_LABELS[run.status] ?? run.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {run.overallPercent != null
                  ? `${run.overallPercent}%`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`${basePath}/${run.id}`}>
                    <Button variant="outline" size="sm">
                      {run.status === "FINALIZED" || run.status === "SUBMITTED"
                        ? "View"
                        : "Continue"}
                    </Button>
                  </Link>
                  <Link
                    href={
                      basePath.startsWith("/admin")
                        ? `${basePath}/${run.id}?view=report`
                        : `${basePath}/${run.id}/report`
                    }
                  >
                    <Button variant="ghost" size="sm">Report</Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
