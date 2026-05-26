import { prisma } from "@/lib/prisma";
import { AttendanceStatus, PaymentStatus, UserRole } from "@prisma/client";
import { formatCurrency, formatPercent } from "@/lib/utils";

export async function getConsolidatedStats() {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const branchStats = await Promise.all(
    branches.map(async (branch) => {
      const [enrollment, presentToday, totalToday, payments, outstanding] =
        await Promise.all([
          prisma.student.count({
            where: { branchId: branch.id, isActive: true },
          }),
          prisma.attendanceRecord.count({
            where: {
              branchId: branch.id,
              date: today,
              status: AttendanceStatus.PRESENT,
            },
          }),
          prisma.attendanceRecord.count({
            where: { branchId: branch.id, date: today, studentId: { not: null } },
          }),
          prisma.payment.aggregate({
            where: { branchId: branch.id, status: PaymentStatus.PAID },
            _sum: { paidAmount: true },
          }),
          prisma.payment.aggregate({
            where: {
              branchId: branch.id,
              status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE, PaymentStatus.PARTIAL] },
            },
            _sum: { amount: true },
          }),
        ]);

      const attendanceRate =
        totalToday > 0 ? (presentToday / totalToday) * 100 : 0;

      return {
        id: branch.id,
        name: branch.name,
        city: branch.city,
        enrollment,
        attendanceRate,
        revenue: Number(payments._sum.paidAmount ?? 0),
        outstanding: Number(outstanding._sum.amount ?? 0),
      };
    })
  );

  const totalEnrollment = branchStats.reduce((s, b) => s + b.enrollment, 0);
  const totalRevenue = branchStats.reduce((s, b) => s + b.revenue, 0);
  const totalOutstanding = branchStats.reduce((s, b) => s + b.outstanding, 0);
  const avgAttendance =
    branchStats.length > 0
      ? branchStats.reduce((s, b) => s + b.attendanceRate, 0) / branchStats.length
      : 0;

  return {
    branches: branchStats,
    totals: {
      enrollment: totalEnrollment,
      revenue: totalRevenue,
      outstanding: totalOutstanding,
      attendanceRate: avgAttendance,
    },
  };
}

export async function getBranchStats(branchId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [branch, enrollment, presentToday, totalToday, paid, outstanding, books, staff] =
    await Promise.all([
      prisma.branch.findUniqueOrThrow({ where: { id: branchId } }),
      prisma.student.count({ where: { branchId, isActive: true } }),
      prisma.attendanceRecord.count({
        where: { branchId, date: today, status: AttendanceStatus.PRESENT },
      }),
      prisma.attendanceRecord.count({
        where: { branchId, date: today, studentId: { not: null } },
      }),
      prisma.payment.aggregate({
        where: { branchId, status: PaymentStatus.PAID },
        _sum: { paidAmount: true },
      }),
      prisma.payment.aggregate({
        where: {
          branchId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE, PaymentStatus.PARTIAL] },
        },
        _sum: { amount: true },
      }),
      prisma.book.count({ where: { branchId } }),
      prisma.user.count({
        where: {
          branchId,
          role: { in: [UserRole.TEACHER, UserRole.FINANCE_OFFICER, UserRole.LIBRARIAN] },
          isActive: true,
        },
      }),
    ]);

  const attendanceRate = totalToday > 0 ? (presentToday / totalToday) * 100 : 0;
  const feeCollectionRate =
    Number(paid._sum.paidAmount ?? 0) + Number(outstanding._sum.amount ?? 0) > 0
      ? (Number(paid._sum.paidAmount ?? 0) /
          (Number(paid._sum.paidAmount ?? 0) + Number(outstanding._sum.amount ?? 0))) *
        100
      : 0;

  return {
    branch,
    enrollment,
    attendanceRate,
    feeCollectionRate,
    revenue: Number(paid._sum.paidAmount ?? 0),
    outstanding: Number(outstanding._sum.amount ?? 0),
    libraryBooks: books,
    staffCount: staff,
    formatted: {
      revenue: formatCurrency(Number(paid._sum.paidAmount ?? 0)),
      outstanding: formatCurrency(Number(outstanding._sum.amount ?? 0)),
      attendance: formatPercent(attendanceRate),
      feeCollection: formatPercent(feeCollectionRate),
    },
  };
}

export async function getGradeBandBreakdown(branchId?: string) {
  const where = branchId ? { branchId, isActive: true } : { isActive: true };
  const groups = await prisma.student.groupBy({
    by: ["gradeBand"],
    where,
    _count: { id: true },
  });
  return groups.map((g) => ({
    band: g.gradeBand,
    count: g._count.id,
  }));
}
