"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/actions/enrollment";

const MANAGE_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.BRANCH_ADMIN,
  UserRole.REGISTRAR,
];

function canManage(role: UserRole) {
  return MANAGE_ROLES.includes(role);
}

async function generateCardNumber(branchId: string, branchCode: string) {
  const year = new Date().getFullYear();
  const code = branchCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "BR";
  const prefix = `ID-${code}-${year}`;
  const count = await prisma.studentIdCard.count({ where: { branchId } });

  for (let i = count + 1; i < count + 10000; i += 1) {
    const cardNumber = `${prefix}-${String(i).padStart(4, "0")}`;
    const existing = await prisma.studentIdCard.findUnique({
      where: { branchId_cardNumber: { branchId, cardNumber } },
      select: { id: true },
    });
    if (!existing) return cardNumber;
  }

  throw new Error("Could not generate a unique ID card number.");
}

export async function generateStudentIdCard(
  formData: FormData
): Promise<ActionResult<{ cardId: string; cardNumber: string }>> {
  try {
    const session = await auth();
    if (!session?.user || !canManage(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const studentRecordId = String(formData.get("studentRecordId") ?? "");
    if (!studentRecordId) return { success: false, error: "Select a student." };

    const expiresAtRaw = String(formData.get("expiresAt") ?? "");
    const notes = String(formData.get("notes") ?? "").trim();

    const student = await prisma.student.findUnique({
      where: { id: studentRecordId },
      include: { branch: { select: { id: true, code: true } } },
    });
    if (!student) return { success: false, error: "Student not found." };

    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.branchId !== student.branchId
    ) {
      return { success: false, error: "You can only generate cards for your branch." };
    }

    const cardNumber = await generateCardNumber(student.branchId, student.branch.code);
    const card = await prisma.studentIdCard.create({
      data: {
        branchId: student.branchId,
        studentId: student.id,
        cardNumber,
        expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
        notes: notes || null,
        createdById: session.user.id,
      },
    });

    revalidatePath("/registrar/id-cards");

    return {
      success: true,
      message: `ID card generated for ${student.firstName} ${student.lastName}.`,
      data: { cardId: card.id, cardNumber },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate ID card.",
    };
  }
}
