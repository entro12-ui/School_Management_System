import { z } from "zod";

export const schoolSuperAdminAccountSchema = z
  .object({
    signupRequestId: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SchoolSuperAdminAccountInput = z.infer<typeof schoolSuperAdminAccountSchema>;
