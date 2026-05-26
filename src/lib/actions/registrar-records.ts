"use server";

import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { generateOneTimePassword } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { updateEnrollmentRecordSchema } from "@/lib/validations/registrar-records";
import type { ActionResult } from "@/lib/actions/enrollment";

const MANAGE_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.REGISTRAR,
];

function canManage(role: UserRole) {
  return MANAGE_ROLES.includes(role);
}

async function assertCanManageUser(userId: string, branchId: string | null) {
  const session = await auth();
  if (!session?.user || !canManage(session.user.role)) {
    throw new Error("Unauthorized");
  }
  if (
    session.user.role !== UserRole.SUPER_ADMIN &&
    session.user.branchId !== branchId
  ) {
    throw new Error("You can only manage users in your branch.");
  }
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("User not found.");
  if (
    target.role === UserRole.SUPER_ADMIN ||
    target.role === UserRole.BRANCH_ADMIN
  ) {
    throw new Error("Cannot modify administrator accounts from the registrar desk.");
  }
  return { session, target };
}

export async function updateEnrollmentRecord(
  formData: FormData
): Promise<ActionResult> {
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = updateEnrollmentRecordSchema.safeParse({
      ...raw,
      isActive: raw.isActive === "true" || raw.isActive === "on",
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
    }

    const target = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      include: { student: { select: { id: true } } },
    });
    if (!target) return { success: false, error: "User not found." };

    await assertCanManageUser(parsed.data.userId, target.branchId);

    const email = parsed.data.email.toLowerCase().trim();
    const duplicate = await prisma.user.findFirst({
      where: { email, NOT: { id: parsed.data.userId } },
    });
    if (duplicate) {
      return { success: false, error: "Another account already uses this email." };
    }

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        firstName: parsed.data.firstName.trim(),
        lastName: parsed.data.lastName.trim(),
        email,
        phone: parsed.data.phone?.trim() || null,
        isActive: parsed.data.isActive,
      },
    });

    if (target.student) {
      await prisma.student.update({
        where: { id: target.student.id },
        data: {
          firstName: parsed.data.firstName.trim(),
          lastName: parsed.data.lastName.trim(),
        },
      });
    }

    revalidatePath("/registrar/records");
    return { success: true, message: "Record updated." };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Update failed.",
    };
  }
}

export async function deleteEnrollmentRecord(userId: string): Promise<ActionResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });
    if (!user) return { success: false, error: "User not found." };

    await assertCanManageUser(userId, user.branchId);

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false, pendingOtp: null },
    });

    revalidatePath("/registrar/records");
    return {
      success: true,
      message: `${user.firstName} ${user.lastName} has been deactivated.`,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Delete failed.",
    };
  }
}

export async function resetEnrollmentOtp(userId: string): Promise<ActionResult<{ otp: string }>> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "User not found." };

    await assertCanManageUser(userId, user.branchId);

    const otp = generateOneTimePassword();
    const passwordHash = await bcrypt.hash(otp, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        pendingOtp: otp,
        otpIssuedAt: new Date(),
        mustChangePassword: true,
      },
    });

    revalidatePath("/registrar/records");
    return {
      success: true,
      message: "New one-time password generated.",
      data: { otp },
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not reset OTP.",
    };
  }
}
