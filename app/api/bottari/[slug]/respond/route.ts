import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/analytics";
import { PackDefinition, PackType } from "@/lib/pack-types";
import { evaluatePack, processAnonymousFeedback } from "@/lib/pack-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { answers, message, sessionToken } = body as {
      answers?: number[];
      message?: string;
      sessionToken?: string;
    };

    const bottari = await db.bottari.findUnique({
      where: { slug },
    });

    if (!bottari) {
      return NextResponse.json(
        { success: false, error: "보따리를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 1. 보따리 잠금 검사 (Creator가 닫은 경우)
    if (bottari.status === "disabled") {
      return NextResponse.json(
        { success: false, error: "이 보따리는 참여가 마감되었습니다 (응답 받기 중지)." },
        { status: 403 }
      );
    }

    let definition: PackDefinition;
    try {
      definition = JSON.parse(bottari.payload);
    } catch {
      return NextResponse.json(
        { success: false, error: "보따리 데이터가 손상되었습니다." },
        { status: 500 }
      );
    }

    const packType = definition.type;
    const policy = definition.submissionPolicy || {
      maxSubmissionsPerSession: packType === "anonymous_feedback" ? 3 : 1,
      allowMultiple: packType === "anonymous_feedback",
    };

    // 2. Submission Policy 중복 제출 검사
    if (sessionToken) {
      const pastSubmissionCount = await db.response.count({
        where: {
          bottariId: bottari.id,
          sessionToken,
        },
      });

      if (pastSubmissionCount >= policy.maxSubmissionsPerSession) {
        return NextResponse.json(
          {
            success: false,
            error: `이미 참여를 완료하셨습니다 (최대 ${policy.maxSubmissionsPerSession}회 참여 가능).`,
          },
          { status: 429 }
        );
      }
    }

    // 3. 익명 피드백 처리
    if (packType === "anonymous_feedback") {
      const maxLen = definition.config.type === "anonymous_feedback"
        ? (definition.config.question.maxLength || 500)
        : 500;

      const { cleanText, isValid, error } = processAnonymousFeedback(message || "", maxLen);
      if (!isValid) {
        return NextResponse.json({ success: false, error }, { status: 400 });
      }

      await db.response.create({
        data: {
          bottariId: bottari.id,
          sessionToken: sessionToken || null,
          answersPayload: JSON.stringify({ message: cleanText }),
          resultPayload: JSON.stringify({ submitted: true }),
        },
      });

      await logEvent(bottari.id, "play_completed", null, {
        type: packType,
        sessionToken,
      });

      return NextResponse.json({
        success: true,
        result: {
          type: "anonymous_feedback",
          submitted: true,
          message: "익명 메시지가 친구의 보따리에 안전하게 담겼어요! 💌",
        },
      });
    }

    // 4. 선택형 팩 타입들 (Friend Quiz, Guess Me, First Impression, Balance)
    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: "선택한 답안 정보가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // First Impression / Balance 집계용 트랜잭션 처리
    let aggregates: { questionIndex: number; optionIndex: number; count: number }[] = [];
    let totalCount = 1;

    if (packType === "first_impression" || packType === "balance") {
      // Prisma 트랜잭션: Response 생성 + AnswerAggregate 각각 upsert
      await db.$transaction(async (tx) => {
        // 1) Response 생성
        await tx.response.create({
          data: {
            bottariId: bottari.id,
            sessionToken: sessionToken || null,
            answersPayload: JSON.stringify(answers),
            resultPayload: JSON.stringify({ type: packType }),
          },
        });

        // 2) 각 질문별 선택지에 대해 AnswerAggregate 카운트 증가
        for (let qIdx = 0; qIdx < answers.length; qIdx++) {
          const optIdx = answers[qIdx];
          if (typeof optIdx === "number" && optIdx >= 0) {
            await tx.answerAggregate.upsert({
              where: {
                bottariId_questionIndex_optionIndex: {
                  bottariId: bottari.id,
                  questionIndex: qIdx,
                  optionIndex: optIdx,
                },
              },
              update: {
                count: { increment: 1 },
              },
              create: {
                bottariId: bottari.id,
                questionIndex: qIdx,
                optionIndex: optIdx,
                count: 1,
              },
            });
          }
        }
      });

      // 최신 집계 레코드 및 총 참여자 수 조회
      aggregates = await db.answerAggregate.findMany({
        where: { bottariId: bottari.id },
        select: { questionIndex: true, optionIndex: true, count: true },
      });
      totalCount = await db.response.count({ where: { bottariId: bottari.id } });
    } else {
      // Friend Quiz / Guess Me
      const result = evaluatePack(definition, answers);
      const score = result.type === "friend_quiz" ? result.score : null;

      await db.response.create({
        data: {
          bottariId: bottari.id,
          sessionToken: sessionToken || null,
          score,
          totalQuestions: answers.length,
          answersPayload: JSON.stringify(answers),
          resultPayload: JSON.stringify(result),
        },
      });
    }

    const calculatedResult = evaluatePack(
      definition,
      answers,
      aggregates,
      totalCount
    );

    await logEvent(bottari.id, "play_completed", null, {
      type: packType,
      sessionToken,
    });

    return NextResponse.json({
      success: true,
      result: calculatedResult,
    });
  } catch (err) {
    console.error("Respond Error:", err);
    return NextResponse.json(
      { success: false, error: "답안 제출 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
