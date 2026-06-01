import {
  getOllamaBaseUrl,
  getOllamaConfigurationHint,
  getOllamaFirstTokenTimeoutMs,
  getOllamaKeepAlive,
  getOllamaModel,
  getOllamaStreamIdleTimeoutMs,
  getTutorOllamaOptions,
} from "@/lib/ai/config";

export type OllamaChatRole = "system" | "user" | "assistant";

export type OllamaChatMessage = {
  role: OllamaChatRole;
  content: string;
};

type OllamaChatResponse = {
  message?: { role?: string; content?: string };
  error?: string;
};

type OllamaStreamChunk = {
  message?: { content?: string };
  done?: boolean;
  error?: string;
};

type OllamaTagsResponse = {
  models?: Array<{ name: string; size?: number }>;
};

export class OllamaError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "OllamaError";
  }
}

function chatRequestBody(messages: OllamaChatMessage[], stream: boolean) {
  return {
    model: getOllamaModel(),
    messages,
    stream,
    keep_alive: getOllamaKeepAlive(),
    options: getTutorOllamaOptions(),
  };
}

export async function ollamaHealthCheck(): Promise<{
  reachable: boolean;
  model: string;
  models: string[];
  error?: string;
}> {
  const model = getOllamaModel();
  const baseUrl = getOllamaBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(4_000),
    });

    if (!response.ok) {
      return {
        reachable: false,
        model,
        models: [],
        error: `Ollama returned ${response.status}`,
      };
    }

    const data = (await response.json()) as OllamaTagsResponse;
    const models = (data.models ?? []).map((entry) => entry.name);

    return { reachable: true, model, models };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const hint = getOllamaConfigurationHint();
    return {
      reachable: false,
      model,
      models: [],
      error: hint ? `${message}. ${hint}` : message,
    };
  }
}

/** Loads model weights into memory to avoid cold-start delay on first chat. */
export async function ollamaWarmModel(): Promise<void> {
  const baseUrl = getOllamaBaseUrl();
  const model = getOllamaModel();

  await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "hi" }],
      stream: false,
      keep_alive: getOllamaKeepAlive(),
      options: { ...getTutorOllamaOptions(), num_predict: 1 },
    }),
    signal: AbortSignal.timeout(getOllamaFirstTokenTimeoutMs()),
  }).catch(() => {
    /* warm-up is best-effort */
  });
}

export async function ollamaChat(messages: OllamaChatMessage[]): Promise<string> {
  let full = "";
  for await (const token of ollamaChatStream(messages)) {
    full += token;
  }
  const content = full.trim();
  if (!content) {
    throw new OllamaError("Ollama returned an empty response");
  }
  return content;
}

export async function* ollamaChatStream(
  messages: OllamaChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const baseUrl = getOllamaBaseUrl();
  const firstTokenTimeoutMs = getOllamaFirstTokenTimeoutMs();
  const idleTimeoutMs = getOllamaStreamIdleTimeoutMs();
  const abort = new AbortController();
  let sawToken = false;
  let activeTimeoutMs = firstTokenTimeoutMs;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const armTimer = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => abort.abort(), activeTimeoutMs);
  };

  const onStreamActivity = () => {
    if (!sawToken) {
      sawToken = true;
      activeTimeoutMs = idleTimeoutMs;
    }
    armTimer();
  };

  armTimer();

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatRequestBody(messages, true)),
      signal: abort.signal,
    });

    if (!response.ok) {
      let errorText = `Ollama chat failed (${response.status})`;
      try {
        const payload = (await response.json()) as OllamaChatResponse;
        if (payload.error) errorText = payload.error;
      } catch {
        /* ignore */
      }
      throw new OllamaError(errorText, response.status);
    }

    if (!response.body) {
      throw new OllamaError("Ollama returned no response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      onStreamActivity();

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let chunk: OllamaStreamChunk;
        try {
          chunk = JSON.parse(trimmed) as OllamaStreamChunk;
        } catch {
          continue;
        }

        if (chunk.error) {
          throw new OllamaError(chunk.error);
        }

        const piece = chunk.message?.content;
        if (piece) {
          onStreamActivity();
          yield piece;
        }

        if (chunk.done) return;
      }
    }
  } catch (error) {
    if (error instanceof OllamaError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      const label = sawToken ? "idle" : "first token";
      const limit = sawToken ? idleTimeoutMs : firstTokenTimeoutMs;
      throw new OllamaError(`Ollama timed out waiting for ${label} (${limit}ms)`);
    }
    throw new OllamaError(error instanceof Error ? error.message : "Ollama request failed");
  } finally {
    if (timer) clearTimeout(timer);
  }
}
