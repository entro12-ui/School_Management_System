import type { Prisma } from "@prisma/client";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { EnrollUserResult } from "@/lib/services/enrollment";
import { provisionHrEmployeeForUser } from "@/lib/services/hr-employee-provision";
import { generateOneTimePassword } from "@/lib/otp";

export async function createHrManagerFromApproval(
  request: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    branchId: string;
  },
  tx: Prisma.TransactionClient
): Promise<EnrollUserResult> {
  const email = request.email.toLowerCase().trim();
  const oneTimePassword = generateOneTimePassword();
  const passwordHash = await bcrypt.hash(oneTimePassword, 10);

  const user = await tx.user.create({
    data: {
      email,
      passwordHash,
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
      phone: request.phone?.trim() || null,
      role: UserRole.HR_OFFICER,
      branchId: request.branchId,
      isActive: true,
      mustChangePassword: true,
      pendingOtp: oneTimePassword,
      otpIssuedAt: new Date(),
    },
  });

  await provisionHrEmployeeForUser(tx, {
    userId: user.id,
    branchId: request.branchId,
    email,
    firstName: request.firstName,
    lastName: request.lastName,
    phone: request.phone,
    asHrManager: true,
  });

  return { userId: user.id, email, oneTimePassword };
}
