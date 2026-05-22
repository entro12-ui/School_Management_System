import type { GradeBand } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { gradeLevelToBand } from "@/lib/grade-utils";
import { GRADE_BAND_LIBRARY_LABELS } from "@/lib/library/borrowing-rules";
import { checkBorrowerEligibility } from "@/lib/library/eligibility";
import { LibraryBorrowerType } from "@prisma/client";

export type PublicBookSearchRow = {
  id: string;
  title: string;
  author: string | null;
  subject: string | null;
  category: string | null;
  gradeBand: GradeBand | null;
  gradeBandLabel: string | null;
  isDigital: boolean;
  available: number;
  totalCopies: number;
  shelfLocation: string | null;
  canReserve: boolean;
};

export async function searchLibraryBooks(input: {
  branchId: string;
  query?: string;
  gradeBand?: GradeBand | null;
  gradeLevel?: number;
  subject?: string;
  availableOnly?: boolean;
}): Promise<PublicBookSearchRow[]> {
  const q = input.query?.trim().toLowerCase();
  const targetBand =
    input.gradeBand ??
    (input.gradeLevel != null ? gradeLevelToBand(input.gradeLevel) : undefined);

  const books = await prisma.book.findMany({
    where: {
      branchId: input.branchId,
      ...(input.availableOnly ? { available: { gt: 0 } } : {}),
      ...(targetBand ? { OR: [{ gradeBand: targetBand }, { gradeBand: null }] } : {}),
      ...(input.subject
        ? { subject: { contains: input.subject, mode: "insensitive" } }
        : {}),
    },
    orderBy: [{ title: "asc" }],
    take: 80,
  });

  const filtered = q
    ? books.filter((b) => {
        const hay = [b.title, b.author, b.subject, b.isbn, b.category, b.barcode]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
    : books;

  return filtered.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    subject: b.subject,
    category: b.category,
    gradeBand: b.gradeBand,
    gradeBandLabel: b.gradeBand ? GRADE_BAND_LIBRARY_LABELS[b.gradeBand] : null,
    isDigital: b.isDigital,
    available: b.available,
    totalCopies: b.totalCopies,
    shelfLocation: b.shelfLocation,
    canReserve: b.available < 1 && !b.isDigital,
  }));
}

export async function getBorrowerLibraryAccount(borrowerUserId: string, branchId: string) {
  const user = await prisma.user.findUnique({
    where: { id: borrowerUserId },
    include: {
      student: {
        include: { class: { select: { name: true } } },
      },
    },
  });
  if (!user) return null;

  const borrowerType =
    user.role === "TEACHER"
      ? LibraryBorrowerType.TEACHER
      : LibraryBorrowerType.STUDENT;

  const gradeLevel = user.student?.gradeLevel ?? 12;

  const [eligibility, activeLoans, history, reservations, readingCount] =
    await Promise.all([
      checkBorrowerEligibility({
        branchId,
        borrowerUserId,
        borrowerType,
        gradeLevel,
      }),
      prisma.bookIssue.findMany({
        where: { borrowerUserId, branchId, returnedAt: null },
        include: { book: { select: { title: true, barcode: true } } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.bookIssue.findMany({
        where: { borrowerUserId, branchId, returnedAt: { not: null } },
        include: { book: { select: { title: true } } },
        orderBy: { returnedAt: "desc" },
        take: 20,
      }),
      prisma.bookReservation.findMany({
        where: {
          borrowerUserId,
          branchId,
          status: { in: ["PENDING", "READY"] },
        },
        include: { book: { select: { title: true } } },
        orderBy: { reservedAt: "desc" },
      }),
      user.student
        ? prisma.libraryReadingLog.count({
            where: { studentId: user.student.id, branchId },
          })
        : Promise.resolve(0),
    ]);

  return {
    user: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      studentCode: user.student?.studentId ?? null,
      className: user.student?.class?.name ?? null,
      gradeLevel: user.student?.gradeLevel ?? null,
    },
    eligibility,
    activeLoans: activeLoans.map((i) => ({
      id: i.id,
      bookTitle: i.book.title,
      barcode: i.book.barcode,
      dueDate: i.dueDate.toISOString(),
      isOverdue: i.dueDate < new Date(),
    })),
    history: history.map((i) => ({
      bookTitle: i.book.title,
      returnedAt: i.returnedAt!.toISOString(),
      fineAmount: i.fineAmount != null ? Number(i.fineAmount) : null,
    })),
    reservations: reservations.map((r) => ({
      id: r.id,
      bookTitle: r.book.title,
      status: r.status,
      reservedAt: r.reservedAt.toISOString(),
    })),
    booksRead: readingCount,
  };
}

export async function findBookByBarcode(branchId: string, code: string) {
  const trimmed = code.trim();
  if (!trimmed) return null;
  return prisma.book.findFirst({
    where: {
      branchId,
      OR: [{ barcode: trimmed }, { isbn: trimmed }, { id: trimmed }],
    },
    select: {
      id: true,
      title: true,
      author: true,
      barcode: true,
      available: true,
      isDigital: true,
    },
  });
}

export async function findStudentByCode(branchId: string, code: string) {
  const trimmed = code.trim();
  return prisma.student.findFirst({
    where: {
      branchId,
      isActive: true,
      OR: [{ studentId: trimmed }, { userId: trimmed }],
    },
    include: {
      user: { select: { id: true } },
      class: { select: { name: true } },
    },
  });
}
