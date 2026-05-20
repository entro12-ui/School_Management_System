"use client";

import { Field, Select } from "@/components/ui/input";

export function HrBranchPicker({
  branchId,
  branches,
  basePath,
}: {
  branchId: string;
  branches: { id: string; name: string }[];
  basePath: string;
}) {
  if (branches.length <= 1) return null;

  return (
    <form method="get" className="mb-6">
      <Field label="Branch">
        <Select
          name="branchId"
          defaultValue={branchId}
          onChange={(e) => {
            window.location.href = `${basePath}?branchId=${e.target.value}`;
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
  );
}
