"use client";

import { UserRole } from "@prisma/client";
import { Field, Select } from "@/components/ui/input";
import { departmentsForRole } from "@/lib/academic-catalog";

export function DepartmentSelect({
  role,
  required = true,
  value,
  defaultValue,
  onChange,
}: {
  role: UserRole;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (department: string) => void;
}) {
  const options = departmentsForRole(role);
  const fallback = options[0]?.value ?? "";

  return (
    <Field label={required ? "Department *" : "Department"}>
      <Select
        name="department"
        required={required}
        value={value}
        defaultValue={value === undefined ? (defaultValue ?? fallback) : undefined}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}
