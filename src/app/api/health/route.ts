import { NextResponse } from "next/server";

/** Lightweight check for Render/load balancers — no database required. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "school-management-system",
    timestamp: new Date().toISOString(),
  });
}
