import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function extensionForFile(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  return "jpg";
}

export async function savePaymentInvoice(
  paymentId: string,
  file: File
): Promise<string> {
  if (file.size === 0) throw new Error("Invoice file is empty.");
  if (file.size > MAX_BYTES) throw new Error("Invoice must be under 8 MB.");
  if (
    !ALLOWED_TYPES.has(file.type) &&
    !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)
  ) {
    throw new Error("Use PDF, JPEG, or PNG for the invoice.");
  }

  const ext = extensionForFile(file);
  const dir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "payment-invoices",
    paymentId
  );
  await mkdir(dir, { recursive: true });

  const storedName = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), buffer);

  return `/uploads/payment-invoices/${paymentId}/${storedName}`;
}
