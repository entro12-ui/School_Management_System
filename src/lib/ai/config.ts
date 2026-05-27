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

export function getOllamaBaseUrl(): string {
  return trimSlash(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434");
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

/** Hard cap for tutor round-trips (target ~5–12s on local 8B). */
export function getOllamaRequestTimeoutMs(): number {
  return readIntEnv("OLLAMA_TIMEOUT_MS", 12_000);
}

/** Max tokens generated per reply — lower = faster. */
export function getOllamaNumPredict(): number {
  return readIntEnv("OLLAMA_NUM_PREDICT", 140);
}

export function getOllamaNumCtx(): number {
  return readIntEnv("OLLAMA_NUM_CTX", 3072);
}

/** Conversation turns sent to the model (student + tutor pairs). */
export function getOllamaMaxHistory(): number {
  return readIntEnv("OLLAMA_MAX_HISTORY", 4);
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
