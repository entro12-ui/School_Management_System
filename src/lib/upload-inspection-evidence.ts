import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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

export async function saveInspectionEvidenceFile(
  runId: string,
  file: File
): Promise<{ fileUrl: string; mimeType: string }> {
  if (file.size === 0) throw new Error("File is empty.");
  if (file.size > MAX_BYTES) throw new Error("File must be under 8 MB.");
  if (
    !ALLOWED_TYPES.has(file.type) &&
    !file.name.match(/\.(pdf|jpe?g|png|webp|docx?)$/i)
  ) {
    throw new Error("Use PDF, Word, JPEG, PNG, or WebP.");
  }

  const ext = extensionForFile(file);
  const dir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "inspection-evidence",
    runId
  );
  await mkdir(dir, { recursive: true });

  const storedName = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), buffer);

  return {
    fileUrl: `/uploads/inspection-evidence/${runId}/${storedName}`,
    mimeType: file.type || `application/octet-stream`,
  };
}
