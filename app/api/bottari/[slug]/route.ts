import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BottariPlayData, PlayQuestion, QuizPayload } from "@/lib/types";
import { logEvent } from "@/lib/analytics";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const bottari = await db.bottari.findUnique({
      where: { slug },
    });

    if (!bottari || bottari.status !== "active") {
      return NextResponse.json(
        { error: "보따리를 찾을 수 없거나 비활성화되었습니다." },
        { status: 404 }
      );
    }

    // 뷰 이벤트 기록
    const searchParams = req.nextUrl.searchParams;
    const ref = searchParams.get("ref");
    await logEvent(bottari.id, "content_viewed", ref || null);

    const payload = JSON.parse(bottari.payload) as QuizPayload;

    // 정답 인덱스(answerIndex)를 필터링하여 플레이어에게 노출되지 않도록 안전하게 반환
    const sanitizedQuestions: PlayQuestion[] = (payload.questions || []).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    const playData: BottariPlayData = {
      id: bottari.id,
      slug: bottari.slug,
      title: bottari.title,
      type: bottari.type,
      questions: sanitizedQuestions,
      createdAt: bottari.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      bottari: playData,
    });
  } catch (err) {
    console.error("Get bottari error:", err);
    return NextResponse.json(
      { error: "보따리 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
