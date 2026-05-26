/** Matches Prisma enum PaymentProofStatus — use in queries if @prisma/client is stale. */
export const PAYMENT_PROOF_STATUS = {
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type PaymentProofStatusValue =
  (typeof PAYMENT_PROOF_STATUS)[keyof typeof PAYMENT_PROOF_STATUS];
