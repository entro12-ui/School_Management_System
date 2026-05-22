import { prisma } from "@/lib/prisma";
import { formatGradeLevel } from "@/lib/grade-utils";

export async function getLibraryReportSummary(branchId: string) {
  const [mostBorrowed, activeReaders, overdueList, lostBooks, byGradeBand] =
    await Promise.all([
      prisma.bookIssue.groupBy({
        by: ["bookId"],
        where: { branchId },
        _count: { _all: true },
        orderBy: { _count: { bookId: "desc" } },
        take: 10,
      }),
      prisma.bookIssue.groupBy({
        by: ["borrowerUserId"],
        where: { branchId, returnedAt: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { borrowerUserId: "desc" } },
        take: 10,
      }),
      prisma.bookIssue.findMany({
        where: {
          branchId,
          returnedAt: null,
          dueDate: { lt: new Date() },
        },
        include: {
          book: { select: { title: true } },
          student: { select: { studentId: true, firstName: true, lastName: true } },
          borrower: { select: { firstName: true, lastName: true } },
        },
        take: 50,
      }),
      prisma.book.count({ where: { branchId, status: "LOST" } }),
      prisma.book.groupBy({
        by: ["gradeBand"],
        where: { branchId, gradeBand: { not: null } },
        _count: { _all: true },
      }),
    ]);

  const bookIds = mostBorrowed.map((b) => b.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, author: true },
  });
  const bookMap = new Map(books.map((b) => [b.id, b]));

  const readerIds = activeReaders.map((r) => r.borrowerUserId);
  const readers = await prisma.user.findMany({
    where: { id: { in: readerIds } },
    select: { id: true, firstName: true, lastName: true, role: true },
  });
  const readerMap = new Map(readers.map((u) => [u.id, u]));

  return {
    mostBorrowed: mostBorrowed.map((row) => ({
      bookId: row.bookId,
      title: bookMap.get(row.bookId)?.title ?? "—",
      author: bookMap.get(row.bookId)?.author,
      count: row._count._all,
    })),
    activeReaders: activeReaders.map((row) => {
      const u = readerMap.get(row.borrowerUserId);
      return {
        name: u ? `${u.firstName} ${u.lastName}` : "—",
        role: u?.role ?? "—",
        loans: row._count._all,
      };
    }),
    overdue: overdueList.map((i) => ({
      bookTitle: i.book.title,
      borrowerName: i.student
        ? `${i.student.firstName} ${i.student.lastName}`
        : `${i.borrower.firstName} ${i.borrower.lastName}`,
      studentCode: i.student?.studentId ?? "—",
      dueDate: i.dueDate.toISOString(),
    })),
    lostBooks,
    inventoryByBand: byGradeBand.map((g) => ({
      gradeBand: g.gradeBand ?? "—",
      count: g._count._all,
    })),
  };
}

export async function getReadingStatsByGrade(branchId: string) {
  const logs = await prisma.libraryReadingLog.groupBy({
    by: ["studentId"],
    where: { branchId },
    _count: { _all: true },
  });

  const studentIds = logs.map((l) => l.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, gradeLevel: true, firstName: true, lastName: true },
  });
  const smap = new Map(students.map((s) => [s.id, s]));

  const byGrade = new Map<number, number>();
  for (const log of logs) {
    const s = smap.get(log.studentId);
    if (!s) continue;
    byGrade.set(s.gradeLevel, (byGrade.get(s.gradeLevel) ?? 0) + log._count._all);
  }

  return [...byGrade.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([gradeLevel, booksRead]) => ({
      gradeLevel,
      gradeLabel: formatGradeLevel(gradeLevel),
      booksRead,
    }));
}
