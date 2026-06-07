import { z } from "zod";
import { resolveChapaEmail } from "@/lib/chapa/email";

export const schoolSignupSchema = z.object({
  schoolName: z.string().trim().min(2, "School name is required."),
  city: z.string().trim().min(2, "City is required."),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid contact email.")
    .transform((value) => value.toLowerCase())
    .refine(
      (value) => resolveChapaEmail(value) !== null,
      "Use a standard email address (e.g. name@gmail.com) for payment."
    ),
  contactFirstName: z.string().trim().min(1, "First name is required."),
  contactLastName: z.string().trim().min(1, "Last name is required."),
  estimatedStudents: z.coerce
    .number()
    .int("Student count must be a whole number.")
    .min(1, "Enter at least 1 student.")
    .max(100_000, "Contact us for larger deployments."),
});

export type SchoolSignupInput = z.infer<typeof schoolSignupSchema>;
