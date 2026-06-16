import { prisma } from "@/lib/prisma";

export async function logImsAudit(input: {
  branchId: string;
  actorId: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      branchId: input.branchId,
      actorId: input.actorId,
      action: input.action,
      entity: input.entity ?? "ims",
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}
