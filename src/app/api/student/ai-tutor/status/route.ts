import { auth } from "@/lib/auth";
import {
  getOllamaBaseUrl,
  getOllamaConfigurationHint,
  getOllamaModel,
  isAiTutorEnabled,
  isMockFallbackEnabledOnError,
} from "@/lib/ai/config";
import { ollamaHealthCheck, ollamaWarmModel } from "@/lib/ai/ollama";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enabled = isAiTutorEnabled();
  if (!enabled) {
    return NextResponse.json({
      enabled: false,
      reachable: false,
      model: getOllamaModel(),
      baseUrl: getOllamaBaseUrl(),
      fallbackMock: isMockFallbackEnabledOnError(),
      models: [] as string[],
    });
  }

  const configurationHint = getOllamaConfigurationHint();
  const health = await ollamaHealthCheck();

  if (health.reachable) {
    void ollamaWarmModel();
  }

  const error =
    health.error ??
    (!health.reachable && configurationHint ? configurationHint : undefined);

  return NextResponse.json({
    enabled: true,
    reachable: health.reachable,
    model: health.model,
    baseUrl: getOllamaBaseUrl(),
    fallbackMock: isMockFallbackEnabledOnError(),
    models: health.models,
    error,
    configurationHint: configurationHint ?? undefined,
    modelInstalled: health.models.some(
      (name) => name === health.model || name.startsWith(`${health.model}:`)
    ),
  });
}
