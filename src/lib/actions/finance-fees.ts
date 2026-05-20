"use server";

import { AcademicTerm, GradeBand, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { canManageFinance } from "@/lib/services/finance";
import {
  DEFAULT_SEMESTER_AMOUNTS,
  feeStructureName,
  GRADE_BAND_ORDER,
} from "@/lib/fee-structures";
import { prisma } from "@/lib/prisma";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

const rowSchema = z.object({
  gradeBand: z.nativeEnum(GradeBand),
  semester1: z.coerce.number().min(0),
  semester2: z.coerce.number().min(0),
});

async function assertFinanceAccess(branchId: string) {
  const session = await auth();
  if (!session?.user || !canManageFinance(session.user.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }

  if (
    session.user.role !== UserRole.SUPER_ADMIN &&
    session.user.branchId !== branchId
  ) {
    return { ok: false as const, error: "You can only manage fees for your branch." };
  }

  return { ok: true as const, session };
}

async function upsertBandTermFee(
  branchId: string,
  gradeBand: GradeBand,
  term: AcademicTerm,
  amount: number
) {
  const existing = await prisma.feeStructure.findFirst({
    where: {
      branchId,
      gradeBand,
      gradeLevel: null,
      term,
    },
  });

  if (existing) {
    return prisma.feeStructure.update({
      where: { id: existing.id },
      data: {
        amount,
        name: feeStructureName(gradeBand, term),
        isActive: true,
      },
    });
  }

  return prisma.feeStructure.create({
    data: {
      branchId,
      gradeBand,
      gradeLevel: null,
      term,
      amount,
      name: feeStructureName(gradeBand, term),
      isActive: true,
    },
  });
}

export async function saveBandSemesterFees(
  branchId: string,
  rows: { gradeBand: GradeBand; semester1: number; semester2: number }[]
): Promise<ActionResult> {
  const access = await assertFinanceAccess(branchId);
  if (!access.ok) return { success: false, error: access.error };

  const parsed = z.array(rowSchema).safeParse(rows);
  if (!parsed.success) {
    return { success: false, error: "Invalid fee amounts." };
  }

  if (parsed.data.length !== GRADE_BAND_ORDER.length) {
    return { success: false, error: "All grade bands are required." };
  }

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return { success: false, error: "Branch not found." };

  for (const row of parsed.data) {
    await upsertBandTermFee(branchId, row.gradeBand, AcademicTerm.SEMESTER_1, row.semester1);
    await upsertBandTermFee(branchId, row.gradeBand, AcademicTerm.SEMESTER_2, row.semester2);
  }

  revalidatePath("/finance/fees");
  revalidatePath("/finance/payments");
  revalidatePath("/finance");

  return {
    success: true,
    message: `Saved semester tuition for all grade bands at ${branch.name}.`,
  };
}

export async function applyDefaultBandSemesterFees(
  branchId: string
): Promise<ActionResult> {
  const rows = GRADE_BAND_ORDER.map((band) => ({
    gradeBand: band,
    semester1: DEFAULT_SEMESTER_AMOUNTS[band],
    semester2: DEFAULT_SEMESTER_AMOUNTS[band],
  }));
  return saveBandSemesterFees(branchId, rows);
}
