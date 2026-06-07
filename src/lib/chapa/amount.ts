export function formatChapaAmount(amount: number) {
  return String(Math.max(1, Math.round(amount)));
}
