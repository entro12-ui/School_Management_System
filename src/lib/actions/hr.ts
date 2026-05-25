"use server";

import { HrLeaveRequestStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import {
  HR_MANAGER_ROLE_NAME,
  HR_PERMISSIONS,
  type HrPermissionName,
} from "@/lib/hr/permissions";
import { prisma } from "@/lib/prisma";
import { generateHrEmployeeCode } from "@/lib/hr/employee-code";
import {
  parseEmployeeDocumentUploads,
  saveHrEmployeeDocuments,
} from "@/lib/upload-hr-employee-documents";
import { unlink } from "fs/promises";
import path from "path";
import {
  resolveDepartmentIdForRole,
  resolveDesignationId,
  STAFF_DESIGNATION_BY_ROLE,
} from "@/lib/hr/staff-designations";
import { createEnrolledUser } from "@/lib/services/enrollment";
import { generateOneTimePassword } from "@/lib/otp";
import {
  canAccessHr,
  ensureHrRbacDefaults,
  isHrPortalAdmin,
  userHasHrPermission,
} from "@/lib/services/hr";
import {
  hrAssignRoleSchema,
  hrAssetSchema,
  hrAttendanceSchema,
  hrCandidateSchema,
  hrDepartmentSchema,
  hrDesignationSchema,
  hrEmployeeSchema,
  hrJobPostSchema,
  hrLeaveRequestSchema,
  hrLeaveStatusSchema,
  hrLeaveTypeSchema,
  hrPayrollRunSchema,
  hrPerformanceSchema,
  hrSalarySchema,
  hrTrainingEnrollmentSchema,
  hrTrainingSchema,
} from "@/lib/validations/hr";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

const HR_PATHS = [
  "/hr",
  "/hr/employees",
  "/hr/id-cards",
  "/hr/departments",
  "/hr/leave",
  "/hr/attendance",
  "/hr/payroll",
  "/hr/performance",
  "/hr/training",
  "/hr/assets",
  "/hr/recruitment",
  "/hr/settings",
];

function revalidateHr() {
  for (const p of HR_PATHS) revalidatePath(p);
}

async function assertHrPermission(
  branchId: string,
  permission: HrPermissionName
) {
  const session = await auth();
  if (!session?.user || !canAccessHr(session.user.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }

  if (
    session.user.role !== UserRole.SUPER_ADMIN &&
    session.user.branchId !== branchId
  ) {
    return { ok: false as const, error: "You can only manage HR for your branch." };
  }

  const allowed = await userHasHrPermission(
    session.user.id,
    session.user.role,
    permission
  );
  if (!allowed) {
    return {
      ok: false as const,
      error: "Your HR role does not have permission for this action. Contact your HR Manager.",
    };
  }

  return { ok: true as const, session };
}

function parseDate(s?: string) {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// ─── Departments & designations ───────────────────────────────────────────────

export async function saveHrDepartment(
  formData: FormData,
  id?: string
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrDepartmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const gate = await assertHrPermission(d.branchId, HR_PERMISSIONS.DEPARTMENTS_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  if (id) {
    await prisma.hrDepartment.update({
      where: { id },
      data: { name: d.name, description: d.description || null },
    });
  } else {
    await prisma.hrDepartment.create({
      data: {
        branchId: d.branchId,
        name: d.name,
        description: d.description || null,
      },
    });
  }
  revalidateHr();
  return { success: true, message: id ? "Department updated." : "Department created." };
}

export async function deleteHrDepartment(id: string): Promise<ActionResult> {
  const dept = await prisma.hrDepartment.findUnique({ where: { id } });
  if (!dept) return { success: false, error: "Department not found." };
  const gate = await assertHrPermission(dept.branchId, HR_PERMISSIONS.DEPARTMENTS_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  const count = await prisma.hrEmployee.count({ where: { departmentId: id } });
  if (count > 0) {
    return { success: false, error: "Remove employees from this department first." };
  }

  await prisma.hrDepartment.delete({ where: { id } });
  revalidateHr();
  return { success: true, message: "Department deleted." };
}

export async function saveHrDesignation(
  formData: FormData,
  id?: string
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrDesignationSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const gate = await assertHrPermission(d.branchId, HR_PERMISSIONS.DEPARTMENTS_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  if (id) {
    await prisma.hrDesignation.update({
      where: { id },
      data: { title: d.title, salaryGrade: d.salaryGrade || null },
    });
  } else {
    await prisma.hrDesignation.create({
      data: {
        branchId: d.branchId,
        title: d.title,
        salaryGrade: d.salaryGrade || null,
      },
    });
  }
  revalidateHr();
  return { success: true, message: id ? "Designation updated." : "Designation created." };
}

export async function deleteHrDesignation(id: string): Promise<ActionResult> {
  const row = await prisma.hrDesignation.findUnique({ where: { id } });
  if (!row) return { success: false, error: "Designation not found." };
  const gate = await assertHrPermission(row.branchId, HR_PERMISSIONS.DEPARTMENTS_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  const count = await prisma.hrEmployee.count({ where: { designationId: id } });
  if (count > 0) {
    return { success: false, error: "Reassign employees before deleting this designation." };
  }

  await prisma.hrDesignation.delete({ where: { id } });
  revalidateHr();
  return { success: true, message: "Designation deleted." };
}

// ─── Employees ────────────────────────────────────────────────────────────────

export async function getNextHrEmployeeCode(
  branchId: string,
  portalRole?: string
): Promise<{ code: string } | { error: string }> {
  const session = await auth();
  if (!session?.user || !canAccessHr(session.user.role)) {
    return { error: "Unauthorized" };
  }
  try {
    const role =
      portalRole && portalRole in UserRole
        ? (portalRole as UserRole)
        : undefined;
    const code = await generateHrEmployeeCode(branchId, role);
    return { code };
  } catch {
    return { error: "Could not generate employee code." };
  }
}

export async function saveHrEmployee(
  formData: FormData,
  id?: string
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const subjectIds = formData.getAll("subjectIds").map(String).filter(Boolean);
  const parsed = hrEmployeeSchema.safeParse({
    ...raw,
    grantPortalAccess: raw.grantPortalAccess === "on" || raw.grantPortalAccess === "true",
    portalRole: raw.portalRole ? String(raw.portalRole) : undefined,
    subjectIds,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const gate = await assertHrPermission(d.branchId, HR_PERMISSIONS.EMPLOYEES_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  const employeeCode =
    d.employeeCode?.trim() ||
    (await generateHrEmployeeCode(d.branchId, d.portalRole ?? null));

  let departmentId = d.departmentId || null;
  if (d.portalRole && !departmentId) {
    departmentId = await resolveDepartmentIdForRole(d.branchId, d.portalRole);
  }

  let designationId = d.designationId || null;
  if (d.designationTitle?.trim()) {
    designationId = await resolveDesignationId(d.branchId, d.designationTitle);
  } else if (d.portalRole && d.portalRole !== UserRole.TEACHER && !designationId) {
    const title =
      STAFF_DESIGNATION_BY_ROLE[
        d.portalRole as keyof typeof STAFF_DESIGNATION_BY_ROLE
      ];
    if (title) designationId = await resolveDesignationId(d.branchId, title);
  }

  const data = {
    branchId: d.branchId,
    departmentId,
    designationId,
    employeeCode,
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    phone: d.phone || null,
    employmentType: d.employmentType,
    status: d.status,
    joiningDate: parseDate(d.joiningDate),
  };

  if (id) {
    await prisma.hrEmployee.update({ where: { id }, data });
    const docUploads = parseEmployeeDocumentUploads(formData);
    const docResult = await saveHrEmployeeDocuments(id, docUploads);
    const docNote =
      docResult.saved > 0
        ? ` ${docResult.saved} file(s) uploaded.`
        : docResult.errors.length > 0
          ? ` Files: ${docResult.errors.join(" ")}`
          : "";
    revalidateHr();
    return {
      success: true,
      message: `Employee updated.${docNote}`.trim(),
    };
  }

  let userId: string | undefined;
  let portalMessage = "";

  if (d.grantPortalAccess && d.portalRole) {
    const dept = d.departmentId
      ? await prisma.hrDepartment.findUnique({
          where: { id: d.departmentId },
          select: { name: true },
        })
      : null;

    userId = await createPortalUserForHrEmployee({
      branchId: d.branchId,
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      portalRole: d.portalRole,
      departmentName: dept?.name ?? "Academic",
      subjectIds: d.subjectIds,
    });
    portalMessage =
      " Portal login created — staff must change password on first login.";
  }

  const employee = await prisma.hrEmployee.create({
    data: { ...data, userId: userId ?? null },
  });

  const docUploads = parseEmployeeDocumentUploads(formData);
  const docResult = await saveHrEmployeeDocuments(employee.id, docUploads);
  const docNote =
    docResult.saved > 0
      ? ` ${docResult.saved} file(s) saved.`
      : docResult.errors.length > 0
        ? ` File warnings: ${docResult.errors.join(" ")}`
        : "";

  revalidateHr();
  return {
    success: true,
    message: `Employee created.${portalMessage}${docNote}`.trim(),
  };
}

export async function deleteHrEmployeeDocument(
  documentId: string
): Promise<ActionResult> {
  const doc = await prisma.hrEmployeeDocument.findUnique({
    where: { id: documentId },
    include: { employee: { select: { branchId: true } } },
  });
  if (!doc) return { success: false, error: "Document not found." };

  const gate = await assertHrPermission(
    doc.employee.branchId,
    HR_PERMISSIONS.EMPLOYEES_WRITE
  );
  if (!gate.ok) return { success: false, error: gate.error };

  if (doc.fileUrl.startsWith("/uploads/hr-documents/")) {
    const relative = doc.fileUrl.replace(/^\//, "");
    const filePath = path.join(process.cwd(), "public", relative);
    try {
      await unlink(filePath);
    } catch {
      // File may already be removed from disk
    }
  }

  await prisma.hrEmployeeDocument.delete({ where: { id: documentId } });
  revalidateHr();
  return { success: true, message: "Document removed." };
}

async function createPortalUserForHrEmployee(input: {
  branchId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  portalRole: UserRole;
  departmentName?: string;
  subjectIds?: string[];
}): Promise<string> {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (
    input.portalRole === UserRole.TEACHER ||
    input.portalRole === UserRole.FINANCE_OFFICER ||
    input.portalRole === UserRole.LIBRARIAN
  ) {
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: input.portalRole,
          branchId: input.branchId,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone || null,
        },
      });
      return existing.id;
    }
    const result = await createEnrolledUser({
      branchId: input.branchId,
      role: input.portalRole,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      department:
        input.portalRole === UserRole.TEACHER
          ? input.departmentName ?? "Academic"
          : input.departmentName,
      subjectIds:
        input.portalRole === UserRole.TEACHER ? input.subjectIds : undefined,
    });
    return result.userId;
  }

  if (input.portalRole === UserRole.REGISTRAR) {
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: input.portalRole,
          branchId: input.branchId,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone || null,
        },
      });
      return existing.id;
    }
    const otp = generateOneTimePassword();
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(otp, 10),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        role: input.portalRole,
        branchId: input.branchId,
        mustChangePassword: true,
        pendingOtp: otp,
        otpIssuedAt: new Date(),
      },
    });
    return user.id;
  }

  throw new Error(`Unsupported portal role: ${input.portalRole}`);
}

