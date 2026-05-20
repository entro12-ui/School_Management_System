/** HR employee file categories stored on HrEmployeeDocument.documentType */
export const HR_EMPLOYEE_DOCUMENT_TYPES = [
  { value: "ID_COPY", label: "ID / Passport copy" },
  { value: "CONTRACT", label: "Employment contract" },
  { value: "CV", label: "CV / Resume" },
  { value: "CERTIFICATE", label: "Academic / professional certificate" },
  { value: "MEDICAL", label: "Medical / fitness certificate" },
  { value: "OTHER", label: "Other document" },
] as const;

export type HrEmployeeDocumentType =
  (typeof HR_EMPLOYEE_DOCUMENT_TYPES)[number]["value"];

export function hrDocumentTypeLabel(type: string): string {
  return (
    HR_EMPLOYEE_DOCUMENT_TYPES.find((t) => t.value === type)?.label ?? type
  );
}
