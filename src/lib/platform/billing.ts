export const PLATFORM_STUDENT_PRICE_ETB = Number(
  process.env.PLATFORM_STUDENT_PRICE_ETB ?? 30
);

export function calculatePlatformSubscriptionAmount(studentCount: number): number {
  const count = Math.max(1, Math.floor(studentCount));
  return count * PLATFORM_STUDENT_PRICE_ETB;
}

export function formatPlatformAmount(amount: number): string {
  return amount.toFixed(2);
}
