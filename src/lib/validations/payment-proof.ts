import { z } from "zod";

export const submitPaymentProofSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  reference: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export const rejectPaymentProofSchema = z.object({
  proofId: z.string().min(1),
  reason: z.string().min(3, "Please provide a rejection reason"),
});
