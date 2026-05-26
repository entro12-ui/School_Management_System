import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function saveUserPhoto(userId: string, file: File): Promise<string> {
  if (file.size === 0) {
    throw new Error("Photo file is empty.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Photo must be under 2 MB.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Use a JPEG, PNG, WebP, or GIF image.");
  }

  const ext = extensionForMime(file.type);
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });

  const filename = `${userId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const photoUrl = `/uploads/avatars/${filename}?v=${Date.now()}`;
  await prisma.user.update({
    where: { id: userId },
    data: { photoUrl: `/uploads/avatars/${filename}` },
  });

  return photoUrl;
}

export function isStaffRole(role: string): boolean {
  return [
    "TEACHER",
    "FINANCE_OFFICER",
    "LIBRARIAN",
    "REGISTRAR",
    "HR_OFFICER",
    "BRANCH_ADMIN",
  ].includes(role);
}
