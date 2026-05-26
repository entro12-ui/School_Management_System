import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ENROLLED_ROLES: UserRole[] = [
  UserRole.STUDENT,
  UserRole.TEACHER,
  UserRole.FINANCE_OFFICER,
  UserRole.LIBRARIAN,
  UserRole.PARENT,
  UserRole.REGISTRAR,
  UserRole.HR_OFFICER,
];

export type EnrollmentRecordRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  branchId: string | null;
  branchName: string | null;
  pendingOtp: string | null;
  otpIssuedAt: string | null;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: string;
  studentId: string | null;
  studentRecordId: string | null;
  gradeLevel: number | null;
  className: string | null;
  employeeId: string | null;
  department: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
};

export async function getEnrollmentRecords(options: {
  branchId?: string | null;
  includeInactive?: boolean;
}): Promise<EnrollmentRecordRow[]> {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ENROLLED_ROLES },
      ...(options.branchId ? { branchId: options.branchId } : {}),
      ...(options.includeInactive ? {} : { isActive: true }),
    },
    include: {
      branch: { select: { name: true } },
      student: {
        select: {
          id: true,
          studentId: true,
          gradeLevel: true,
          class: { select: { name: true } },
        },
      },
      staffProfile: {
        select: { employeeId: true, department: true },
      },
      hrEmployee: {
        select: {
          employeeCode: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => {
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      role: u.role,
      branchId: u.branchId,
      branchName: u.branch?.name ?? null,
      pendingOtp: u.pendingOtp,
      otpIssuedAt: u.otpIssuedAt?.toISOString() ?? null,
      mustChangePassword: u.mustChangePassword,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      studentId: u.student?.studentId ?? null,
      studentRecordId: u.student?.id ?? null,
      gradeLevel: u.student?.gradeLevel ?? null,
      className: u.student?.class?.name ?? null,
      employeeId:
        u.staffProfile?.employeeId ?? u.hrEmployee?.employeeCode ?? null,
      department:
        u.staffProfile?.department ?? u.hrEmployee?.department?.name ?? null,
      guardianName: null,
      guardianPhone: null,
    };
  });
}
