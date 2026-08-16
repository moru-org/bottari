import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = await req.json();
    const { eventType, metadata } = body;

    const pack = await db.pack.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!pack) {
      return NextResponse.json({ error: "보따리를 찾을 수 없습니다." }, { status: 404 });
    }

    await db.event.create({
      data: {
        packId: pack.id,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Event track error:", err);
    return NextResponse.json({ error: "이벤트 기록 실패" }, { status: 500 });
  }
}
