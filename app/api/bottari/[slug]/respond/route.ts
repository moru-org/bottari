import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { QuizPayload } from "@/lib/types";
import { evaluateQuiz } from "@/lib/scoring";
import { logEvent } from "@/lib/analytics";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { answers, referralId } = body;

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        { error: "답안 형식(answers 배열)이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const bottari = await db.bottari.findUnique({
      where: { slug },
    });

    if (!bottari || bottari.status !== "active") {
      return NextResponse.json(
        { error: "보따리를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const payload = JSON.parse(bottari.payload) as QuizPayload;
    const questions = payload.questions || [];

    if (answers.length !== questions.length) {
      return NextResponse.json(
        { error: "제출된 답안 수와 문항 수가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 서버 사이드 채점 수행
    const result = evaluateQuiz(questions, answers);

    // 응답 결과 DB 저장
    await db.response.create({
      data: {
        bottariId: bottari.id,
        score: result.score,
        totalQuestions: result.totalQuestions,
        answersPayload: JSON.stringify(answers),
      },
    });

    // 완료 이벤트 로깅
    await logEvent(bottari.id, "play_completed", referralId || null, {
      score: result.score,
      percentage: result.percentage,
    });

    return NextResponse.json({
      success: true,
      result,
      bottariTitle: bottari.title,
      bottariSlug: bottari.slug,
    });
  } catch (err) {
    console.error("Respond bottari error:", err);
    return NextResponse.json(
      { error: "답안 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
