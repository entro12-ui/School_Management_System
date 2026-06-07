import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isParentCommunicationContentLanguage,
  PARENT_COMMUNICATION_CONTENT_LANGUAGES,
  PARENT_COMMUNICATION_MESSAGE_TYPES,
  PARENT_COMMUNICATION_TONES,
  type ParentCommunicationMessageType,
  type ParentCommunicationTone,
} from "@/lib/parent-communication";
import {
  generateTeacherCommunicationDraft,
  getTeacherCommunicationBotContext,
} from "@/lib/services/parent-communication";

export const runtime = "nodejs";

function isMessageType(value: string): value is ParentCommunicationMessageType {
  return (PARENT_COMMUNICATION_MESSAGE_TYPES as readonly string[]).includes(value);
}

function isLanguage(value: string) {
  return isParentCommunicationContentLanguage(value);
}

function isTone(value: string): value is ParentCommunicationTone {
  return (PARENT_COMMUNICATION_TONES as readonly string[]).includes(value);
}

async function requireTeacherUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "TEACHER") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: session.user.id };
}

export async function GET() {
  const guard = await requireTeacherUser();
  if ("error" in guard) return guard.error;

  try {
    const context = await getTeacherCommunicationBotContext(guard.userId);
    return NextResponse.json({
      ...context,
      stats: {
        contentLanguages: PARENT_COMMUNICATION_CONTENT_LANGUAGES.length,
        workloadReduction: "~40%",
        draftTypes: PARENT_COMMUNICATION_MESSAGE_TYPES.length,
      },
    });
  } catch (error) {
    console.error("[teacher-communication-bot] GET failed:", error);
    return NextResponse.json(
      { error: "Could not load communication context. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const guard = await requireTeacherUser();
  if ("error" in guard) return guard.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const childId = typeof payload.childId === "string" ? payload.childId : "";
  const messageType =
    typeof payload.messageType === "string" && isMessageType(payload.messageType)
      ? payload.messageType
      : null;
  const language =
    typeof payload.language === "string" && isLanguage(payload.language)
      ? payload.language
      : null;
  const tone =
    typeof payload.tone === "string" && isTone(payload.tone) ? payload.tone : null;
  const additionalNotes =
    typeof payload.additionalNotes === "string"
      ? payload.additionalNotes.trim().slice(0, 300)
      : "";

  if (!childId || !messageType || !language || !tone) {
    return NextResponse.json(
      { error: "childId, messageType, language, and tone are required." },
      { status: 400 }
    );
  }

  try {
    const result = await generateTeacherCommunicationDraft(guard.userId, {
      childId,
      messageType,
      language,
      tone,
      additionalNotes,
    });

    if (!result) {
      return NextResponse.json({ error: "Student record not found." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[teacher-communication-bot] POST failed:", error);
    return NextResponse.json(
      { error: "Could not generate draft. Please try again." },
      { status: 500 }
    );
  }
}
