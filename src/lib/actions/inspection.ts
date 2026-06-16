"use server";

import { InspectionRunStatus, Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { assertSuperAdminCanAccessBranch } from "@/lib/auth/super-admin-scope";
import { loadFrameworkFromFile } from "@/lib/inspection/framework-server";
import {
  identifyStrengthsAndGaps,
} from "@/lib/inspection/scoring";
import { buildCriterionKey } from "@/lib/inspection/types";
import { prisma } from "@/lib/prisma";
import {
  ensureInspectionFrameworkVersion,
  getInspectionRunDetail,
} from "@/lib/services/inspection";
import { saveInspectionEvidenceFile } from "@/lib/upload-inspection-evidence";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

type InspectionAuthSession = {
  user: {
    id: string;
    role: UserRole;
    branchId: string | null;
    organizationId: string | null;
  };
};

type AccessResult = { ok: true; session: InspectionAuthSession } | { ok: false; error: string };

async function assertInspectionAccess(branchId: string): Promise<AccessResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  if (session.user.role === UserRole.SUPER_ADMIN) {
    const access = await assertSuperAdminCanAccessBranch(session.user, branchId);
    if (!access.ok) return { ok: false, error: access.error };
    return { ok: true, session: session as InspectionAuthSession };
  }

  if (session.user.role === UserRole.BRANCH_ADMIN) {
    if (session.user.branchId !== branchId) {
      return { ok: false, error: "You cannot access inspections for this branch." };
    }
    return { ok: true, session: session as InspectionAuthSession };
  }

  return { ok: false, error: "You do not have permission for inspections." };
}

