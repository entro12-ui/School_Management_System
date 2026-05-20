"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { HR_EMPLOYEE_DOCUMENT_TYPES } from "@/lib/hr/employee-document-types";

type DocRow = { id: string; type: string; expiry: string };

function newRow(): DocRow {
  return {
    id: crypto.randomUUID(),
    type: HR_EMPLOYEE_DOCUMENT_TYPES[0].value,
    expiry: "",
  };
}

export function HrEmployeeDocumentFields() {
  const [rows, setRows] = useState<DocRow[]>([newRow()]);

  return (
    <div className="sm:col-span-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div>
        <h3 className="font-semibold text-slate-900">Employee files</h3>
        <p className="mt-1 text-xs text-slate-500">
          Upload ID, contract, CV, certificates, or other documents (PDF, Word, JPEG, PNG —
          max 8 MB each).
        </p>
      </div>

      {rows.map((row, index) => (
        <div
          key={row.id}
          className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Field label="Document type">
            <Select
              name={`documents[${index}][type]`}
              value={row.type}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, type: e.target.value } : r
                  )
                )
              }
            >
              {HR_EMPLOYEE_DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="File">
            <Input
              name={`documents[${index}][file]`}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
              className="text-sm"
            />
          </Field>

          <Field label="Expiry (optional)">
            <Input
              name={`documents[${index}][expiry]`}
              type="date"
              value={row.expiry}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, expiry: e.target.value } : r
                  )
                )
              }
            />
          </Field>

          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              className="text-red-600"
              disabled={rows.length === 1}
              onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRows((prev) => [...prev, newRow()])}
      >
        <Plus className="h-4 w-4" />
        Add another file
      </Button>
    </div>
  );
}
