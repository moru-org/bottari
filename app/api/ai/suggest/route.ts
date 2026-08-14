import { NextRequest, NextResponse } from "next/server";
import { suggestQuestionsWithGoVail } from "@/lib/ai-adapter";
import { PackType } from "@/lib/pack-types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packType = "friend_quiz", topic = "일상", tone = "웃김", count = 5 } = body as {
      packType?: PackType;
      topic?: string;
      tone?: string;
      count?: number;
    };

    const questions = await suggestQuestionsWithGoVail({
      packType,
      topic,
      tone,
      count: Math.min(Math.max(count, 1), 10),
    });

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (err) {
    console.error("AI Suggest Error:", err);
    return NextResponse.json(
      { success: false, error: "질문 제안 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
