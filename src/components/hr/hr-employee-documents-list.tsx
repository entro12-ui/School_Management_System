"use client";

import { FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hrDocumentTypeLabel } from "@/lib/hr/employee-document-types";
import { deleteHrEmployeeDocument } from "@/lib/actions/hr";

export type EmployeeDocumentItem = {
  id: string;
  documentType: string;
  fileUrl: string;
  expiryDate: string | null;
  createdAt: string;
};

export function HrEmployeeDocumentsList({
  employeeName,
  documents,
  canWrite,
  onDeleted,
}: {
  employeeName: string;
  documents: EmployeeDocumentItem[];
  canWrite: boolean;
  onDeleted?: () => void;
}) {
  if (documents.length === 0) {
    return <span className="text-xs text-slate-400">No files</span>;
  }

  return (
    <ul className="space-y-1">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex flex-wrap items-center gap-2 text-xs text-slate-600"
        >
          <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:underline"
          >
            {hrDocumentTypeLabel(doc.documentType)}
          </a>
          {doc.expiryDate && (
            <span className="text-slate-400">
              exp. {new Date(doc.expiryDate).toLocaleDateString()}
            </span>
          )}
          {canWrite && (
            <Button
              type="button"
              variant="ghost"
              className="h-6 px-1 text-red-600"
              onClick={async () => {
                if (
                  !confirm(
                    `Delete ${hrDocumentTypeLabel(doc.documentType)} for ${employeeName}?`
                  )
                ) {
                  return;
                }
                const res = await deleteHrEmployeeDocument(doc.id);
                if (res.success) onDeleted?.();
                else alert(res.error ?? "Could not delete file.");
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
