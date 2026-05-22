"use server";

import {
  BookReservationStatus,
  BookStatus,
  LibraryBorrowerType,
  LibraryFineStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { checkBorrowerEligibility } from "@/lib/library/eligibility";
import { calculateOverdueFine, daysBetween } from "@/lib/library/fines";
import { RESERVATION_HOLD_DAYS } from "@/lib/library/constants";
import { READING_BADGE_THRESHOLDS } from "@/lib/library/borrowing-rules";
import {
  canAccessLibrary,
  defaultDueDateForBorrower,
  resolveLibraryBranchId,
} from "@/lib/services/library";
import {
  findBookByBarcode,
  findStudentByCode,
} from "@/lib/services/library-portal";
import { prisma } from "@/lib/prisma";
import {
  libraryBookSchema,
  libraryFinePaymentSchema,
  libraryIssueSchema,
  libraryReadingLogSchema,
  libraryReservationSchema,
  libraryReturnSchema,
} from "@/lib/validations/library";

export type LibraryActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

const LIBRARY_PATHS = [
  "/library",
  "/library/catalog",
  "/library/issue",
  "/library/reservations",
  "/library/fines",
  "/library/accounts",
  "/library/reports",
  "/library/digital",
  "/student/library",
  "/teacher/library",
  "/parent/library",
];

function revalidateLibrary() {
  for (const p of LIBRARY_PATHS) revalidatePath(p);
}

async function assertLibraryAccess(branchId: string) {
  const session = await auth();
  if (!session?.user || !canAccessLibrary(session.user.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }
  const allowedBranch = resolveLibraryBranchId(
    session.user.role,
    session.user.branchId,
    branchId
  );
  if (!allowedBranch || allowedBranch !== branchId) {
    return { ok: false as const, error: "You can only manage your branch library." };
  }
  return { ok: true as const, session };
}

function generateBarcode(): string {
  return `BK-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

async function notifyReservationReady(
  branchId: string,
  bookTitle: string,
  borrowerUserId: string
) {
  const user = await prisma.user.findUnique({
    where: { id: borrowerUserId },
    select: { firstName: true, lastName: true },
  });
  await prisma.announcement.create({
    data: {
      branchId,
      title: "Library: reserved book ready",
      body: `"${bookTitle}" is now available for ${user?.firstName ?? "you"}. Visit the library within ${RESERVATION_HOLD_DAYS} days.`,
      audience: "ALL",
      published: true,
    },
  });
}

async function fulfillReservationsForBook(bookId: string, branchId: string) {
  const next = await prisma.bookReservation.findFirst({
    where: { bookId, branchId, status: BookReservationStatus.PENDING },
    orderBy: { reservedAt: "asc" },
    include: { book: { select: { title: true } } },
  });
  if (!next) return;

  const readyAt = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + RESERVATION_HOLD_DAYS);

  await prisma.bookReservation.update({
    where: { id: next.id },
    data: { status: BookReservationStatus.READY, readyAt, expiresAt },
  });

  await notifyReservationReady(branchId, next.book.title, next.borrowerUserId);
}

export async function saveLibraryBook(
  formData: FormData
): Promise<LibraryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = libraryBookSchema.safeParse({
    ...raw,
    isDigital: raw.isDigital === "true" || raw.isDigital === "on",
    gradeBand: raw.gradeBand || undefined,
    digitalUrl: raw.digitalUrl || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertLibraryAccess(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };

  const d = parsed.data;
  const barcode = d.barcode?.trim() || null;

  if (d.bookId) {
    const existing = await prisma.book.findFirst({
      where: { id: d.bookId, branchId: d.branchId },
      include: { _count: { select: { issues: { where: { returnedAt: null } } } } },
    });
    if (!existing) return { success: false, error: "Book not found." };
    const onLoan = existing._count.issues;
    if (d.totalCopies < onLoan) {
      return {
        success: false,
        error: `Cannot set copies below ${onLoan} (currently on loan).`,
      };
    }

    await prisma.book.update({
      where: { id: d.bookId },
      data: {
        title: d.title.trim(),
        author: d.author?.trim() || null,
        isbn: d.isbn?.trim() || null,
        barcode: barcode || existing.barcode,
        subject: d.subject?.trim() || null,
        category: d.category?.trim() || null,
        gradeBand: d.gradeBand ?? null,
        shelfLocation: d.shelfLocation?.trim() || null,
        description: d.description?.trim() || null,
        digitalUrl: d.digitalUrl?.trim() || null,
        isDigital: !!d.isDigital,
        totalCopies: d.totalCopies,
        available: d.totalCopies - onLoan,
        status:
          d.totalCopies - onLoan > 0 ? BookStatus.AVAILABLE : BookStatus.ISSUED,
      },
    });
    revalidateLibrary();
    return { success: true, message: "Book updated." };
  }

  await prisma.book.create({
    data: {
      branchId: d.branchId,
      title: d.title.trim(),
      author: d.author?.trim() || null,
      isbn: d.isbn?.trim() || null,
      barcode: barcode || generateBarcode(),
      subject: d.subject?.trim() || null,
      category: d.category?.trim() || null,
      gradeBand: d.gradeBand ?? null,
      shelfLocation: d.shelfLocation?.trim() || null,
      description: d.description?.trim() || null,
      digitalUrl: d.digitalUrl?.trim() || null,
      isDigital: !!d.isDigital,
      totalCopies: d.totalCopies,
      available: d.totalCopies,
      status: BookStatus.AVAILABLE,
    },
  });

  revalidateLibrary();
  return { success: true, message: "Book added to catalog." };
}

export async function deleteLibraryBook(
  bookId: string,
  branchId: string
): Promise<LibraryActionResult> {
  const access = await assertLibraryAccess(branchId);
  if (!access.ok) return { success: false, error: access.error };

  const book = await prisma.book.findFirst({
    where: { id: bookId, branchId },
    include: { _count: { select: { issues: { where: { returnedAt: null } } } } },
  });
  if (!book) return { success: false, error: "Book not found." };
  if (book._count.issues > 0) {
    return { success: false, error: "Return all copies before deleting." };
  }

  await prisma.book.delete({ where: { id: bookId } });
  revalidateLibrary();
  return { success: true, message: "Book removed." };
}

export async function issueLibraryBook(
  formData: FormData
): Promise<LibraryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  let bookId = String(raw.bookId ?? "");
  let borrowerUserId = String(raw.borrowerUserId ?? "");
  let studentId = raw.studentId ? String(raw.studentId) : undefined;
  let gradeLevel = Number(raw.gradeLevel ?? 0);
  const borrowerType = raw.borrowerType as LibraryBorrowerType;

  if (raw.bookBarcodeScan) {
    const book = await findBookByBarcode(
      String(raw.branchId),
      String(raw.bookBarcodeScan)
    );
    if (!book) return { success: false, error: "Book barcode not found." };
    bookId = book.id;
  }

  if (raw.studentCodeScan && borrowerType === LibraryBorrowerType.STUDENT) {
    const student = await findStudentByCode(
      String(raw.branchId),
      String(raw.studentCodeScan)
    );
    if (!student?.user?.id) {
      return { success: false, error: "Student ID not found or no login linked." };
    }
    borrowerUserId = student.user.id;
    studentId = student.id;
    gradeLevel = student.gradeLevel;
  }

  const parsed = libraryIssueSchema.safeParse({
    ...raw,
    bookId,
    borrowerUserId,
    studentId,
    gradeLevel,
    borrowerType,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const access = await assertLibraryAccess(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };

  const eligibility = await checkBorrowerEligibility({
    branchId: parsed.data.branchId,
    borrowerUserId: parsed.data.borrowerUserId,
    borrowerType: parsed.data.borrowerType,
    gradeLevel: parsed.data.gradeLevel,
  });
  if (!eligibility.canBorrow) {
    return { success: false, error: eligibility.reasons.join(" ") };
  }

  const book = await prisma.book.findFirst({
    where: { id: parsed.data.bookId, branchId: parsed.data.branchId },
  });
  if (!book) return { success: false, error: "Book not found." };
  if (book.isDigital) {
    return { success: false, error: "Digital books are accessed online, not issued." };
  }
  if (book.available < 1) {
    return { success: false, error: "No copies available. Student may reserve the book." };
  }

  const dueDate = parsed.data.dueDate
    ? new Date(parsed.data.dueDate)
    : defaultDueDateForBorrower(parsed.data.gradeLevel, parsed.data.borrowerType);

  await prisma.$transaction([
    prisma.bookIssue.create({
      data: {
        branchId: parsed.data.branchId,
        bookId: book.id,
        borrowerUserId: parsed.data.borrowerUserId,
        borrowerType: parsed.data.borrowerType,
        studentId:
          parsed.data.borrowerType === LibraryBorrowerType.STUDENT
            ? parsed.data.studentId
            : null,
        dueDate,
        notes: parsed.data.notes?.trim() || null,
      },
    }),
    prisma.book.update({
      where: { id: book.id },
      data: {
        available: { decrement: 1 },
        status: book.available - 1 <= 0 ? BookStatus.ISSUED : book.status,
      },
    }),
  ]);

  revalidateLibrary();
  return { success: true, message: `Issued "${book.title}" successfully.` };
}

export async function returnLibraryBook(
  formData: FormData
): Promise<LibraryActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = libraryReturnSchema.safeParse({
    ...raw,
    waiveFine: raw.waiveFine === "true" || raw.waiveFine === "on",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const issue = await prisma.bookIssue.findUnique({
    where: { id: parsed.data.issueId },
    include: { book: true, student: true },
  });
  if (!issue || issue.returnedAt) {
    return { success: false, error: "Loan not found or already returned." };
  }

  const access = await assertLibraryAccess(issue.branchId);
  if (!access.ok) return { success: false, error: access.error };

  const daysLate = daysBetween(issue.dueDate);
  const autoFine = calculateOverdueFine(daysLate);
  const fineAmount =
    parsed.data.waiveFine
      ? 0
      : parsed.data.fineAmount != null && !Number.isNaN(parsed.data.fineAmount)
        ? parsed.data.fineAmount
        : autoFine.amount;

  await prisma.$transaction(async (tx) => {
    await tx.bookIssue.update({
      where: { id: issue.id },
      data: {
        returnedAt: new Date(),
        fineAmount: fineAmount > 0 ? fineAmount : null,
        finePaid: fineAmount <= 0,
        notes: parsed.data.notes?.trim() || issue.notes,
      },
    });
    await tx.book.update({
      where: { id: issue.bookId },
      data: {
        available: { increment: 1 },
        status: BookStatus.AVAILABLE,
      },
    });

    if (fineAmount > 0) {
      await tx.libraryFine.create({
        data: {
          branchId: issue.branchId,
          issueId: issue.id,
          borrowerUserId: issue.borrowerUserId,
          amount: fineAmount,
          status: LibraryFineStatus.PENDING,
        },
      });
    }

    if (issue.studentId) {
      await tx.libraryReadingLog.create({
        data: {
          branchId: issue.branchId,
          studentId: issue.studentId,
          bookId: issue.bookId,
          bookTitle: issue.book.title,
        },
      });
    }
  });

  await fulfillReservationsForBook(issue.bookId, issue.branchId);
  revalidateLibrary();

  const msg =
    fineAmount > 0
      ? `Returned. Fine recorded: ${fineAmount} ETB.`
      : autoFine.warning
        ? `Returned. ${autoFine.warning}`
        : "Book returned successfully.";
  return { success: true, message: msg };
}

export async function reserveLibraryBook(
  formData: FormData
): Promise<LibraryActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Sign in required." };

  const parsed = libraryReservationSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  if (!parsed.success) {
    return { success: false, error: "Invalid reservation." };
  }

  const book = await prisma.book.findFirst({
    where: { id: parsed.data.bookId, branchId: parsed.data.branchId },
  });
  if (!book) return { success: false, error: "Book not found." };
  if (book.available > 0) {
    return { success: false, error: "Book is available — ask librarian to issue instead." };
  }

  const student = await prisma.student.findFirst({
    where: { userId: session.user.id },
  });

  const existing = await prisma.bookReservation.findFirst({
    where: {
      bookId: book.id,
      borrowerUserId: session.user.id,
      status: { in: ["PENDING", "READY"] },
    },
  });
  if (existing) return { success: false, error: "You already have a reservation for this book." };

  await prisma.bookReservation.create({
    data: {
      branchId: parsed.data.branchId,
      bookId: book.id,
      borrowerUserId: session.user.id,
      studentId: student?.id,
      status: BookReservationStatus.PENDING,
    },
  });

  revalidateLibrary();
  return {
    success: true,
    message: `Reserved "${book.title}". You will be notified when it is ready.`,
  };
}

export async function cancelLibraryReservation(
  reservationId: string
): Promise<LibraryActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const row = await prisma.bookReservation.findUnique({
    where: { id: reservationId },
  });
  if (!row) return { success: false, error: "Reservation not found." };

  const isLibrarian = canAccessLibrary(session.user.role);
  if (!isLibrarian && row.borrowerUserId !== session.user.id) {
    return { success: false, error: "Not allowed." };
  }

  await prisma.bookReservation.update({
    where: { id: reservationId },
    data: { status: BookReservationStatus.CANCELLED },
  });

  revalidateLibrary();
  return { success: true, message: "Reservation cancelled." };
}

export async function payLibraryFine(
  formData: FormData
): Promise<LibraryActionResult> {
  const parsed = libraryFinePaymentSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  if (!parsed.success) {
    return { success: false, error: "Invalid request." };
  }

  const access = await assertLibraryAccess(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };

  const fine = await prisma.libraryFine.findFirst({
    where: { id: parsed.data.fineId, branchId: parsed.data.branchId },
  });
  if (!fine) return { success: false, error: "Fine not found." };

  await prisma.$transaction([
    prisma.libraryFine.update({
      where: { id: fine.id },
      data: {
        status: LibraryFineStatus.PAID,
        paidAmount: fine.amount,
        paidAt: new Date(),
      },
    }),
    prisma.bookIssue.update({
      where: { id: fine.issueId },
      data: { finePaid: true },
    }),
  ]);

  revalidateLibrary();
  return { success: true, message: "Fine marked as paid." };
}

export async function logReadingAchievement(
  formData: FormData
): Promise<LibraryActionResult> {
  const parsed = libraryReadingLogSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid" };
  }

  const access = await assertLibraryAccess(parsed.data.branchId);
  if (!access.ok) return { success: false, error: access.error };

  const count = await prisma.libraryReadingLog.count({
    where: { studentId: parsed.data.studentId, branchId: parsed.data.branchId },
  });
  const nextCount = count + 1;
  const badge =
    READING_BADGE_THRESHOLDS.filter((t) => nextCount >= t.books)
      .at(-1)?.badge ?? null;

  await prisma.libraryReadingLog.create({
    data: {
      branchId: parsed.data.branchId,
      studentId: parsed.data.studentId,
      bookId: parsed.data.bookId || null,
      bookTitle: parsed.data.bookTitle.trim(),
      badgeLevel: parsed.data.badgeLevel || badge,
    },
  });

  revalidateLibrary();
  return {
    success: true,
    message: badge ? `Logged. Badge earned: ${badge}!` : "Reading activity logged.",
  };
}
