import { GradeBand, LibraryBorrowerType } from "@prisma/client";
import { z } from "zod";

export const libraryBookSchema = z.object({
  bookId: z.string().optional(),
  branchId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200),
  author: z.string().max(120).optional(),
  isbn: z.string().max(32).optional(),
  barcode: z.string().max(64).optional(),
  subject: z.string().max(80).optional(),
  category: z.string().max(80).optional(),
  gradeBand: z.nativeEnum(GradeBand).optional(),
  shelfLocation: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  digitalUrl: z.string().url().optional().or(z.literal("")),
  isDigital: z.coerce.boolean().optional(),
  totalCopies: z.coerce.number().int().min(1).max(9999),
});

export const libraryIssueSchema = z.object({
  branchId: z.string().min(1),
  bookId: z.string().min(1),
  borrowerUserId: z.string().min(1),
  borrowerType: z.nativeEnum(LibraryBorrowerType),
  studentId: z.string().optional(),
  gradeLevel: z.coerce.number().int().min(0).max(12),
  dueDate: z.string().optional(),
  studentCodeScan: z.string().optional(),
  bookBarcodeScan: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const libraryReturnSchema = z.object({
  issueId: z.string().min(1),
  fineAmount: z.coerce.number().min(0).optional(),
  waiveFine: z.coerce.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const libraryReservationSchema = z.object({
  branchId: z.string().min(1),
  bookId: z.string().min(1),
});

export const libraryFinePaymentSchema = z.object({
  fineId: z.string().min(1),
  branchId: z.string().min(1),
});

export const libraryReadingLogSchema = z.object({
  branchId: z.string().min(1),
  studentId: z.string().min(1),
  bookId: z.string().optional(),
  bookTitle: z.string().min(1).max(200),
  badgeLevel: z.string().max(40).optional(),
});
