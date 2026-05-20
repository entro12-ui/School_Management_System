import {
  HrAssetStatus,
  HrAttendanceMethod,
  HrCandidateStatus,
  HrEmployeeStatus,
  HrEmploymentType,
  HrJobPostStatus,
  HrLeaveRequestStatus,
  HrTrainingEnrollmentStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

export const hrDepartmentSchema = z.object({
  branchId: z.string().min(1),
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
});

export const hrDesignationSchema = z.object({
  branchId: z.string().min(1),
  title: z.string().min(2, "Title is required"),
  salaryGrade: z.string().optional(),
});

export const hrEmployeeSchema = z.object({
  branchId: z.string().min(1),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  employeeCode: z.string().optional(),
  designationTitle: z.string().optional(),
  subjectIds: z.array(z.string()).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  employmentType: z.nativeEnum(HrEmploymentType),
  status: z.nativeEnum(HrEmployeeStatus),
  joiningDate: z.string().optional(),
  grantPortalAccess: z.coerce.boolean().optional(),
  portalRole: z
    .enum([
      UserRole.TEACHER,
      UserRole.LIBRARIAN,
      UserRole.FINANCE_OFFICER,
      UserRole.REGISTRAR,
    ])
    .optional(),
  hrRoleName: z.string().optional(),
})
  .refine((d) => !d.grantPortalAccess || !!d.portalRole, {
    message: "Select a portal role when creating login",
    path: ["portalRole"],
  })
  .refine(
    (d) =>
      d.portalRole !== UserRole.TEACHER ||
      !!(d.designationTitle?.trim() || d.designationId),
    { message: "Select an academic designation for teachers", path: ["designationTitle"] }
  );

export const hrLeaveTypeSchema = z.object({
  branchId: z.string().min(1),
  name: z.string().min(2),
  maxDays: z.coerce.number().int().min(1).max(365),
});

export const hrLeaveRequestSchema = z.object({
  employeeId: z.string().min(1),
  leaveTypeId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  remarks: z.string().optional(),
});

export const hrAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  attendanceDate: z.string().min(1),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  method: z.nativeEnum(HrAttendanceMethod).default(HrAttendanceMethod.MANUAL),
  overtimeMinutes: z.coerce.number().int().min(0).default(0),
});

export const hrSalarySchema = z.object({
  employeeId: z.string().min(1),
  baseSalary: z.coerce.number().min(0),
  allowances: z.coerce.number().min(0).default(0),
  taxPercentage: z.coerce.number().min(0).max(100).default(0),
  pensionPercentage: z.coerce.number().min(0).max(100).default(0),
});

export const hrPayrollRunSchema = z.object({
  branchId: z.string().min(1),
  payrollMonth: z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM"),
});

export const hrTrainingSchema = z.object({
  branchId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const hrAssetSchema = z.object({
  branchId: z.string().min(1),
  assetName: z.string().min(2),
  assetType: z.string().min(2),
  serialNumber: z.string().optional(),
  status: z.nativeEnum(HrAssetStatus).default(HrAssetStatus.AVAILABLE),
});

export const hrJobPostSchema = z.object({
  branchId: z.string().min(1),
  departmentId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  closingDate: z.string().optional(),
  status: z.nativeEnum(HrJobPostStatus).default(HrJobPostStatus.OPEN),
});

export const hrCandidateSchema = z.object({
  jobPostId: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  status: z.nativeEnum(HrCandidateStatus).default(HrCandidateStatus.APPLIED),
});

export const hrPerformanceSchema = z.object({
  employeeId: z.string().min(1),
  reviewPeriod: z.string().min(2),
  kpiScore: z.coerce.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  promotionRecommended: z
    .union([z.literal("on"), z.literal("true"), z.boolean()])
    .optional()
    .transform((v) => v === "on" || v === "true" || v === true),
});

export const hrAssignRoleSchema = z.object({
  userId: z.string().min(1),
  roleName: z.string().min(2),
});

export const hrLeaveStatusSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum([
    HrLeaveRequestStatus.APPROVED,
    HrLeaveRequestStatus.REJECTED,
    HrLeaveRequestStatus.CANCELLED,
  ]),
});

export const hrTrainingEnrollmentSchema = z.object({
  trainingId: z.string().min(1),
  employeeId: z.string().min(1),
  status: z.nativeEnum(HrTrainingEnrollmentStatus).default(
    HrTrainingEnrollmentStatus.ENROLLED
  ),
});
