import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOwnerToken, generateSlug, hashOwnerToken } from "@/lib/crypto";
import { getSession } from "@/lib/auth";
import { QuizPayload, QuizQuestion } from "@/lib/types";
import { logEvent } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, questions, referralId } = body;

    // 1. 유효성 검증
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "보따리 이름을 1자 이상 입력해주세요." },
        { status: 400 }
      );
    }

    if (!Array.isArray(questions) || questions.length < 3 || questions.length > 10) {
      return NextResponse.json(
        { error: "질문은 최소 3개에서 최대 10개까지 등록 가능합니다." },
        { status: 400 }
      );
    }

    // 각 질문 유효성 검증
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i] as QuizQuestion;
      if (!q.question || typeof q.question !== "string" || q.question.trim().length === 0) {
        return NextResponse.json(
          { error: `${i + 1}번째 질문 내용을 입력해주세요.` },
          { status: 400 }
        );
      }
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) {
        return NextResponse.json(
          { error: `${i + 1}번째 질문의 선택지는 2개~4개여야 합니다.` },
          { status: 400 }
        );
      }
      if (typeof q.answerIndex !== "number" || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
        return NextResponse.json(
          { error: `${i + 1}번째 질문의 정답을 올바르게 선택해주세요.` },
          { status: 400 }
        );
      }
    }

    // 2. Slug 생성 (중복 방지)
    let slug = generateSlug(7);
    let attempts = 0;
    while (attempts < 5) {
      const existing = await db.bottari.findUnique({ where: { slug } });
      if (!existing) break;
      slug = generateSlug(7);
      attempts++;
    }

    // 3. 익명 소유권 토큰 생성 및 해싱
    const ownerToken = generateOwnerToken();
    const ownerTokenHash = hashOwnerToken(ownerToken);

    // 4. 로그인 세션 확인
    const session = await getSession();
    const ownerUserId = session ? session.id : null;

    // 5. DB 저장
    const payload: QuizPayload = { questions };

    const bottari = await db.bottari.create({
      data: {
        slug,
        title: title.trim(),
        ownerUserId,
        ownerTokenHash,
        type: "quiz_know_me",
        payload: JSON.stringify(payload),
        status: "active",
      },
    });

    // 6. 이벤트 로깅
    await logEvent(bottari.id, "content_viewed", referralId || null, {
      creator: ownerUserId ? "authenticated" : "anonymous",
    });

    return NextResponse.json({
      success: true,
      slug: bottari.slug,
      ownerToken: ownerUserId ? null : ownerToken,
      title: bottari.title,
      questionCount: questions.length,
      isOwnedBySession: !!ownerUserId,
    });
  } catch (err) {
    console.error("Create bottari error:", err);
    return NextResponse.json(
      { error: "보따리 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
