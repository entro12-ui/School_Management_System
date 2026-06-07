import type { GradeBand, UserRole } from "@prisma/client";
import {
  BookReservationStatus,
  BookStatus,
  LibraryBorrowerType,
  LibraryFineStatus,
} from "@prisma/client";
import { calculateOverdueFine, daysBetween } from "@/lib/library/fines";
import { dueDateFromPolicy } from "@/lib/library/borrowing-rules";
import { GRADE_BAND_LIBRARY_LABELS } from "@/lib/library/borrowing-rules";
import {
  resolveOrganizationPageBranch,
  type BranchScopeUser,
} from "@/lib/auth/super-admin-scope";
import { prisma } from "@/lib/prisma";
import { formatGradeLevel } from "@/lib/grade-utils";

export function canAccessLibrary(role: UserRole): boolean {
  return (
    role === "LIBRARIAN" ||
    role === "BRANCH_ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

export function resolveLibraryBranchId(
  user: BranchScopeUser,
  overrideBranchId?: string
): string | undefined {
  if (user.role === "SUPER_ADMIN") return overrideBranchId;
  return user.branchId ?? undefined;
}

export async function getLibraryPageBranch(user: BranchScopeUser, searchBranchId?: string) {
  return resolveOrganizationPageBranch(user, searchBranchId);
}

export async function getLibraryStats(branchId: string) {
  const now = new Date();
  const [
    totalBooks,
    availableCopies,
    activeLoans,
    overdueLoans,
    digitalCount,
    pendingReservations,
    pendingFines,
  ] = await Promise.all([
      prisma.book.count({ where: { branchId } }),
      prisma.book.aggregate({
        where: { branchId },
        _sum: { available: true },
      }),
      prisma.bookIssue.count({
        where: { branchId, returnedAt: null },
      }),
      prisma.bookIssue.count({
        where: { branchId, returnedAt: null, dueDate: { lt: now } },
      }),
      prisma.book.count({ where: { branchId, isDigital: true } }),
      prisma.bookReservation.count({
        where: { branchId, status: { in: ["PENDING", "READY"] } },
      }),
      prisma.libraryFine.count({
        where: { branchId, status: LibraryFineStatus.PENDING },
      }),
    ]);

  return {
    totalBooks,
    availableCopies: availableCopies._sum.available ?? 0,
    activeLoans,
    overdueLoans,
    digitalCount,
    pendingReservations,
    pendingFines,
  };
}

export type LibraryBookRow = {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  barcode: string | null;
  subject: string | null;
  category: string | null;
  gradeBand: string | null;
  gradeBandEnum: GradeBand | null;
  shelfLocation: string | null;
  isDigital: boolean;
  digitalUrl: string | null;
  totalCopies: number;
  available: number;
  status: BookStatus;
  onLoan: number;
  pendingReservations: number;
};

export async function getLibraryCatalog(branchId: string): Promise<LibraryBookRow[]> {
  const books = await prisma.book.findMany({
    where: { branchId },
    include: {
      _count: {
        select: {
          issues: { where: { returnedAt: null } },
          reservations: { where: { status: { in: ["PENDING", "READY"] } } },
        },
      },
    },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  return books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    isbn: b.isbn,
    barcode: b.barcode,
    subject: b.subject,
    category: b.category,
    gradeBand: b.gradeBand ? GRADE_BAND_LIBRARY_LABELS[b.gradeBand] : null,
    gradeBandEnum: b.gradeBand,
    shelfLocation: b.shelfLocation,
    isDigital: b.isDigital,
    digitalUrl: b.digitalUrl,
    totalCopies: b.totalCopies,
    available: b.available,
    status: b.status,
    onLoan: b._count.issues,
    pendingReservations: b._count.reservations,
  }));
}

export type LibraryIssueRow = {
  id: string;
  bookId: string;
  bookTitle: string;
  barcode: string | null;
  borrowerType: LibraryBorrowerType;
  borrowerUserId: string;
  studentId: string | null;
  borrowerCode: string;
  borrowerName: string;
  className: string | null;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  fineAmount: number | null;
  finePaid: boolean;
  notes: string | null;
  isOverdue: boolean;
  daysOverdue: number;
  suggestedFine: number;
  fineWarning: string | null;
};

export async function getLibraryIssues(
  branchId: string,
  filter: "active" | "overdue" | "all" = "active"
): Promise<LibraryIssueRow[]> {
  const now = new Date();
  const where: {
    branchId: string;
    returnedAt?: null | { not: null };
    dueDate?: { lt: Date };
  } = { branchId };

  if (filter === "active") where.returnedAt = null;
  if (filter === "overdue") {
    where.returnedAt = null;
    where.dueDate = { lt: now };
  }

  const issues = await prisma.bookIssue.findMany({
    where,
    include: {
      book: { select: { id: true, title: true, barcode: true } },
      student: {
        select: {
          studentId: true,
          firstName: true,
          lastName: true,
          class: { select: { name: true } },
        },
      },
      borrower: { select: { firstName: true, lastName: true, role: true } },
    },
    orderBy: [{ returnedAt: "asc" }, { dueDate: "asc" }],
    take: filter === "all" ? 200 : 100,
  });

  return issues.map((i) => {
    const due = new Date(i.dueDate);
    const isOverdue = !i.returnedAt && due < now;
    const daysOverdue = isOverdue ? daysBetween(due, now) : 0;
    const fineCalc = calculateOverdueFine(daysOverdue);
    return {
      id: i.id,
      bookId: i.bookId,
      bookTitle: i.book.title,
      barcode: i.book.barcode,
      borrowerType: i.borrowerType,
      borrowerUserId: i.borrowerUserId,
      studentId: i.studentId,
      borrowerCode:
        i.student?.studentId ?? i.borrowerUserId.slice(0, 8).toUpperCase(),
      borrowerName: i.student
        ? `${i.student.firstName} ${i.student.lastName}`
        : `${i.borrower.firstName} ${i.borrower.lastName}`,
      className: i.student?.class?.name ?? null,
      issuedAt: i.issuedAt.toISOString(),
      dueDate: i.dueDate.toISOString(),
      returnedAt: i.returnedAt?.toISOString() ?? null,
      fineAmount: i.fineAmount != null ? Number(i.fineAmount) : null,
      finePaid: i.finePaid,
      notes: i.notes,
      isOverdue,
      daysOverdue,
      suggestedFine: fineCalc.amount,
      fineWarning: fineCalc.warning,
    };
  });
}

export async function getStudentsForLibrary(branchId: string) {
  const students = await prisma.student.findMany({
    where: { branchId, isActive: true, userId: { not: null } },
    select: {
      id: true,
      userId: true,
      studentId: true,
      firstName: true,
      lastName: true,
      gradeLevel: true,
      class: { select: { name: true } },
    },
    orderBy: [{ gradeLevel: "asc" }, { firstName: "asc" }],
  });

  return students.map((s) => ({
    id: s.id,
    userId: s.userId!,
    studentId: s.studentId,
    gradeLevel: s.gradeLevel,
    name: `${s.firstName} ${s.lastName}`,
    gradeLabel: formatGradeLevel(s.gradeLevel),
    className: s.class?.name ?? null,
    label: `${s.studentId} — ${s.firstName} ${s.lastName} (${formatGradeLevel(s.gradeLevel)})`,
  }));
}

export async function getTeachersForLibrary(branchId: string) {
  const users = await prisma.user.findMany({
    where: { branchId, role: "TEACHER", isActive: true },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { firstName: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    userId: u.id,
    gradeLevel: 12,
    name: `${u.firstName} ${u.lastName}`,
    label: `Teacher — ${u.firstName} ${u.lastName}`,
  }));
}

export async function getBooksAvailableForIssue(branchId: string) {
  return prisma.book.findMany({
    where: { branchId, available: { gt: 0 }, isDigital: false },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      author: true,
      barcode: true,
      available: true,
      category: true,
    },
  });
}

