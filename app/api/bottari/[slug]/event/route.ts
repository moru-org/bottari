import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/analytics";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { eventType, referralId, metadata } = body;

    const allowedEvents = ["play_started", "result_viewed", "share_clicked"];
    if (!allowedEvents.includes(eventType)) {
      return NextResponse.json({ error: "허용되지 않은 이벤트 타입입니다." }, { status: 400 });
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
