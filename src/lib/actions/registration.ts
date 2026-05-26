"use server";

import {
  RegistrationRole,
  RegistrationStatus,
  UserRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRegistrarFromApproval } from "@/lib/services/enrollment";
import { createHrManagerFromApproval } from "@/lib/services/hr-manager-approval";
import {
  hrManagerApplicationSchema,
  registrarApplicationSchema,
} from "@/lib/validations/enrollment";

export type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string };

const REGISTRATION_TX_OPTIONS = {
  maxWait: 10_000,
  timeout: 30_000,
} as const;

const APPROVAL_ROLES: RegistrationRole[] = ["REGISTRAR", "HR_MANAGER"];

async function emailAvailable(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({ where: { email: normalized } });
  if (existingUser) return false;

  const pending = await prisma.registrationRequest.findFirst({
    where: { email: normalized, status: RegistrationStatus.PENDING },
  });
  return !pending;
}

async function submitApplication(
  applicationRole: RegistrationRole,
  data: {
    branchId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  },
  successMessage: string,
  duplicateMessage: string
): Promise<ActionResult> {
  const available = await emailAvailable(data.email);
  if (!available) {
    return { success: false, error: duplicateMessage };
  }

  const branch = await prisma.branch.findFirst({
    where: { id: data.branchId, isActive: true },
  });
  if (!branch) {
    return { success: false, error: "Invalid branch selected." };
  }

  await prisma.registrationRequest.create({
    data: {
      branchId: data.branchId,
      role: applicationRole,
      email: data.email.toLowerCase().trim(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim() || null,
    },
  });

  revalidatePath("/branch/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/branch");
  revalidatePath("/admin");

  return { success: true, message: successMessage };
}

/** Public: apply for registrar office (branch / super admin approval). */
export async function registerRegistrar(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = registrarApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  return submitApplication(
    "REGISTRAR" as RegistrationRole,
    d,
    "Registrar application submitted. A branch or super admin will review it. You will receive a one-time password after approval.",
    "This email is already in use or has a pending application."
  );
}

/** Public: apply to become HR Manager (branch / super admin approval). */
export async function registerHrManager(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = hrManagerApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid form" };
  }
  const d = parsed.data;
  return submitApplication(
    "HR_MANAGER" as RegistrationRole,
    d,
    "HR Manager application submitted. A branch or super admin will review it. You will receive a one-time password after approval.",
    "This email is already in use or has a pending application."
  );
}

/** Branch / super admin approve registrar or HR Manager applications. */
export async function approveRegistration(
  requestId: string
): Promise<ActionResult<{ email: string; oneTimePassword: string }>> {
  const session = await auth();
  if (
    !session?.user ||
    !["BRANCH_ADMIN", "SUPER_ADMIN"].includes(session.user.role)
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const request = await prisma.registrationRequest.findUnique({
    where: { id: requestId },
    include: { branch: true },
  });

  if (!request || request.status !== RegistrationStatus.PENDING) {
    return { success: false, error: "Application not found or already processed." };
  }

  if (!APPROVAL_ROLES.includes(request.role)) {
    return { success: false, error: "Unsupported application type." };
  }

  if (
    session.user.role === UserRole.BRANCH_ADMIN &&
    session.user.branchId !== request.branchId
  ) {
    return { success: false, error: "You can only approve applications for your branch." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: request.email },
  });
  if (existingUser) {
    return { success: false, error: "A user with this email already exists." };
  }

  let enrollResult!: { userId: string; email: string; oneTimePassword: string };
  const payload = {
    email: request.email,
    firstName: request.firstName,
    lastName: request.lastName,
    phone: request.phone,
    branchId: request.branchId,
  };

  await prisma.$transaction(async (tx) => {
    if (request.role === "REGISTRAR") {
      enrollResult = await createRegistrarFromApproval(payload, tx);
    } else {
      enrollResult = await createHrManagerFromApproval(payload, tx);
    }

    await tx.registrationRequest.update({
      where: { id: requestId },
      data: {
        status: RegistrationStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedById: session.user!.id,
        createdUserId: enrollResult.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        branchId: request.branchId,
        actorId: session.user!.id,
        action:
          request.role === "HR_MANAGER"
            ? "HR_MANAGER_APPROVED"
            : "REGISTRAR_APPROVED",
        entity: "RegistrationRequest",
        entityId: requestId,
        metadata: {
          email: request.email,
          userId: enrollResult.userId,
        },
      },
    });
  }, REGISTRATION_TX_OPTIONS);

  revalidatePath("/branch/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/branch");
  revalidatePath("/admin");
  revalidatePath("/hr");
  revalidatePath("/hr/employees");
  revalidatePath("/registrar/records");

  const roleLabel =
    request.role === "HR_MANAGER" ? "HR Manager" : "registrar";

  return {
    success: true,
    message: `Approved ${request.firstName} ${request.lastName} as ${roleLabel}.`,
    data: enrollResult!,
  };
}

export async function rejectRegistration(
  requestId: string,
  reason: string
): Promise<ActionResult> {
  const session = await auth();
  if (
    !session?.user ||
    !["BRANCH_ADMIN", "SUPER_ADMIN"].includes(session.user.role)
  ) {
    return { success: false, error: "Unauthorized" };
  }

  if (!reason.trim()) {
    return { success: false, error: "Please provide a rejection reason." };
  }

  const request = await prisma.registrationRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.status !== RegistrationStatus.PENDING) {
    return { success: false, error: "Application not found or already processed." };
  }

  if (!APPROVAL_ROLES.includes(request.role)) {
    return { success: false, error: "Unsupported application type." };
  }

  if (
    session.user.role === UserRole.BRANCH_ADMIN &&
    session.user.branchId !== request.branchId
  ) {
    return { success: false, error: "You can only reject applications for your branch." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.registrationRequest.update({
      where: { id: requestId },
      data: {
        status: RegistrationStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: session.user!.id,
        rejectionReason: reason.trim(),
      },
    });
    await tx.auditLog.create({
      data: {
        branchId: request.branchId,
        actorId: session.user!.id,
        action:
          request.role === "HR_MANAGER"
            ? "HR_MANAGER_REJECTED"
            : "REGISTRAR_REJECTED",
        entity: "RegistrationRequest",
        entityId: requestId,
        metadata: { email: request.email, reason: reason.trim() },
      },
    });
  }, REGISTRATION_TX_OPTIONS);

  revalidatePath("/branch/registrations");
  revalidatePath("/admin/registrations");
  revalidatePath("/branch");
  revalidatePath("/admin");

  const roleLabel =
    request.role === "HR_MANAGER" ? "HR Manager" : "Registrar";

  return { success: true, message: `${roleLabel} application rejected.` };
}
