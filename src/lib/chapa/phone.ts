/** Chapa test numbers: https://developer.chapa.co/test/testing-mobile */
export const CHAPA_TEST_PHONE = "0900123456";

/** Chapa expects 09xxxxxxxx or 07xxxxxxxx when phone is provided. */
export function resolveChapaPhone(phone?: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length >= 10) {
    const local = digits.slice(-10);
    if (local.startsWith("09") || local.startsWith("07")) {
      return local;
    }
  }
  return CHAPA_TEST_PHONE;
}
