import type { UserRole } from "@prisma/client";
import {
  ALL_HR_PERMISSIONS,
  HR_MANAGER_ROLE_NAME,
  HR_PERMISSIONS,
  type HrPermissionName,
} from "@/lib/hr/permissions";
import { prisma } from "@/lib/prisma";

export function canAccessHr(role: UserRole): boolean {
  return (
    role === "HR_OFFICER" ||
    role === "BRANCH_ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

export function isHrPortalAdmin(role: UserRole): boolean {
  return role === "BRANCH_ADMIN" || role === "SUPER_ADMIN";
}

export function resolveHrBranchId(
  role: UserRole,
  userBranchId: string | null | undefined,
  overrideBranchId?: string
): string | undefined {
  if (role === "SUPER_ADMIN") return overrideBranchId;
  return userBranchId ?? undefined;
}

export async function getHrPageBranch(
  role: UserRole,
  userBranchId: string | null | undefined,
  searchBranchId?: string
) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  let branchId = resolveHrBranchId(role, userBranchId, searchBranchId);

  if (isSuperAdmin && !branchId) {
    const first = await prisma.branch.findFirst({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true },
    });
    branchId = first?.id;
  }

  const branches = isSuperAdmin
    ? await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
      })
    : [];

  const branch = branchId
    ? await prisma.branch.findUnique({
        where: { id: branchId },
        select: { id: true, name: true, code: true },
      })
    : null;

  return { branchId, branches, branch, isSuperAdmin };
}

export async function getHrPermissionsForUser(userId: string): Promise<string[]> {
  const assignments = await prisma.hrUserRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  const names = new Set<string>();
  for (const a of assignments) {
    if (a.role.name === HR_MANAGER_ROLE_NAME) {
      return [...ALL_HR_PERMISSIONS];
    }
    for (const rp of a.role.permissions) {
      names.add(rp.permission.name);
    }
  }
  return [...names];
}

export async function userHasHrPermission(
  userId: string,
  portalRole: UserRole,
  permission: HrPermissionName
): Promise<boolean> {
  if (isHrPortalAdmin(portalRole)) return true;
  const perms = await getHrPermissionsForUser(userId);
  return perms.includes(permission);
}

export async function userIsHrManager(
  userId: string,
  portalRole: UserRole
): Promise<boolean> {
  if (isHrPortalAdmin(portalRole)) return true;
  const roles = await prisma.hrUserRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return roles.some((r) => r.role.name === HR_MANAGER_ROLE_NAME);
}

export async function getHrDashboardStats(branchId?: string) {
  const where = branchId ? { branchId } : {};

  const [
    employees,
    departments,
    pendingLeave,
    openJobs,
    trainings,
    assets,
    payrollThisMonth,
  ] = await Promise.all([
    prisma.hrEmployee.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.hrDepartment.count({ where }),
    prisma.hrLeaveRequest.count({
      where: { employee: where, status: "PENDING" },
    }),
    prisma.hrJobPost.count({ where: { ...where, status: "OPEN" } }),
    prisma.hrTraining.count({ where }),
    prisma.hrAsset.count({ where: { ...where, status: "AVAILABLE" } }),
    prisma.hrPayrollRecord.count({
      where: {
        employee: where,
        payrollMonth: currentPayrollMonth(),
      },
    }),
  ]);

  return {
    employees,
    departments,
    pendingLeave,
    openJobs,
    trainings,
    assetsAvailable: assets,
    payrollThisMonth,
  };
}

function currentPayrollMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getHrEmployees(branchId?: string) {
  return prisma.hrEmployee.findMany({
    where: branchId ? { branchId } : {},
    include: {
      department: { select: { id: true, name: true } },
      designation: { select: { id: true, title: true } },
      branch: { select: { name: true } },
      user: { select: { id: true, email: true, role: true } },
      documents: {
        select: {
          id: true,
          documentType: true,
          fileUrl: true,
          expiryDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getHrDepartments(branchId?: string) {
  return prisma.hrDepartment.findMany({
    where: branchId ? { branchId } : {},
    include: { _count: { select: { employees: true, jobPosts: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getHrDesignations(branchId?: string) {
  return prisma.hrDesignation.findMany({
    where: branchId ? { branchId } : {},
    include: { _count: { select: { employees: true } } },
    orderBy: { title: "asc" },
  });
}

export async function getHrLeaveTypes(branchId?: string) {
  return prisma.hrLeaveType.findMany({
    where: branchId ? { branchId } : {},
    orderBy: { name: "asc" },
  });
}

export async function getHrLeaveRequests(branchId?: string) {
  return prisma.hrLeaveRequest.findMany({
    where: branchId ? { employee: { branchId } } : {},
    include: {
      employee: {
        select: { firstName: true, lastName: true, employeeCode: true },
      },
      leaveType: { select: { name: true } },
      approver: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getHrAttendance(branchId?: string, limit = 50) {
  return prisma.hrEmployeeAttendance.findMany({
    where: branchId ? { employee: { branchId } } : {},
    include: {
      employee: {
        select: { firstName: true, lastName: true, employeeCode: true },
      },
    },
    orderBy: { attendanceDate: "desc" },
    take: limit,
  });
}

export async function getHrPayrollData(branchId?: string) {
  const [salaries, records] = await Promise.all([
    prisma.hrSalaryStructure.findMany({
      where: branchId ? { employee: { branchId } } : {},
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    }),
    prisma.hrPayrollRecord.findMany({
      where: branchId ? { employee: { branchId } } : {},
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { generatedAt: "desc" },
      take: 40,
    }),
  ]);
  return { salaries, records };
}

export async function getHrTrainings(branchId?: string) {
  return prisma.hrTraining.findMany({
    where: branchId ? { branchId } : {},
    include: {
      _count: { select: { enrollments: true } },
      enrollments: {
        include: {
          employee: {
            select: { firstName: true, lastName: true, employeeCode: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getHrAssets(branchId?: string) {
  return prisma.hrAsset.findMany({
    where: branchId ? { branchId } : {},
    include: {
      assignments: {
        include: {
          employee: {
            select: { firstName: true, lastName: true, employeeCode: true },
          },
        },
        orderBy: { assignedDate: "desc" },
        take: 3,
      },
    },
    orderBy: { assetName: "asc" },
  });
}

export async function getHrRecruitment(branchId?: string) {
  const jobs = await prisma.hrJobPost.findMany({
    where: branchId ? { branchId } : {},
    include: {
      department: { select: { name: true } },
      candidates: { orderBy: { createdAt: "desc" } },
      _count: { select: { candidates: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return jobs;
}

export async function getHrPerformanceReviews(branchId?: string) {
  return prisma.hrPerformanceReview.findMany({
    where: branchId ? { employee: { branchId } } : {},
    include: {
      employee: {
        select: { firstName: true, lastName: true, employeeCode: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

export async function getHrRolesAndUsers(branchId?: string) {
  const [roles, hrUsers] = await Promise.all([
    prisma.hrRole.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        role: "HR_OFFICER",
        ...(branchId ? { branchId } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        hrUserRoles: { include: { role: { select: { name: true } } } },
        hrEmployee: { select: { employeeCode: true } },
      },
      orderBy: { lastName: "asc" },
    }),
  ]);
  return { roles, hrUsers };
}

export async function getHrAccessFlags(userId: string, role: UserRole) {
  if (isHrPortalAdmin(role)) {
    return {
      employeesWrite: true,
      departmentsWrite: true,
      leaveWrite: true,
      leaveApprove: true,
      attendanceWrite: true,
      payrollWrite: true,
      payrollRun: true,
      performanceWrite: true,
      trainingWrite: true,
      assetsWrite: true,
      recruitmentWrite: true,
      canManageRoles: true,
      isHrManager: true,
    };
  }

  const perms = await getHrPermissionsForUser(userId);
  const has = (p: HrPermissionName) => perms.includes(p);

  return {
    employeesWrite: has(HR_PERMISSIONS.EMPLOYEES_WRITE),
    departmentsWrite: has(HR_PERMISSIONS.DEPARTMENTS_WRITE),
    leaveWrite: has(HR_PERMISSIONS.LEAVE_WRITE),
    leaveApprove: has(HR_PERMISSIONS.LEAVE_APPROVE),
    attendanceWrite: has(HR_PERMISSIONS.ATTENDANCE_WRITE),
    payrollWrite: has(HR_PERMISSIONS.PAYROLL_WRITE),
    payrollRun: has(HR_PERMISSIONS.PAYROLL_RUN),
    performanceWrite: has(HR_PERMISSIONS.PERFORMANCE_WRITE),
    trainingWrite: has(HR_PERMISSIONS.TRAINING_WRITE),
    assetsWrite: has(HR_PERMISSIONS.ASSETS_WRITE),
    recruitmentWrite: has(HR_PERMISSIONS.RECRUITMENT_WRITE),
    canManageRoles: has(HR_PERMISSIONS.ROLES_MANAGE),
    isHrManager: await userIsHrManager(userId, role),
  };
}

export async function ensureHrRbacDefaults() {
  const roles = [
    { name: HR_MANAGER_ROLE_NAME, description: "Full control of HR module" },
    { name: "HR Admin", description: "Full HR access" },
    { name: "Payroll Officer", description: "Payroll and salary" },
    { name: "Recruiter", description: "Jobs and candidates" },
  ];

  const permissions = [...ALL_HR_PERMISSIONS];

  for (const name of permissions) {
    await prisma.hrPermission.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  for (const r of roles) {
    await prisma.hrRole.upsert({
      where: { name: r.name },
      create: r,
      update: { description: r.description },
    });
  }

  const managerRole = await prisma.hrRole.findUnique({
    where: { name: HR_MANAGER_ROLE_NAME },
  });
  if (!managerRole) return;

  const allPerms = await prisma.hrPermission.findMany();
  for (const p of allPerms) {
    await prisma.hrRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: p.id,
        },
      },
      create: { roleId: managerRole.id, permissionId: p.id },
      update: {},
    });
  }

  const payrollRole = await prisma.hrRole.findUnique({
    where: { name: "Payroll Officer" },
  });
  if (payrollRole) {
    const payrollPerms = [
      "payroll.read",
      "payroll.write",
      "payroll.run",
      "employees.read",
    ];
    for (const name of payrollPerms) {
      const p = await prisma.hrPermission.findUnique({ where: { name } });
      if (!p) continue;
      await prisma.hrRolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: payrollRole.id,
            permissionId: p.id,
          },
        },
        create: { roleId: payrollRole.id, permissionId: p.id },
        update: {},
      });
    }
  }
}
