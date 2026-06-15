"use client";

import { useState } from "react";
import {
  finalizeInspectionRun,
  saveInspectionNarrative,
} from "@/lib/actions/inspection";
import type { InspectionScoreSummary } from "@/lib/inspection/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";

export function InspectionReportPanel({
  runId,
  summary,
  initial,
  status,
  isSuperAdmin,
  exportBaseUrl,
}: {
  runId: string;
  summary: InspectionScoreSummary;
  initial: {
    strengths?: string | null;
    gaps?: string | null;
    recommendations?: string | null;
    inspectorComments?: string | null;
    finalOutcome?: string | null;
  };
  status: string;
  isSuperAdmin: boolean;
  exportBaseUrl: string;
}) {
  const [form, setForm] = useState({
    strengths: initial.strengths ?? "",
    gaps: initial.gaps ?? "",
    recommendations: initial.recommendations ?? "",
    inspectorComments: initial.inspectorComments ?? "",
    finalOutcome: initial.finalOutcome ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const readOnly = status === "FINALIZED";

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveInspectionNarrative({ runId, ...form });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setMessage(result.message);
  }

  async function handleFinalize() {
    setSaving(true);
    const result = await finalizeInspectionRun(runId);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance summary</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Overall</p>
            <p className="text-xl font-bold">{summary.overallPercent}%</p>
          </div>
          {summary.domains.map((d) => (
            <div key={d.code} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{d.titleEn}</p>
              <p className="text-xl font-bold">{d.percent}%</p>
              <p className="text-xs text-slate-400">{d.weightPercent}% weight</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Report narrative</h2>

        {[
          { key: "strengths" as const, label: "Strength areas" },
          { key: "gaps" as const, label: "Identified gaps and weaknesses" },
          { key: "recommendations" as const, label: "Recommendations" },
          { key: "inspectorComments" as const, label: "Inspector comments" },
          { key: "finalOutcome" as const, label: "Final inspection outcome" },
        ].map(({ key, label }) => (
          <Field key={key} label={label}>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[80px]"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              readOnly={readOnly}
            />
          </Field>
        ))}

        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save narrative"}
            </Button>
            {message && <span className="text-sm text-emerald-600">{message}</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Export report</h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={`${exportBaseUrl}?format=html`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">Open HTML / Print PDF</Button>
          </a>
          <a href={`${exportBaseUrl}?format=csv`}>
            <Button variant="outline">Download CSV</Button>
          </a>
          <a href={`${exportBaseUrl}?format=docx`}>
            <Button variant="outline">Download DOCX</Button>
          </a>
        </div>
      </div>

      {isSuperAdmin && status === "SUBMITTED" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900 mb-3">
            As ministry supervisor, you can finalize this inspection to lock the record.
          </p>
          <Button onClick={handleFinalize} disabled={saving}>
            Finalize inspection
          </Button>
        </div>
      )}
    </div>
  );
}
