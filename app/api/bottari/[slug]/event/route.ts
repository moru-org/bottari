import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/analytics";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

const ALLOWED_EVENTS = [
  "bottari_created",
  "bottari_opened",
  "play_started",
  "question_answered",
  "play_completed",
  "share_clicked",
  "link_copied",
  "reaction_created",
  "create_from_result_clicked",
  "login_started",
  "anonymous_bottari_claimed",
  "content_viewed",
  "result_viewed",
];

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { eventType, referralId, metadata } = body;

    if (!eventType || !ALLOWED_EVENTS.includes(eventType)) {
      return NextResponse.json(
        { error: "허용되지 않은 이벤트 타입입니다." },
        { status: 400 }
      );
    }

    const bottari = await db.bottari.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!bottari) {
      return NextResponse.json({ error: "보따리를 찾을 수 없습니다." }, { status: 404 });
    }

    await logEvent(bottari.id, eventType, referralId || null, metadata);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Event track error:", err);
    return NextResponse.json({ error: "이벤트 기록 실패" }, { status: 500 });
  }
}
