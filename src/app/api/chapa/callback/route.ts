import { NextResponse } from "next/server";
import { finalizePlatformChapaTransaction } from "@/lib/services/platform-payments";
import { finalizeChapaTransaction } from "@/lib/services/payment-settlement";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const txRef =
    url.searchParams.get("trx_ref") ??
    url.searchParams.get("tx_ref") ??
    url.searchParams.get("chapa_tx");

  if (!txRef) {
    return NextResponse.json({ ok: false, error: "Missing transaction reference." }, { status: 400 });
  }

  const platformResult = await finalizePlatformChapaTransaction(txRef);
  if (platformResult) {
    if (!platformResult.ok) {
      return NextResponse.json({ ok: false, error: platformResult.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      message: platformResult.message,
      alreadyProcessed: platformResult.alreadyProcessed ?? false,
      type: "platform",
    });
  }

  const result = await finalizeChapaTransaction(txRef);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    alreadyProcessed: result.alreadyProcessed ?? false,
  });
}
