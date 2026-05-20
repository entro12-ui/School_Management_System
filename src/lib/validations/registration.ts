import { z } from "zod";
import { SeniorStream } from "@prisma/client";

const baseFields = {
  branchId: z.string().min(1, "Select a branch"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().optional(),
};

const passwordMatch = (data: { password: string; confirmPassword: string }) =>
  data.password === data.confirmPassword;

export const studentRegistrationSchema = z
  .object({
    ...baseFields,
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["Male", "Female"], { message: "Select gender" }),
    gradeLevel: z.coerce.number().int().min(0).max(12),
    stream: z.nativeEnum(SeniorStream).optional(),
    guardianName: z.string().min(2, "Guardian name is required"),
    guardianPhone: z.string().min(10, "Guardian phone is required"),
  })
  .refine(passwordMatch, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.gradeLevel < 11 || !!d.stream, {
    message: "Stream is required for Grade 11–12",
    path: ["stream"],
  });

export const teacherRegistrationSchema = z
  .object({
    ...baseFields,
    department: z.string().min(2, "Department or subject area is required"),
    subjectIds: z
      .array(z.string().min(1))
      .min(1, "Select at least one subject to teach"),
  })
  .refine(passwordMatch, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const financeRegistrationSchema = z
  .object({
    ...baseFields,
    department: z.string().default("Finance"),
  })
  .refine(passwordMatch, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const librarianRegistrationSchema = z
  .object({
    ...baseFields,
    department: z.string().default("Library"),
  })
  .refine(passwordMatch, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const parentRegistrationSchema = z
  .object({
    ...baseFields,
  })
  .refine(passwordMatch, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type StudentRegistrationInput = z.infer<typeof studentRegistrationSchema>;
export type TeacherRegistrationInput = z.infer<typeof teacherRegistrationSchema>;
export type FinanceRegistrationInput = z.infer<typeof financeRegistrationSchema>;
export type LibrarianRegistrationInput = z.infer<typeof librarianRegistrationSchema>;
export type ParentRegistrationInput = z.infer<typeof parentRegistrationSchema>;
