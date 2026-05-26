import { PaymentStatus, RegistrationRole, RegistrationStatus, UserRole } from "@prisma/client";
import { formatGradeLevel } from "@/lib/grade-utils";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatPercent } from "@/lib/utils";

export async function getBranchOverview(branchId: string) {
  const branch = await prisma.branch.findUniqueOrThrow({
    where: { id: branchId },
    include: {
      academicYears: { where: { isCurrent: true }, take: 1 },
      _count: {
        select: {
          students: { where: { isActive: true } },
          staffProfiles: true,
          classes: true,
          users: true,
        },
      },
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [presentToday, totalToday, paid, outstanding, pendingRegs, parents] =
    await Promise.all([
      prisma.attendanceRecord.count({
        where: { branchId, date: today, status: "PRESENT" },
      }),
      prisma.attendanceRecord.count({
        where: { branchId, date: today, studentId: { not: null } },
      }),
      prisma.payment.aggregate({
        where: { branchId, status: PaymentStatus.PAID },
        _sum: { paidAmount: true },
      }),
      prisma.payment.findMany({
        where: {
          branchId,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
        },
        select: { amount: true, paidAmount: true },
      }),
      prisma.registrationRequest.count({
        where: {
          branchId,
          status: RegistrationStatus.PENDING,
          role: { in: [RegistrationRole.REGISTRAR, RegistrationRole.HR_MANAGER] },
        },
      }),
      prisma.user.count({
        where: { branchId, role: UserRole.PARENT, isActive: true },
      }),
    ]);

  const outstandingSum = outstanding.reduce(
    (s, p) => s + Number(p.amount) - Number(p.paidAmount),
    0
  );
  const revenue = Number(paid._sum.paidAmount ?? 0);
  const attendanceRate = totalToday > 0 ? (presentToday / totalToday) * 100 : 0;

  return {
    branch: {
      id: branch.id,
      code: branch.code,
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone,
      currentYear: branch.academicYears[0]?.name ?? "—",
    },
    counts: {
      students: branch._count.students,
      staff: branch._count.staffProfiles,
      classes: branch._count.classes,
      users: branch._count.users,
      parents,
      pendingRegistrations: pendingRegs,
    },
    metrics: {
      revenue,
      outstanding: outstandingSum,
      attendanceRate,
      formatted: {
        revenue: formatCurrency(revenue),
        outstanding: formatCurrency(outstandingSum),
        attendance: formatPercent(attendanceRate),
      },
    },
  };
}

export async function getBranchGradeLevelBreakdown(branchId: string) {
  const groups = await prisma.student.groupBy({
    by: ["gradeLevel"],
    where: { branchId, isActive: true },
    _count: { id: true },
    orderBy: { gradeLevel: "asc" },
  });

  return groups.map((g) => ({
    gradeLevel: g.gradeLevel,
    label: formatGradeLevel(g.gradeLevel),
    count: g._count.id,
  }));
}

export async function getBranchStudents(branchId: string) {
  return prisma.student.findMany({
    where: { branchId, isActive: true },
    include: {
      class: { select: { name: true } },
      guardian: {
        include: {
          user: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
      payments: {
        where: {
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
        },
        select: { amount: true, paidAmount: true },
      },
    },
    orderBy: [{ gradeLevel: "asc" }, { firstName: "asc" }],
  });
}

export async function getBranchStaff(branchId: string) {
  return prisma.user.findMany({
    where: {
      branchId,
      isActive: true,
      role: {
        in: [
          UserRole.TEACHER,
          UserRole.FINANCE_OFFICER,
          UserRole.LIBRARIAN,
          UserRole.REGISTRAR,
        ],
      },
    },
    include: {
      staffProfile: { select: { employeeId: true, department: true } },
    },
    orderBy: [{ role: "asc" }, { firstName: "asc" }],
  });
}

export async function getBranchClasses(branchId: string) {
  return prisma.class.findMany({
    where: { branchId },
    include: {
      academicYear: { select: { name: true } },
      _count: { select: { students: { where: { isActive: true } } } },
      teachers: {
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        where: { isPrimary: true },
        take: 1,
      },
    },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });
}

/** Active teachers enrolled at registrar — eligible for homeroom (OTP login is OK). */
export async function getBranchTeachersForAssignment(branchId: string) {
  return prisma.staffProfile.findMany({
    where: {
      branchId,
      user: {
        role: UserRole.TEACHER,
        isActive: true,
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          mustChangePassword: true,
        },
      },
      classAssignments: {
        where: { isPrimary: true },
        include: { class: { select: { name: true, gradeLevel: true } } },
      },
    },
    orderBy: { user: { firstName: "asc" } },
  });
}

export async function getBranchAuditLogs(branchId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { branchId },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      actor: { select: { firstName: true, lastName: true, email: true, role: true } },
    },
  });
}
