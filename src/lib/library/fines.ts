/** Tiered overdue fines (ETB) per school library spec */
export type FineTierResult = {
  amount: number;
  warning: string | null;
  tier: "none" | "warning" | "standard" | "penalty";
};

export function calculateOverdueFine(daysLate: number): FineTierResult {
  if (daysLate <= 0) {
    return { amount: 0, warning: null, tier: "none" };
  }
  if (daysLate <= 5) {
    return {
      amount: 0,
      warning: `Overdue ${daysLate} day(s) — please return soon (no fine yet).`,
      tier: "warning",
    };
  }
  if (daysLate <= 10) {
    return {
      amount: 50,
      warning: null,
      tier: "standard",
    };
  }
  return {
    amount: 50 + (daysLate - 10) * 15,
    warning: null,
    tier: "penalty",
  };
}

export function daysBetween(due: Date, reference = new Date()): number {
  const ms = reference.getTime() - due.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
