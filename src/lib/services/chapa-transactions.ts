import { ChapaTransactionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatSemesterLabel } from "@/lib/semester-fees";
import { fullName } from "@/lib/utils";

export type FinanceChapaTransactionRow = {
  id: string;
  txRef: string;
  chapaRefId: string | null;
  amount: number;
  chapaStatus: ChapaTransactionStatus;
  paymentStatus: string;
  paymentReference: string | null;
  paidAmount: number;
  feeAmount: number;
  semesterLabel: string;
  studentCode: string;
  studentName: string;
  branchName: string;
  payerName: string;
  payerEmail: string;
  createdAt: string;
  completedAt: string | null;
  paymentId: string;
};

export async function getChapaTransactionsForFinance(branchId?: string) {
  const rows = await prisma.chapaTransaction.findMany({
    where: branchId ? { payment: { branchId } } : {},
    include: {
      payment: {
        include: {
          student: {
            include: { branch: { select: { name: true } } },
          },
          academicYear: { select: { name: true } },
        },
      },
      initiatedBy: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 300,
  });

  return rows.map<FinanceChapaTransactionRow>((row) => {
    const student = row.payment.student;
    return {
      id: row.id,
      txRef: row.txRef,
      chapaRefId: row.chapaRefId,
      amount: Number(row.amount),
      chapaStatus: row.status,
      paymentStatus: row.payment.status,
      paymentReference: row.payment.reference,
      paidAmount: Number(row.payment.paidAmount),
      feeAmount: Number(row.payment.amount),
      semesterLabel: `${formatSemesterLabel(row.payment.term)} · ${row.payment.academicYear.name}`,
      studentCode: student.studentId,
      studentName: fullName(student.firstName, student.lastName),
      branchName: student.branch.name,
      payerName: fullName(row.initiatedBy.firstName, row.initiatedBy.lastName),
      payerEmail: row.initiatedBy.email,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
      paymentId: row.paymentId,
    };
  });
}

export async function getChapaTransactionStats(branchId?: string) {
  const where = branchId ? { payment: { branchId } } : {};
  const [success, pending, failed] = await Promise.all([
    prisma.chapaTransaction.count({ where: { ...where, status: ChapaTransactionStatus.SUCCESS } }),
    prisma.chapaTransaction.count({ where: { ...where, status: ChapaTransactionStatus.PENDING } }),
    prisma.chapaTransaction.count({ where: { ...where, status: ChapaTransactionStatus.FAILED } }),
  ]);
  return { success, pending, failed };
}
