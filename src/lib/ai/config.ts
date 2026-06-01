/**
 * Ollama / AI Tutor configuration (server-side only).
 *
 * Local:  OLLAMA_BASE_URL=http://127.0.0.1:11434
 * Render: OLLAMA_BASE_URL=http://<private-ollama-service>:11434
 */

function trimSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function readIntEnv(key: string, fallback: number): number {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildUrlFromHostport(hostport: string) {
  const trimmed = hostport.trim();
  if (!trimmed) return null;
  return trimSlash(trimmed.startsWith("http") ? trimmed : `http://${trimmed}`);
}

/** Resolve Ollama URL for local dev or Render private networking. */
export function getOllamaBaseUrl(): string {
  const fromHostport = process.env.OLLAMA_HOSTPORT
    ? buildUrlFromHostport(process.env.OLLAMA_HOSTPORT)
    : null;
  if (fromHostport) return fromHostport;

  const explicit = process.env.OLLAMA_BASE_URL?.trim();
  if (explicit) return trimSlash(explicit);

  return "http://127.0.0.1:11434";
}

export function isRunningOnRender(): boolean {
  return process.env.RENDER === "true" || Boolean(process.env.RENDER_SERVICE_ID);
}

/** Actionable hint when production cannot reach Ollama (shown in status UI). */
export function getOllamaConfigurationHint(): string | null {
  if (!isRunningOnRender()) return null;

  const baseUrl = getOllamaBaseUrl();
  const hasExplicitConfig = Boolean(
    process.env.OLLAMA_HOSTPORT?.trim() || process.env.OLLAMA_BASE_URL?.trim()
  );

  if (!hasExplicitConfig || baseUrl.includes("127.0.0.1") || baseUrl.includes("localhost")) {
    return (
      "On Render: deploy the school-sms-ollama private service, set OLLAMA_HOSTPORT (Blueprint) " +
      "or OLLAMA_BASE_URL=http://school-sms-ollama:11434 on the web service, then pull the model in Ollama Shell."
    );
  }

  return null;
}

export function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL ?? "llama3.1:8b";
}

/** When false, chat API returns 503 instead of calling Ollama. */
export function isAiTutorEnabled(): boolean {
  const raw = process.env.AI_TUTOR_ENABLED;
  if (raw === undefined || raw === "") return true;
  return raw === "1" || raw.toLowerCase() === "true";
}

/** If Ollama fails, use the built-in Socratic mock replies. */
export function isMockFallbackEnabledOnError(): boolean {
  const raw = process.env.AI_TUTOR_FALLBACK_MOCK;
  if (raw === undefined || raw === "") return true;
  return raw === "1" || raw.toLowerCase() === "true";
}

/**
 * Max wait for the first streamed token (model load + prompt on CPU can take 30–90s).
 * Legacy env: OLLAMA_TIMEOUT_MS (used when OLLAMA_FIRST_TOKEN_TIMEOUT_MS is unset).
 */
export function getOllamaFirstTokenTimeoutMs(): number {
  const dedicated = process.env.OLLAMA_FIRST_TOKEN_TIMEOUT_MS;
  if (dedicated !== undefined && dedicated !== "") {
    return readIntEnv("OLLAMA_FIRST_TOKEN_TIMEOUT_MS", 120_000);
  }
  return readIntEnv("OLLAMA_TIMEOUT_MS", 120_000);
}

/** Max idle time between stream chunks after the first token. */
export function getOllamaStreamIdleTimeoutMs(): number {
  return readIntEnv("OLLAMA_STREAM_IDLE_TIMEOUT_MS", 45_000);
}

/** @deprecated Prefer getOllamaFirstTokenTimeoutMs */
export function getOllamaRequestTimeoutMs(): number {
  return getOllamaFirstTokenTimeoutMs();
}

/** Max tokens generated per reply — lower = faster. */
export function getOllamaNumPredict(): number {
  return readIntEnv("OLLAMA_NUM_PREDICT", 140);
}

export function getOllamaNumCtx(): number {
  return readIntEnv("OLLAMA_NUM_CTX", 3072);
}

/** Prior chat messages sent to the model (student + tutor lines). */
export function getOllamaMaxHistory(): number {
  return readIntEnv("OLLAMA_MAX_HISTORY", 8);
}

export function getOllamaKeepAlive(): string {
  return process.env.OLLAMA_KEEP_ALIVE ?? "15m";
}

export function getTutorOllamaOptions() {
  return {
    temperature: 0.35,
    top_p: 0.9,
    top_k: 40,
    repeat_penalty: 1.1,
    num_predict: getOllamaNumPredict(),
    num_ctx: getOllamaNumCtx(),
  };
}
