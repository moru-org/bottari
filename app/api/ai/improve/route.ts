import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, tone = "재밌게" } = body as {
      question: string;
      tone?: string;
    };

    if (!question || !question.trim()) {
      return NextResponse.json(
        { success: false, error: "질문 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    // 질문 리라이팅 추천 생성 (Fallback 또는 LLM)
    const improved = `${question.trim()} (더 재밌고 흥미진진한 버전!)`;

    return NextResponse.json({
      success: true,
      original: question,
      improvedQuestion: improved,
    });
  } catch (err) {
    console.error("AI Improve Error:", err);
    return NextResponse.json(
      { success: false, error: "질문 개선 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
