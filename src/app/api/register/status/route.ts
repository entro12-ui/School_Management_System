import { NextRequest, NextResponse } from "next/server";
import { getRegistrationStatusByEmail } from "@/lib/services/registrations";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const status = await getRegistrationStatusByEmail(email);
  return NextResponse.json(status);
}
