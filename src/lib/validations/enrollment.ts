import { z } from "zod";
import { SeniorStream, UserRole } from "@prisma/client";

/** All roles the enrollment desk may assign (super admin gets the full set). */
export const ENROLL_USER_ROLES = [
  UserRole.STUDENT,
  UserRole.TEACHER,
  UserRole.FINANCE_OFFICER,
  UserRole.LIBRARIAN,
  UserRole.PARENT,
  UserRole.REGISTRAR,
  UserRole.HR_OFFICER,
  UserRole.BRANCH_ADMIN,
] as const;

export const enrollUserSchema = z
  .object({
    branchId: z.string().min(1),
    role: z.enum(ENROLL_USER_ROLES),
    asHrManager: z
      .union([z.literal("true"), z.literal("false"), z.literal("on")])
      .optional(),
    email: z.string().email(),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["Male", "Female"]).optional(),
    gradeLevel: z.coerce.number().int().min(0).max(12).optional(),
    stream: z.nativeEnum(SeniorStream).optional(),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
    department: z.string().optional(),
    subjectIds: z.array(z.string()).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.role === UserRole.STUDENT) {
      if (!d.dateOfBirth)
        ctx.addIssue({ code: "custom", message: "Date of birth is required", path: ["dateOfBirth"] });
      if (!d.gender)
        ctx.addIssue({ code: "custom", message: "Gender is required", path: ["gender"] });
      if (d.gradeLevel === undefined)
        ctx.addIssue({ code: "custom", message: "Grade is required", path: ["gradeLevel"] });
      if (!d.guardianName)
        ctx.addIssue({ code: "custom", message: "Guardian name is required", path: ["guardianName"] });
      if (!d.guardianPhone)
        ctx.addIssue({ code: "custom", message: "Guardian phone is required", path: ["guardianPhone"] });
      if ((d.gradeLevel ?? 0) >= 11 && !d.stream)
        ctx.addIssue({ code: "custom", message: "Stream required for Grade 11–12", path: ["stream"] });
    }
    if (d.role === UserRole.TEACHER) {
      if (!d.department?.trim())
        ctx.addIssue({ code: "custom", message: "Department is required", path: ["department"] });
      if (!d.subjectIds?.length)
        ctx.addIssue({ code: "custom", message: "Select at least one subject", path: ["subjectIds"] });
    }
  });

export function parseAsHrManager(value: string | undefined): boolean {
  return value === "true" || value === "on";
}

export const registrarApplicationSchema = z.object({
  branchId: z.string().min(1, "Select a branch"),
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
});

export const hrManagerApplicationSchema = registrarApplicationSchema;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
