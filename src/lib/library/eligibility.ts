import { LibraryBorrowerType, LibraryFineStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { daysBetween } from "@/lib/library/fines";
import { getBorrowingPolicy } from "@/lib/library/borrowing-rules";

export type BorrowerEligibility = {
  canBorrow: boolean;
  reasons: string[];
  activeLoans: number;
  maxBooks: number;
  overdueCount: number;
  unpaidFineTotal: number;
  policyLabel: string;
};

export async function checkBorrowerEligibility(input: {
  branchId: string;
  borrowerUserId: string;
  borrowerType: LibraryBorrowerType;
  gradeLevel: number;
}): Promise<BorrowerEligibility> {
  const policy = getBorrowingPolicy(input.gradeLevel, input.borrowerType);
  const reasons: string[] = [];

  const [activeLoans, overdueIssues, pendingFines] = await Promise.all([
    prisma.bookIssue.count({
      where: {
        branchId: input.branchId,
        borrowerUserId: input.borrowerUserId,
        returnedAt: null,
      },
    }),
    prisma.bookIssue.findMany({
      where: {
        branchId: input.branchId,
        borrowerUserId: input.borrowerUserId,
        returnedAt: null,
        dueDate: { lt: new Date() },
      },
      select: { id: true, dueDate: true, finePaid: true, fineAmount: true },
    }),
    prisma.libraryFine.aggregate({
      where: {
        branchId: input.branchId,
        borrowerUserId: input.borrowerUserId,
        status: LibraryFineStatus.PENDING,
      },
      _sum: { amount: true, paidAmount: true },
    }),
  ]);

  const unpaidFromIssues = overdueIssues
    .filter((i) => i.fineAmount && !i.finePaid)
    .reduce((s, i) => s + Number(i.fineAmount), 0);

  const unpaidFineTotal =
    Number(pendingFines._sum.amount ?? 0) -
    Number(pendingFines._sum.paidAmount ?? 0) +
    unpaidFromIssues;

  if (activeLoans >= policy.maxBooks) {
    reasons.push(
      `Borrowing limit reached (${activeLoans}/${policy.maxBooks} books for ${policy.label}).`
    );
  }

  if (unpaidFineTotal > 0) {
    reasons.push(
      `Outstanding library fines: ${unpaidFineTotal.toFixed(2)} ETB. Pay or waive before new loans.`
    );
  }

  const severeOverdue = overdueIssues.filter(
    (i) => daysBetween(i.dueDate) > 10 && !i.finePaid
  );
  if (severeOverdue.length > 0) {
    reasons.push(
      `${severeOverdue.length} book(s) overdue more than 10 days — return or pay fines first.`
    );
  }

  return {
    canBorrow: reasons.length === 0,
    reasons,
    activeLoans,
    maxBooks: policy.maxBooks,
    overdueCount: overdueIssues.length,
    unpaidFineTotal,
    policyLabel: policy.label,
  };
}
