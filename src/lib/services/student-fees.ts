import { PaymentStatus } from "@prisma/client";
import { PAYMENT_PROOF_STATUS } from "@/lib/finance/payment-proof-constants";
import { prisma } from "@/lib/prisma";
import { formatSemesterLabel } from "@/lib/semester-fees";

export async function getStudentFees(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!student) return null;

  const payments = await prisma.payment.findMany({
    where: { studentId: student.id },
    include: {
      academicYear: { select: { name: true } },
      feeStructure: { select: { name: true } },
      proofs: {
        where: { status: PAYMENT_PROOF_STATUS.PENDING_REVIEW },
        take: 1,
        select: { id: true },
      },
    },
    orderBy: [{ academicYear: { startDate: "desc" } }, { term: "asc" }],
  });

  let totalDue = 0;
  let totalPaid = 0;
  let outstanding = 0;

  const rows = payments.map((p) => {
    const amount = Number(p.amount);
    const paidAmount = Number(p.paidAmount);
    const balance = Math.max(0, amount - paidAmount);
    totalDue += amount;
    totalPaid += paidAmount;
    if (p.status !== PaymentStatus.PAID) outstanding += balance;

    return {
      id: p.id,
      name: `${formatSemesterLabel(p.term)} · ${p.academicYear.name}${
        p.feeStructure?.name ? ` · ${p.feeStructure.name}` : ""
      }`,
      amount,
      paidAmount,
      outstanding: balance,
      status: p.status,
      dueDate: p.dueDate?.toISOString() ?? null,
      paidChannel: p.paidChannel,
      pendingProof: p.proofs.length > 0,
      canPayOnline:
        balance > 0 &&
        p.status !== PaymentStatus.PAID &&
        p.proofs.length === 0,
    };
  });

  return {
    studentName: `${student.firstName} ${student.lastName}`,
    payments: rows,
    totals: { totalDue, totalPaid, outstanding },
  };
}
