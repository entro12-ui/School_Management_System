import type { InspectionRunStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loadFrameworkFromFile } from "@/lib/inspection/framework-server";
import {
  computeInspectionScores,
  identifyStrengthsAndGaps,
} from "@/lib/inspection/scoring";
import type {
  CriterionScoreInput,
  InspectionFramework,
  InspectionRunListItem,
} from "@/lib/inspection/types";
import { buildCriterionKey } from "@/lib/inspection/types";

export async function ensureInspectionFrameworkVersion() {
  const fileFramework = loadFrameworkFromFile();
  const code = fileFramework.version.code;

  return prisma.inspectionFrameworkVersion.upsert({
    where: { code },
    create: {
      code,
      titleEn: fileFramework.version.titleEn,
      titleAm: fileFramework.version.titleAm,
      framework: fileFramework as unknown as Prisma.InputJsonValue,
    },
    update: {
      titleEn: fileFramework.version.titleEn,
      titleAm: fileFramework.version.titleAm,
      framework: fileFramework as unknown as Prisma.InputJsonValue,
    },
  });
}

export function parseFrameworkJson(json: unknown): InspectionFramework {
  return json as InspectionFramework;
}

export async function listInspectionRunsForBranch(branchId: string) {
  const runs = await prisma.inspectionRun.findMany({
    where: { branchId },
    orderBy: { inspectionDate: "desc" },
    include: {
      branch: { select: { name: true } },
      inspector: { select: { firstName: true, lastName: true } },
      academicYear: { select: { name: true } },
      frameworkVersion: { select: { code: true } },
    },
  });

  return runs.map((run) => toListItem(run));
}

export async function listInspectionRunsForOrganization(organizationId: string) {
  const runs = await prisma.inspectionRun.findMany({
    where: { branch: { organizationId } },
    orderBy: { inspectionDate: "desc" },
    include: {
      branch: { select: { name: true } },
      inspector: { select: { firstName: true, lastName: true } },
      academicYear: { select: { name: true } },
      frameworkVersion: { select: { code: true } },
    },
  });

  return runs.map((run) => toListItem(run));
}

function toListItem(
  run: {
    id: string;
    branchId: string;
    inspectionDate: Date;
    status: InspectionRunStatus;
    schoolLevel: string;
    overallPercent: number | null;
    totalScore: number | null;
    maxScore: number | null;
    createdAt: Date;
    branch: { name: string };
    inspector: { firstName: string; lastName: string };
    academicYear: { name: string } | null;
    frameworkVersion: { code: string };
  }
): InspectionRunListItem {
  return {
    id: run.id,
    branchId: run.branchId,
    branchName: run.branch.name,
    inspectionDate: run.inspectionDate.toISOString(),
    status: run.status,
    schoolLevel: run.schoolLevel,
    overallPercent: run.overallPercent,
    totalScore: run.totalScore,
    maxScore: run.maxScore,
    inspectorName: `${run.inspector.firstName} ${run.inspector.lastName}`,
    academicYearName: run.academicYear?.name ?? null,
    frameworkCode: run.frameworkVersion.code,
    createdAt: run.createdAt.toISOString(),
  };
}

export async function getInspectionRunDetail(runId: string) {
  const run = await prisma.inspectionRun.findUnique({
    where: { id: runId },
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          organizationId: true,
          organization: { select: { name: true } },
        },
      },
      inspector: { select: { id: true, firstName: true, lastName: true, email: true } },
      supervisor: { select: { id: true, firstName: true, lastName: true } },
      academicYear: { select: { id: true, name: true } },
      frameworkVersion: true,
      criterionScores: true,
      evidence: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!run) return null;

  // Always use the canonical file framework (DB snapshot may be stale after updates).
  const framework = loadFrameworkFromFile();
  const scoreInputs: CriterionScoreInput[] = run.criterionScores.map((s) => ({
    criterionKey: s.criterionKey,
    indicatorCode: s.indicatorCode,
    criterionNumber: s.criterionNumber,
    score: s.score,
    comment: s.comment,
  }));

  const summary = computeInspectionScores(framework, scoreInputs);
  const autoNarrative = identifyStrengthsAndGaps(summary);

  return {
    run,
    framework,
    summary,
    autoNarrative,
    scoreMap: Object.fromEntries(
      run.criterionScores.map((s) => [s.criterionKey, s])
    ),
  };
}

export async function getBranchAcademicYears(branchId: string) {
  return prisma.academicYear.findMany({
    where: { branchId },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, isCurrent: true },
  });
}

export async function getOrgInspectionSummary(organizationId: string) {
  const runs = await prisma.inspectionRun.findMany({
    where: {
      branch: { organizationId },
      status: { in: ["SUBMITTED", "FINALIZED"] },
    },
    include: {
      branch: { select: { name: true } },
    },
    orderBy: { inspectionDate: "desc" },
  });

  const byBranch = new Map<
    string,
    { branchName: string; latestPercent: number | null; runCount: number }
  >();

  for (const run of runs) {
    const entry = byBranch.get(run.branchId) ?? {
      branchName: run.branch.name,
      latestPercent: run.overallPercent,
      runCount: 0,
    };
    entry.runCount += 1;
    byBranch.set(run.branchId, entry);
  }

  return Array.from(byBranch.entries()).map(([branchId, data]) => ({
    branchId,
    ...data,
  }));
}

export function scoresFromRunCriterionRows(
  rows: Array<{
    criterionKey: string;
    indicatorCode: string;
    criterionNumber: number;
    score: number | null;
    comment: string | null;
  }>
): CriterionScoreInput[] {
  return rows.map((r) => ({
    criterionKey: r.criterionKey,
    indicatorCode: r.indicatorCode,
    criterionNumber: r.criterionNumber,
    score: r.score,
    comment: r.comment,
  }));
}

export function buildEmptyScoreRows(framework: InspectionFramework): CriterionScoreInput[] {
  return framework.criteria.map((c) => ({
    criterionKey: buildCriterionKey(c.indicatorCode, c.number),
    indicatorCode: c.indicatorCode,
    criterionNumber: c.number,
    score: null,
    comment: null,
  }));
}