async function writeInspectionAudit(
  branchId: string,
  actorId: string,
  action: string,
  runId: string,
  metadata?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: {
      branchId,
      actorId,
      action,
      entity: "InspectionRun",
      entityId: runId,
      metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createInspectionRun(input: {
  branchId: string;
  academicYearId?: string | null;
  inspectionDate: string;
  supervisorId?: string | null;
}): Promise<ActionResult & { runId?: string }> {
  const access = await assertInspectionAccess(input.branchId);
  if (!access.ok) return { success: false, error: access.error };

  const inspectionDate = new Date(input.inspectionDate);
  if (Number.isNaN(inspectionDate.getTime())) {
    return { success: false, error: "Invalid inspection date." };
  }

  const frameworkVersion = await ensureInspectionFrameworkVersion();

  const run = await prisma.inspectionRun.create({
    data: {
      branchId: input.branchId,
      frameworkVersionId: frameworkVersion.id,
      academicYearId: input.academicYearId || null,
      inspectorId: access.session!.user.id,
      supervisorId: input.supervisorId || null,
      inspectionDate,
      status: InspectionRunStatus.IN_PROGRESS,
    },
  });

  await writeInspectionAudit(
    input.branchId,
    access.session!.user.id,
    "INSPECTION_RUN_CREATED",
    run.id
  );

  revalidatePath("/branch/inspection");
  revalidatePath("/admin/inspection");

  return {
    success: true,
    message: "Inspection session created.",
    runId: run.id,
  };
}

export async function saveCriterionScore(input: {
  runId: string;
  indicatorCode: string;
  criterionNumber: number;
  score: number | null;
  comment?: string | null;
}): Promise<ActionResult> {
  const run = await prisma.inspectionRun.findUnique({
    where: { id: input.runId },
    select: { id: true, branchId: true, status: true },
  });

  if (!run) return { success: false, error: "Inspection not found." };
  if (run.status === InspectionRunStatus.FINALIZED) {
    return { success: false, error: "This inspection is finalized and cannot be edited." };
  }

  const access = await assertInspectionAccess(run.branchId);
  if (!access.ok) return { success: false, error: access.error };

  if (input.score != null) {
    const framework = loadFrameworkFromFile();
    const scaleMax = framework.version.scoringScale.max;
    if (input.score < 0 || input.score > scaleMax) {
      return {
        success: false,
        error: `Score must be between 0 and ${scaleMax}.`,
      };
    }
  }

  const criterionKey = buildCriterionKey(input.indicatorCode, input.criterionNumber);

  await prisma.inspectionCriterionScore.upsert({
    where: {
      runId_criterionKey: { runId: input.runId, criterionKey },
    },
    create: {
      runId: input.runId,
      criterionKey,
      indicatorCode: input.indicatorCode,
      criterionNumber: input.criterionNumber,
      score: input.score,
      comment: input.comment?.trim() || null,
    },
    update: {
      score: input.score,
      comment: input.comment?.trim() || null,
    },
  });

  await recalculateRunScores(input.runId);

  return { success: true, message: "Score saved." };
}

async function recalculateRunScores(runId: string) {
  const detail = await getInspectionRunDetail(runId);
  if (!detail) return;

  const { summary } = detail;
  const narrative = identifyStrengthsAndGaps(summary);

  await prisma.inspectionRun.update({
    where: { id: runId },
    data: {
      totalScore: summary.totalEarned,
      maxScore: summary.totalMax,
      overallPercent: summary.overallPercent,
      strengths: narrative.strengths.join("; ") || null,
      gaps: narrative.gaps.join("; ") || null,
      status: InspectionRunStatus.IN_PROGRESS,
    },
  });
}

export async function saveInspectionNarrative(input: {
  runId: string;
  strengths?: string;
  gaps?: string;
  recommendations?: string;
  inspectorComments?: string;
  finalOutcome?: string;
}): Promise<ActionResult> {
  const run = await prisma.inspectionRun.findUnique({
    where: { id: input.runId },
    select: { branchId: true, status: true },
  });
  if (!run) return { success: false, error: "Inspection not found." };
  if (run.status === InspectionRunStatus.FINALIZED) {
    return { success: false, error: "This inspection is finalized." };
  }

  const access = await assertInspectionAccess(run.branchId);
  if (!access.ok) return { success: false, error: access.error };

  await prisma.inspectionRun.update({
    where: { id: input.runId },
    data: {
      strengths: input.strengths?.trim() || null,
      gaps: input.gaps?.trim() || null,
      recommendations: input.recommendations?.trim() || null,
      inspectorComments: input.inspectorComments?.trim() || null,
      finalOutcome: input.finalOutcome?.trim() || null,
    },
  });

  return { success: true, message: "Report notes saved." };
}

export async function submitInspectionRun(runId: string): Promise<ActionResult> {
  const run = await prisma.inspectionRun.findUnique({
    where: { id: runId },
    select: { id: true, branchId: true, status: true },
  });
  if (!run) return { success: false, error: "Inspection not found." };

  const access = await assertInspectionAccess(run.branchId);
  if (!access.ok) return { success: false, error: access.error };

  const detail = await getInspectionRunDetail(runId);
  if (!detail) return { success: false, error: "Inspection not found." };

  if (detail.summary.scoredCriteria < detail.summary.totalCriteria) {
    return {
      success: false,
      error: `Complete all criteria before submitting (${detail.summary.scoredCriteria}/${detail.summary.totalCriteria} scored).`,
    };
  }

  await prisma.inspectionRun.update({
    where: { id: runId },
    data: {
      status: InspectionRunStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  await writeInspectionAudit(
    run.branchId,
    access.session!.user.id,
    "INSPECTION_RUN_SUBMITTED",
    runId,
    { overallPercent: detail.summary.overallPercent }
  );

  revalidatePath("/branch/inspection");
  revalidatePath("/admin/inspection");
  revalidatePath(`/branch/inspection/${runId}`);

  return { success: true, message: "Inspection submitted." };
}

export async function finalizeInspectionRun(runId: string): Promise<ActionResult> {
  const run = await prisma.inspectionRun.findUnique({
    where: { id: runId },
    select: { id: true, branchId: true, status: true },
  });
  if (!run) return { success: false, error: "Inspection not found." };

  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
    return { success: false, error: "Only super admin can finalize inspections." };
  }

  const access = await assertSuperAdminCanAccessBranch(session.user, run.branchId);
  if (!access.ok) return { success: false, error: access.error };

  if (run.status !== InspectionRunStatus.SUBMITTED) {
    return { success: false, error: "Only submitted inspections can be finalized." };
  }

  await prisma.inspectionRun.update({
    where: { id: runId },
    data: {
      status: InspectionRunStatus.FINALIZED,
      finalizedAt: new Date(),
    },
  });

  await writeInspectionAudit(
    run.branchId,
    session.user.id,
    "INSPECTION_RUN_FINALIZED",
    runId
  );

  revalidatePath("/branch/inspection");
  revalidatePath("/admin/inspection");

  return { success: true, message: "Inspection finalized." };
}

export async function uploadInspectionEvidence(
  formData: FormData
): Promise<ActionResult> {
  const runId = String(formData.get("runId") ?? "");
  const criterionKey = String(formData.get("criterionKey") ?? "");
  const textNote = String(formData.get("textNote") ?? "").trim();
  const file = formData.get("file");

  if (!runId) return { success: false, error: "Missing run ID." };

  const run = await prisma.inspectionRun.findUnique({
    where: { id: runId },
    select: { branchId: true, status: true },
  });
  if (!run) return { success: false, error: "Inspection not found." };
  if (run.status === InspectionRunStatus.FINALIZED) {
    return { success: false, error: "Cannot add evidence to a finalized inspection." };
  }

  const access = await assertInspectionAccess(run.branchId);
  if (!access.ok) return { success: false, error: access.error };

  let criterionScoreId: string | null = null;
  if (criterionKey) {
    const score = await prisma.inspectionCriterionScore.findUnique({
      where: { runId_criterionKey: { runId, criterionKey } },
      select: { id: true },
    });
    criterionScoreId = score?.id ?? null;
  }

  if (!(file instanceof File) || file.size === 0) {
    if (!textNote) return { success: false, error: "Provide a file or text note." };
    await prisma.inspectionEvidence.create({
      data: {
        runId,
        criterionScoreId,
        fileName: "text-note",
        fileUrl: "",
        textNote,
        uploadedById: access.session!.user.id,
      },
    });
    return { success: true, message: "Evidence note saved." };
  }

  const saved = await saveInspectionEvidenceFile(runId, file);
  await prisma.inspectionEvidence.create({
    data: {
      runId,
      criterionScoreId,
      fileName: file.name,
      fileUrl: saved.fileUrl,
      mimeType: saved.mimeType,
      textNote: textNote || null,
      uploadedById: access.session!.user.id,
    },
  });

  return { success: true, message: "Evidence uploaded." };
}
