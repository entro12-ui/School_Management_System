import { auth } from "@/lib/auth";
import {
  getStudentTranscriptByUserId,
  transcriptFilename,
} from "@/lib/services/student-transcript";
import { renderTranscriptCsv, renderTranscriptHtml } from "@/lib/transcript/export";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "html";
  if (format !== "html" && format !== "csv") {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const data = await getStudentTranscriptByUserId(session.user.id);
  if (!data) {
    return NextResponse.json({ error: "Student record not found" }, { status: 404 });
  }

  const filename = transcriptFilename(data, format);

  if (format === "csv") {
    return new NextResponse(renderTranscriptCsv(data), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return new NextResponse(renderTranscriptHtml(data), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
