export function getChapaSecretKey() {
  return process.env.CHAPA_SECRET_KEY?.trim() || null;
}

export function getChapaPublicKey() {
  return process.env.CHAPA_PUBLIC_KEY?.trim() || null;
}

export function isChapaConfigured() {
  return Boolean(getChapaSecretKey() && getChapaPublicKey());
}

export function getAppBaseUrl() {
  const url = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}
