"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { assertSuperAdminCanAccessBranch } from "@/lib/auth/super-admin-scope";
import { gradeBandForDepartment } from "@/lib/academic-catalog";
import { gradeLevelToBand } from "@/lib/grade-utils";
import {
  createEnrolledUser,
  type EnrollableRole,
  type EnrollUserResult,
} from "@/lib/services/enrollment";
import {
  enrollUserSchema,
  changePasswordSchema,
  parseAsHrManager,
} from "@/lib/validations/enrollment";
import {
  canActorEnrollRole,
  ENROLL_PHOTO_ROLES,
} from "@/lib/enrollment/enrollable-roles";
import { saveUserPhoto } from "@/lib/upload-avatar";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string };

const ENROLLMENT_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.REGISTRAR,
];

function canEnroll(role: UserRole): boolean {
  return ENROLLMENT_ROLES.includes(role);
}

export async function enrollUser(formData: FormData): Promise<ActionResult<EnrollUserResult>> {
  const session = await auth();
  if (!session?.user || !canEnroll(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const raw = Object.fromEntries(formData.entries());
  const subjectIds = formData.getAll("subjectIds").map(String);
  const parsed = enrollUserSchema.safeParse({ ...raw, subjectIds });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const d = parsed.data;
  const branchId =
    session.user.role === UserRole.SUPER_ADMIN
      ? d.branchId
      : session.user.branchId ?? d.branchId;

  if (!branchId) {
    return { success: false, error: "Branch is required." };
  }

  if (!canActorEnrollRole(session.user.role, d.role)) {
    return { success: false, error: "You are not allowed to enroll this role." };
  }

  if (
    session.user.role === UserRole.SUPER_ADMIN &&
    !(await assertSuperAdminCanAccessBranch(session.user, branchId)).ok
  ) {
    return { success: false, error: "You can only enroll users for branches in your school." };
  }

  if (
    session.user.role !== UserRole.SUPER_ADMIN &&
    session.user.branchId !== branchId
  ) {
    return { success: false, error: "You can only enroll users for your branch." };
  }

  try {
    if (d.role === UserRole.TEACHER && d.department && d.subjectIds?.length) {
      const expectedBand = gradeBandForDepartment(d.department);
      if (!expectedBand) {
        return { success: false, error: "Invalid teaching department." };
      }
      const subjects = await prisma.subject.findMany({
        where: { id: { in: d.subjectIds } },
        select: { id: true, gradeBand: true, name: true },
      });
      const invalid = subjects.filter((s) => s.gradeBand !== expectedBand);
      if (invalid.length > 0) {
        return {
          success: false,
          error: `Subjects must match department ${d.department}. Remove: ${invalid.map((s) => s.name).join(", ")}`,
        };
      }
    }

    const gradeBand =
      d.gradeLevel !== undefined ? gradeLevelToBand(d.gradeLevel) : undefined;

    const result = await createEnrolledUser({
      branchId,
      role: d.role as EnrollableRole,
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : undefined,
      gender: d.gender,
      gradeLevel: d.gradeLevel,
      gradeBand,
      stream: d.stream,
      guardianName: d.guardianName,
      guardianPhone: d.guardianPhone,
      department: d.department,
      subjectIds: d.subjectIds,
      asHrManager:
        d.role === UserRole.HR_OFFICER ? parseAsHrManager(d.asHrManager) : undefined,
    });

    let photoNote = "";
    const photo = formData.get("photo");
    if (ENROLL_PHOTO_ROLES.has(d.role) && photo instanceof File && photo.size > 0) {
      try {
        await saveUserPhoto(result.userId, photo);
        photoNote = " Profile photo saved.";
      } catch (photoError) {
        photoNote =
          photoError instanceof Error
            ? ` Photo not saved: ${photoError.message}`
            : " Photo could not be saved.";
      }
    }

    revalidatePath("/registrar");
    revalidatePath("/registrar/enroll");
    revalidatePath("/registrar/records");
    revalidatePath("/branch");
    revalidatePath("/hr");
    revalidatePath("/hr/employees");

    return {
      success: true,
      message: `Account created for ${d.firstName} ${d.lastName}. Share the one-time password securely.${photoNote}`,
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Enrollment failed.",
    };
  }
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be signed in." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { success: false, error: "User not found." };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      pendingOtp: null,
      otpIssuedAt: null,
    },
  });

  return {
    success: true,
    message: "Password updated. You can continue using the portal.",
  };
}
