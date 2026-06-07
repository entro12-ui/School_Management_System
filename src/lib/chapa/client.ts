import { getAppBaseUrl, getChapaSecretKey } from "@/lib/chapa/config";
import { resolveChapaEmail } from "@/lib/chapa/email";
import { sanitizeChapaText, formatChapaErrorMessage } from "@/lib/chapa/errors";

const CHAPA_API = "https://api.chapa.co/v1";

export type ChapaInitializeInput = {
  amount: string;
  currency?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
  };
  meta?: Record<string, string>;
};

export type ChapaInitializeResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

export type ChapaVerifyResult =
  | {
      ok: true;
      status: string;
      amount: number;
      currency: string;
      chapaRefId: string | null;
      txRef: string;
    }
  | { ok: false; error: string };

type ChapaApiResponse<T> = {
  message?: unknown;
  status?: string;
  data?: T;
};

function authHeaders() {
  const secretKey = getChapaSecretKey();
  if (!secretKey) {
    throw new Error("Chapa is not configured. Set CHAPA_SECRET_KEY in your environment.");
  }
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
}

export function buildChapaTxRef(paymentId: string) {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `edusync-${paymentId.slice(-10)}-${suffix}`;
}

export function buildChapaCallbackUrl() {
  return `${getAppBaseUrl()}/api/chapa/callback`;
}

export function buildChapaReturnUrl(returnPath: string, txRef: string) {
  const path = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
  const url = new URL(path, getAppBaseUrl());
  url.searchParams.set("chapa_tx", txRef);
  return url.toString();
}

export async function initializeChapaTransaction(
  input: ChapaInitializeInput
): Promise<ChapaInitializeResult> {
  const email = resolveChapaEmail(input.email);
  if (!email) {
    return {
      ok: false,
      error: "A valid email address is required for Chapa checkout.",
    };
  }

  const payload: Record<string, unknown> = {
    currency: "ETB",
    amount: input.amount,
    email,
    first_name: sanitizeChapaText(input.first_name, 50) || "Customer",
    last_name: sanitizeChapaText(input.last_name, 50) || "User",
    tx_ref: input.tx_ref,
    callback_url: input.callback_url,
    return_url: input.return_url,
  };

  if (input.phone_number) {
    payload.phone_number = input.phone_number;
  }

  if (input.customization) {
    payload.customization = {
      title: sanitizeChapaText(input.customization.title ?? "", 16),
      description: sanitizeChapaText(input.customization.description ?? "", 50),
    };
  }

  try {
    const response = await fetch(`${CHAPA_API}/transaction/initialize`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const payload = (await response.json()) as ChapaApiResponse<{ checkout_url?: string }>;

    if (!response.ok || payload.status !== "success" || !payload.data?.checkout_url) {
      return {
        ok: false,
        error: formatChapaErrorMessage(payload.message),
      };
    }

    return { ok: true, checkoutUrl: payload.data.checkout_url };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not reach Chapa.",
    };
  }
}

export async function verifyChapaTransaction(txRef: string): Promise<ChapaVerifyResult> {
  try {
    const response = await fetch(
      `${CHAPA_API}/transaction/verify/${encodeURIComponent(txRef)}`,
      {
        method: "GET",
        headers: authHeaders(),
      }
    );

    const payload = (await response.json()) as ChapaApiResponse<{
      status?: string;
      amount?: number | string;
      currency?: string;
      tx_ref?: string;
      reference?: string;
    }>;

    if (!response.ok || payload.status !== "success" || !payload.data) {
      return {
        ok: false,
        error: formatChapaErrorMessage(payload.message, "Could not verify Chapa transaction."),
      };
    }

    const amount = Number(payload.data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: "Chapa returned an invalid payment amount." };
    }

    return {
      ok: true,
      status: payload.data.status ?? "unknown",
      amount,
      currency: payload.data.currency ?? "ETB",
      chapaRefId: payload.data.reference ?? null,
      txRef: payload.data.tx_ref ?? txRef,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not verify payment with Chapa.",
    };
  }
}