export function defaultDueDateForBorrower(
  gradeLevel: number,
  borrowerType: LibraryBorrowerType
): Date {
  return dueDateFromPolicy(gradeLevel, borrowerType);
}

export async function getLibraryReservations(branchId: string) {
  const rows = await prisma.bookReservation.findMany({
    where: { branchId, status: { in: ["PENDING", "READY"] } },
    include: {
      book: { select: { title: true, available: true } },
      student: { select: { studentId: true, firstName: true, lastName: true } },
      borrower: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ status: "asc" }, { reservedAt: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    bookTitle: r.book.title,
    bookAvailable: r.book.available,
    borrowerName: r.student
      ? `${r.student.firstName} ${r.student.lastName}`
      : `${r.borrower.firstName} ${r.borrower.lastName}`,
    borrowerCode: r.student?.studentId ?? "—",
    status: r.status,
    reservedAt: r.reservedAt.toISOString(),
    readyAt: r.readyAt?.toISOString() ?? null,
  }));
}

export async function getLibraryFines(branchId: string) {
  const fines = await prisma.libraryFine.findMany({
    where: { branchId },
    include: {
      issue: { include: { book: { select: { title: true } } } },
      borrower: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return fines.map((f) => ({
    id: f.id,
    issueId: f.issueId,
    bookTitle: f.issue.book.title,
    borrowerName: `${f.borrower.firstName} ${f.borrower.lastName}`,
    amount: Number(f.amount),
    paidAmount: Number(f.paidAmount),
    status: f.status,
    createdAt: f.createdAt.toISOString(),
  }));
}

export async function getLibraryAccounts(branchId: string) {
  const activeByUser = await prisma.bookIssue.groupBy({
    by: ["borrowerUserId"],
    where: { branchId, returnedAt: null },
    _count: { _all: true },
  });
  const userIds = activeByUser.map((a) => a.borrowerUserId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    include: {
      student: { select: { studentId: true, gradeLevel: true, class: { select: { name: true } } } },
    },
  });
  return users.map((u) => {
    const count = activeByUser.find((a) => a.borrowerUserId === u.id)?._count._all ?? 0;
    return {
      userId: u.id,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role,
      studentCode: u.student?.studentId ?? null,
      className: u.student?.class?.name ?? null,
      activeLoans: count,
    };
  });
}

export async function getDigitalLibrary(branchId: string) {
  return prisma.book.findMany({
    where: { branchId, isDigital: true },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      author: true,
      subject: true,
      gradeBand: true,
      digitalUrl: true,
      category: true,
    },
  });
}

export { dueDateFromPolicy };
