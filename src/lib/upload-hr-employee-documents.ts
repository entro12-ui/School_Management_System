import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  HR_EMPLOYEE_DOCUMENT_TYPES,
  type HrEmployeeDocumentType,
} from "@/lib/hr/employee-document-types";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_TYPE_VALUES = new Set(
  HR_EMPLOYEE_DOCUMENT_TYPES.map((t) => t.value)
);

function extensionForFile(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  if (name.endsWith(".doc")) return "doc";
  if (name.endsWith(".docx")) return "docx";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function sanitizeBaseName(filename: string): string {
  const base = path.basename(filename, path.extname(filename));
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "document";
}

export type ParsedEmployeeDocumentUpload = {
  index: number;
  documentType: HrEmployeeDocumentType;
  file: File;
  expiryDate?: Date;
};

/** Read `documents[N][type|file|expiry]` fields from multipart form data. */
export function parseEmployeeDocumentUploads(
  formData: FormData
): ParsedEmployeeDocumentUpload[] {
  const uploads: ParsedEmployeeDocumentUpload[] = [];

  for (let i = 0; i < 20; i++) {
    const typeRaw = formData.get(`documents[${i}][type]`);
    const file = formData.get(`documents[${i}][file]`);
    const expiryRaw = formData.get(`documents[${i}][expiry]`);

    if (!typeRaw && !(file instanceof File)) continue;
    if (!(file instanceof File) || file.size === 0) continue;

    const documentType = String(typeRaw ?? "OTHER");
    if (!ALLOWED_TYPE_VALUES.has(documentType as HrEmployeeDocumentType)) {
      continue;
    }

    let expiryDate: Date | undefined;
    if (expiryRaw && String(expiryRaw).trim()) {
      const d = new Date(String(expiryRaw));
      if (!Number.isNaN(d.getTime())) expiryDate = d;
    }

    uploads.push({
      index: i,
      documentType: documentType as HrEmployeeDocumentType,
      file,
      expiryDate,
    });
  }

  return uploads;
}

export async function saveHrEmployeeDocuments(
  employeeId: string,
  uploads: ParsedEmployeeDocumentUpload[]
): Promise<{ saved: number; errors: string[] }> {
  if (uploads.length === 0) return { saved: 0, errors: [] };

  const dir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "hr-documents",
    employeeId
  );
  await mkdir(dir, { recursive: true });

  const errors: string[] = [];
  let saved = 0;

  for (const upload of uploads) {
    const { file, documentType, expiryDate } = upload;
    try {
      if (file.size > MAX_BYTES) {
        throw new Error(`${file.name}: file must be under 8 MB.`);
      }
      if (!ALLOWED_TYPES.has(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp|docx?)$/i)) {
        throw new Error(
          `${file.name}: use PDF, Word, JPEG, PNG, or WebP.`
        );
      }

      const ext = extensionForFile(file);
      const storedName = `${randomUUID()}-${sanitizeBaseName(file.name)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, storedName), buffer);

      const fileUrl = `/uploads/hr-documents/${employeeId}/${storedName}`;

      await prisma.hrEmployeeDocument.create({
        data: {
          employeeId,
          documentType,
          fileUrl,
          expiryDate: expiryDate ?? null,
        },
      });
      saved += 1;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : `Could not save ${file.name}.`);
    }
  }

  return { saved, errors };
}