async function assignHrInternalRole(userId: string, hrRoleName?: string) {
  await ensureHrRbacDefaults();
  const role = await prisma.hrRole.findUnique({
    where: { name: hrRoleName || HR_MANAGER_ROLE_NAME },
  });
  if (role) {
    await prisma.hrUserRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      create: { userId, roleId: role.id },
      update: {},
    });
  }
}

export async function deleteHrEmployee(id: string): Promise<ActionResult> {
  const emp = await prisma.hrEmployee.findUnique({ where: { id } });
  if (!emp) return { success: false, error: "Employee not found." };
  const gate = await assertHrPermission(emp.branchId, HR_PERMISSIONS.EMPLOYEES_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  await prisma.hrEmployee.delete({ where: { id } });
  revalidateHr();
  return { success: true, message: "Employee removed." };
}

// ─── Leave ─────────────────────────────────────────────────────────────────────

export async function saveHrLeaveType(
  formData: FormData,
  id?: string
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrLeaveTypeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const gate = await assertHrPermission(d.branchId, HR_PERMISSIONS.LEAVE_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  if (id) {
    await prisma.hrLeaveType.update({
      where: { id },
      data: { name: d.name, maxDays: d.maxDays },
    });
  } else {
    await prisma.hrLeaveType.create({ data: d });
  }
  revalidateHr();
  return { success: true, message: "Leave type saved." };
}

export async function createHrLeaveRequest(
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrLeaveRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const emp = await prisma.hrEmployee.findUnique({
    where: { id: d.employeeId },
    select: { branchId: true },
  });
  if (!emp) return { success: false, error: "Employee not found." };

  const gate = await assertHrPermission(emp.branchId, HR_PERMISSIONS.LEAVE_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  await prisma.hrLeaveRequest.create({
    data: {
      employeeId: d.employeeId,
      leaveTypeId: d.leaveTypeId,
      startDate: parseDate(d.startDate)!,
      endDate: parseDate(d.endDate)!,
      remarks: d.remarks || null,
      status: HrLeaveRequestStatus.PENDING,
    },
  });
  revalidateHr();
  return { success: true, message: "Leave request submitted." };
}

export async function updateHrLeaveStatus(
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrLeaveStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const req = await prisma.hrLeaveRequest.findUnique({
    where: { id: d.requestId },
    include: { employee: { select: { branchId: true } } },
  });
  if (!req) return { success: false, error: "Request not found." };

  const gate = await assertHrPermission(
    req.employee.branchId,
    HR_PERMISSIONS.LEAVE_APPROVE
  );
  if (!gate.ok) return { success: false, error: gate.error };

  await prisma.hrLeaveRequest.update({
    where: { id: d.requestId },
    data: {
      status: d.status,
      approverId: gate.session.user.id,
    },
  });
  revalidateHr();
  return { success: true, message: `Leave ${d.status.toLowerCase()}.` };
}

// ─── Attendance ─────────────────────────────────────────────────────────────────

export async function recordHrAttendance(
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrAttendanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const emp = await prisma.hrEmployee.findUnique({
    where: { id: d.employeeId },
    select: { branchId: true },
  });
  if (!emp) return { success: false, error: "Employee not found." };

  const gate = await assertHrPermission(emp.branchId, HR_PERMISSIONS.ATTENDANCE_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  const date = parseDate(d.attendanceDate)!;
  await prisma.hrEmployeeAttendance.upsert({
    where: {
      employeeId_attendanceDate: {
        employeeId: d.employeeId,
        attendanceDate: date,
      },
    },
    create: {
      employeeId: d.employeeId,
      attendanceDate: date,
      checkIn: d.checkIn ? new Date(`1970-01-01T${d.checkIn}`) : null,
      checkOut: d.checkOut ? new Date(`1970-01-01T${d.checkOut}`) : null,
      method: d.method,
      overtimeMinutes: d.overtimeMinutes,
    },
    update: {
      checkIn: d.checkIn ? new Date(`1970-01-01T${d.checkIn}`) : null,
      checkOut: d.checkOut ? new Date(`1970-01-01T${d.checkOut}`) : null,
      method: d.method,
      overtimeMinutes: d.overtimeMinutes,
    },
  });
  revalidateHr();
  return { success: true, message: "Attendance recorded." };
}

// ─── Payroll ────────────────────────────────────────────────────────────────────

export async function saveHrSalary(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrSalarySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const emp = await prisma.hrEmployee.findUnique({
    where: { id: d.employeeId },
    select: { branchId: true },
  });
  if (!emp) return { success: false, error: "Employee not found." };

  const gate = await assertHrPermission(emp.branchId, HR_PERMISSIONS.PAYROLL_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  await prisma.hrSalaryStructure.upsert({
    where: { employeeId: d.employeeId },
    create: {
      employeeId: d.employeeId,
      baseSalary: d.baseSalary,
      allowances: d.allowances,
      taxPercentage: d.taxPercentage,
      pensionPercentage: d.pensionPercentage,
    },
    update: {
      baseSalary: d.baseSalary,
      allowances: d.allowances,
      taxPercentage: d.taxPercentage,
      pensionPercentage: d.pensionPercentage,
    },
  });
  revalidateHr();
  return { success: true, message: "Salary structure saved." };
}

export async function runHrPayroll(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrPayrollRunSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const gate = await assertHrPermission(d.branchId, HR_PERMISSIONS.PAYROLL_RUN);
  if (!gate.ok) return { success: false, error: gate.error };

  const employees = await prisma.hrEmployee.findMany({
    where: { branchId: d.branchId, status: "ACTIVE" },
    include: { salary: true },
  });

  let created = 0;
  for (const emp of employees) {
    if (!emp.salary) continue;
    const base = Number(emp.salary.baseSalary);
    const allow = Number(emp.salary.allowances);
    const gross = base + allow;
    const tax = gross * (Number(emp.salary.taxPercentage) / 100);
    const pension = gross * (Number(emp.salary.pensionPercentage) / 100);
    const deductions = tax + pension;
    const net = gross - deductions;

    await prisma.hrPayrollRecord.upsert({
      where: {
        employeeId_payrollMonth: {
          employeeId: emp.id,
          payrollMonth: d.payrollMonth,
        },
      },
      create: {
        employeeId: emp.id,
        payrollMonth: d.payrollMonth,
        grossSalary: gross,
        deductions,
        netSalary: net,
      },
      update: {
        grossSalary: gross,
        deductions,
        netSalary: net,
      },
    });
    created++;
  }

  revalidateHr();
  return {
    success: true,
    message: `Payroll run for ${d.payrollMonth}: ${created} employee(s) processed.`,
  };
}

// ─── Training, assets, recruitment, performance ───────────────────────────────

export async function saveHrTraining(
  formData: FormData,
  id?: string
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrTrainingSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const gate = await assertHrPermission(d.branchId, HR_PERMISSIONS.TRAINING_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  const payload = {
    branchId: d.branchId,
    title: d.title,
    description: d.description || null,
    startDate: parseDate(d.startDate),
    endDate: parseDate(d.endDate),
  };

  if (id) {
    await prisma.hrTraining.update({ where: { id }, data: payload });
  } else {
    await prisma.hrTraining.create({ data: payload });
  }
  revalidateHr();
  return { success: true, message: "Training saved." };
}

export async function enrollHrTraining(
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrTrainingEnrollmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const training = await prisma.hrTraining.findUnique({
    where: { id: d.trainingId },
    select: { branchId: true },
  });
  if (!training) return { success: false, error: "Training not found." };

  const gate = await assertHrPermission(training.branchId, HR_PERMISSIONS.TRAINING_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  await prisma.hrTrainingEnrollment.upsert({
    where: {
      trainingId_employeeId: {
        trainingId: d.trainingId,
        employeeId: d.employeeId,
      },
    },
    create: {
      trainingId: d.trainingId,
      employeeId: d.employeeId,
      status: d.status,
    },
    update: { status: d.status },
  });
  revalidateHr();
  return { success: true, message: "Enrollment saved." };
}

export async function saveHrAsset(
  formData: FormData,
  id?: string
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrAssetSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const gate = await assertHrPermission(d.branchId, HR_PERMISSIONS.ASSETS_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  if (id) {
    await prisma.hrAsset.update({
      where: { id },
      data: {
        assetName: d.assetName,
        assetType: d.assetType,
        serialNumber: d.serialNumber || null,
        status: d.status,
      },
    });
  } else {
    await prisma.hrAsset.create({
      data: {
        branchId: d.branchId,
        assetName: d.assetName,
        assetType: d.assetType,
        serialNumber: d.serialNumber || null,
        status: d.status,
      },
    });
  }
  revalidateHr();
  return { success: true, message: "Asset saved." };
}

export async function saveHrJobPost(
  formData: FormData,
  id?: string
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrJobPostSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const gate = await assertHrPermission(d.branchId, HR_PERMISSIONS.RECRUITMENT_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  const payload = {
    branchId: d.branchId,
    departmentId: d.departmentId || null,
    title: d.title,
    description: d.description || null,
    closingDate: parseDate(d.closingDate),
    status: d.status,
  };

  if (id) {
    await prisma.hrJobPost.update({ where: { id }, data: payload });
  } else {
    await prisma.hrJobPost.create({ data: payload });
  }
  revalidateHr();
  return { success: true, message: "Job post saved." };
}

export async function saveHrCandidate(
  formData: FormData,
  id?: string
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrCandidateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const job = await prisma.hrJobPost.findUnique({
    where: { id: d.jobPostId },
    select: { branchId: true },
  });
  if (!job) return { success: false, error: "Job post not found." };

  const gate = await assertHrPermission(job.branchId, HR_PERMISSIONS.RECRUITMENT_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  if (id) {
    await prisma.hrCandidate.update({
      where: { id },
      data: { fullName: d.fullName, email: d.email, status: d.status },
    });
  } else {
    await prisma.hrCandidate.create({
      data: {
        jobPostId: d.jobPostId,
        fullName: d.fullName,
        email: d.email,
        status: d.status,
      },
    });
  }
  revalidateHr();
  return { success: true, message: "Candidate saved." };
}

export async function saveHrPerformanceReview(
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrPerformanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  const emp = await prisma.hrEmployee.findUnique({
    where: { id: d.employeeId },
    select: { branchId: true },
  });
  if (!emp) return { success: false, error: "Employee not found." };

  const gate = await assertHrPermission(emp.branchId, HR_PERMISSIONS.PERFORMANCE_WRITE);
  if (!gate.ok) return { success: false, error: gate.error };

  await prisma.hrPerformanceReview.create({
    data: {
      employeeId: d.employeeId,
      reviewPeriod: d.reviewPeriod,
      kpiScore: d.kpiScore ?? null,
      feedback: d.feedback || null,
      promotionRecommended: d.promotionRecommended ?? false,
      reviewerId: gate.session.user.id,
    },
  });
  revalidateHr();
  return { success: true, message: "Performance review recorded." };
}

// ─── HR roles (HR Manager) ──────────────────────────────────────────────────────

export async function assignHrRole(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrAssignRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;

  const session = await auth();
  if (!session?.user || !canAccessHr(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const target = await prisma.user.findUnique({
    where: { id: d.userId },
    select: { branchId: true, role: true },
  });
  if (!target?.branchId) {
    return { success: false, error: "User not found." };
  }

  if (
    session.user.role !== UserRole.SUPER_ADMIN &&
    session.user.branchId !== target.branchId
  ) {
    return { success: false, error: "You can only assign roles in your branch." };
  }

  const canManage = await userHasHrPermission(
    session.user.id,
    session.user.role,
    HR_PERMISSIONS.ROLES_MANAGE
  );
  if (!canManage) {
    return {
      success: false,
      error: "Only HR Manager (or branch/super admin) can assign HR roles.",
    };
  }

  await ensureHrRbacDefaults();
  const role = await prisma.hrRole.findUnique({ where: { name: d.roleName } });
  if (!role) return { success: false, error: "HR role not found." };

  await prisma.hrUserRole.deleteMany({ where: { userId: d.userId } });
  await prisma.hrUserRole.create({
    data: { userId: d.userId, roleId: role.id },
  });

  revalidateHr();
  return { success: true, message: `Assigned ${d.roleName} to user.` };
}

export async function initHrRbac(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !isHrPortalAdmin(session.user.role)) {
    return { success: false, error: "Only branch or super admin can initialize HR roles." };
  }
  await ensureHrRbacDefaults();
  revalidateHr();
  return { success: true, message: "HR roles and permissions initialized." };
}
