"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { HR_PERMISSIONS } from "@/lib/hr/permissions";
import { prisma } from "@/lib/prisma";
import { canAccessHr, userHasHrPermission } from "@/lib/services/hr";

export type HrIdCardActionResult =
  | { success: true; message: string; data?: { cardId: string; cardNumber: string } }
  | { success: false; error: string };

async function assertCanGenerate(branchId: string) {
  const session = await auth();
  if (!session?.user || !canAccessHr(session.user.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (
    session.user.role !== UserRole.SUPER_ADMIN &&
    session.user.branchId !== branchId
  ) {
    return { ok: false as const, error: "You can only manage HR for your branch." };
  }
  const allowed = await userHasHrPermission(
    session.user.id,
    session.user.role,
    HR_PERMISSIONS.EMPLOYEES_WRITE
  );
  if (!allowed) {
    return { ok: false as const, error: "Your HR role cannot generate employee ID cards." };
  }
  return { ok: true as const, session };
}

async function generateEmployeeCardNumber(branchId: string, branchCode: string) {
  const year = new Date().getFullYear();
  const code = branchCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "BR";
  const prefix = `EMPID-${code}-${year}`;
  const count = await prisma.hrEmployeeIdCard.count({ where: { branchId } });

  for (let i = count + 1; i < count + 10000; i += 1) {
    const cardNumber = `${prefix}-${String(i).padStart(4, "0")}`;
    const existing = await prisma.hrEmployeeIdCard.findUnique({
      where: { branchId_cardNumber: { branchId, cardNumber } },
      select: { id: true },
    });
    if (!existing) return cardNumber;
  }

  throw new Error("Could not generate a unique employee ID card number.");
}

export async function generateHrEmployeeIdCard(
  formData: FormData
): Promise<HrIdCardActionResult> {
  try {
    const employeeId = String(formData.get("employeeId") ?? "");
    if (!employeeId) return { success: false, error: "Select an employee." };

    const expiresAtRaw = String(formData.get("expiresAt") ?? "");
    const notes = String(formData.get("notes") ?? "").trim();

    const employee = await prisma.hrEmployee.findUnique({
      where: { id: employeeId },
      include: { branch: { select: { id: true, code: true } } },
    });
    if (!employee) return { success: false, error: "Employee not found." };

    const access = await assertCanGenerate(employee.branchId);
    if (!access.ok) return { success: false, error: access.error };

    const cardNumber = await generateEmployeeCardNumber(
      employee.branchId,
      employee.branch.code
    );
    const card = await prisma.hrEmployeeIdCard.create({
      data: {
        branchId: employee.branchId,
        employeeId: employee.id,
        cardNumber,
        expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
        notes: notes || null,
        createdById: access.session.user.id,
      },
    });

    revalidatePath("/hr/id-cards");
    return {
      success: true,
      message: `Employee ID card generated for ${employee.firstName} ${employee.lastName}.`,
      data: { cardId: card.id, cardNumber },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate employee ID card.",
    };
  }
}
