"use client";

import { useMemo, useState, useTransition } from "react";
import { AcademicTerm, GradeBand } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import {
  applyDefaultBandSemesterFees,
  saveBandSemesterFees,
} from "@/lib/actions/finance-fees";
import {
  DEFAULT_SEMESTER_AMOUNTS,
  GRADE_BAND_ORDER,
  type BandSemesterFees,
} from "@/lib/fee-structures";
import { SEMESTER_DURATION_MONTHS } from "@/lib/semester-fees";
import { formatCurrency } from "@/lib/utils";
import { Save, Sparkles } from "lucide-react";

type BranchOption = { id: string; name: string };

export function FeeStructuresManager({
  branchId: initialBranchId,
  branches,
  matrix: initialMatrix,
  showBranchPicker,
}: {
  branchId: string;
  branches: BranchOption[];
  matrix: BandSemesterFees[];
  showBranchPicker: boolean;
}) {
  const [branchId, setBranchId] = useState(initialBranchId);
  const [rows, setRows] = useState(() => matrixToForm(initialMatrix));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const annualPreview = useMemo(() => {
    return rows.reduce(
      (sum, r) => sum + (Number(r.semester1) || 0) + (Number(r.semester2) || 0),
      0
    );
  }, [rows]);

  function updateRow(band: GradeBand, field: "semester1" | "semester2", value: string) {
    setRows((prev) =>
      prev.map((r) => (r.gradeBand === band ? { ...r, [field]: value } : r))
    );
  }

  function run(action: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) setMessage(res.message ?? "Saved");
      else setError(res.error ?? "Failed");
    });
  }

  function handleSave() {
    const payload = rows.map((r) => ({
      gradeBand: r.gradeBand,
      semester1: Number(r.semester1),
      semester2: Number(r.semester2),
    }));

    if (payload.some((r) => Number.isNaN(r.semester1) || Number.isNaN(r.semester2))) {
      setError("Enter valid amounts for every cell.");
      return;
    }

    run(() => saveBandSemesterFees(branchId, payload));
  }

  function handleDefaults() {
    const next = GRADE_BAND_ORDER.map((band) => ({
      gradeBand: band,
      label: rows.find((r) => r.gradeBand === band)?.label ?? band,
      semester1: String(DEFAULT_SEMESTER_AMOUNTS[band]),
      semester2: String(DEFAULT_SEMESTER_AMOUNTS[band]),
    }));
    setRows(next);
    run(() => applyDefaultBandSemesterFees(branchId));
  }

  return (
    <div className="space-y-6">
      {showBranchPicker && branches.length > 1 && (
        <form method="get" className="flex flex-wrap items-end gap-4">
          <Field label="Branch">
            <Select
              name="branchId"
              defaultValue={branchId}
              onChange={(e) => {
                window.location.href = `/finance/fees?branchId=${e.target.value}`;
              }}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      )}

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900">
        <strong>Semester billing:</strong> tuition is charged every{" "}
        <strong>{SEMESTER_DURATION_MONTHS} months</strong> (Semester 1 and Semester 2). Set one
        amount per <strong>grade band</strong> — KG, Primary, Junior High, Senior High. New
        student invoices use these prices automatically.
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Grade band</th>
              <th className="px-4 py-3 font-medium">Semester 1 (ETB)</th>
              <th className="px-4 py-3 font-medium">Semester 2 (ETB)</th>
              <th className="px-4 py-3 font-medium">Year total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const s1 = Number(row.semester1) || 0;
              const s2 = Number(row.semester2) || 0;
              return (
                <tr key={row.gradeBand} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={row.semester1}
                      onChange={(e) =>
                        updateRow(row.gradeBand, "semester1", e.target.value)
                      }
                      className="max-w-[140px]"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={row.semester2}
                      onChange={(e) =>
                        updateRow(row.gradeBand, "semester2", e.target.value)
                      }
                      className="max-w-[140px]"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-700 tabular-nums">
                    {formatCurrency(s1 + s2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50">
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-900">All bands (preview)</td>
              <td colSpan={2} className="px-4 py-3 text-slate-500">
                Per student per academic year (both semesters)
              </td>
              <td className="px-4 py-3 font-semibold text-indigo-700 tabular-nums">
                {formatCurrency(annualPreview)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={handleSave} disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "Saving…" : "Save all fee structures"}
        </Button>
        <Button type="button" variant="outline" onClick={handleDefaults} disabled={pending}>
          <Sparkles className="h-4 w-4" />
          Apply recommended defaults
        </Button>
      </div>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}

function matrixToForm(matrix: BandSemesterFees[]) {
  return matrix.map((m) => ({
    gradeBand: m.gradeBand,
    label: m.label,
    semester1: m.semester1 != null ? String(m.semester1) : "",
    semester2: m.semester2 != null ? String(m.semester2) : "",
  }));
}
