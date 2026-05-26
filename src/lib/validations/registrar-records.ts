import { z } from "zod";
import { UserRole } from "@prisma/client";

const updatableRoles = [
  UserRole.STUDENT,
  UserRole.TEACHER,
  UserRole.FINANCE_OFFICER,
  UserRole.LIBRARIAN,
  UserRole.PARENT,
  UserRole.REGISTRAR,
] as const;

export const updateEnrollmentRecordSchema = z.object({
  userId: z.string().min(1),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  isActive: z.coerce.boolean(),
});

export { updatableRoles };
