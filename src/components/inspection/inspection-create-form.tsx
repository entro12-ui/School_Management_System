"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInspectionRun } from "@/lib/actions/inspection";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AcademicYearOption = { id: string; name: string; isCurrent: boolean };

export function InspectionCreateForm({
  branchId,
  academicYears,
}: {
  branchId: string;
  academicYears: AcademicYearOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultYear =
    academicYears.find((y) => y.isCurrent)?.id ?? academicYears[0]?.id ?? "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const result = await createInspectionRun({
      branchId,
      academicYearId: String(form.get("academicYearId") || "") || null,
      inspectionDate: String(form.get("inspectionDate")),
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.runId) {
      router.push(`/branch/inspection/${result.runId}`);
    } else {
      router.refresh();
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">New inspection session</h2>
        <p className="text-sm text-slate-500">
          MOE Internal Inspection Checklist 2017 E.C. — Primary & Middle NG schools
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Inspection date">
          <Input name="inspectionDate" type="date" required defaultValue={today} />
        </Field>

        <Field label="Academic year">
          <Select name="academicYearId" defaultValue={defaultYear}>
            <option value="">— Not linked —</option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}{y.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Start inspection"}
      </Button>
    </form>
  );
}
