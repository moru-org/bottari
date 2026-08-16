import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await req.json();
    const { sessionToken, questionId, optionId } = body;

    if (!questionId || !optionId) {
      return NextResponse.json({ error: "필수 응답 정보가 누락되었습니다." }, { status: 400 });
    }

    const pack = await db.pack.findUnique({
      where: { slug },
      include: { questions: { where: { id: questionId } } }
    });

    if (!pack || pack.status === "disabled") {
      return NextResponse.json(
        { success: false, error: pack?.status === "disabled" ? "참가가 마감되었습니다." : "보따리를 찾을 수 없습니다." },
        { status: pack?.status === "disabled" ? 403 : 404 }
      );
    }

    // Check if option belongs to the question
    const option = await db.questionOption.findFirst({
      where: { id: optionId, questionId }
    });
    if (!option) {
      return NextResponse.json({ error: "올바르지 않은 선택지입니다." }, { status: 400 });
    }

    // Upsert Submission and Answer
    await db.$transaction(async (tx) => {
      let submission = await tx.submission.findFirst({ where: { packId: pack.id, sessionToken } });
      if (!submission) {
        submission = await tx.submission.create({
          data: { packId: pack.id, sessionToken, answers: { create: { questionId, optionId } } }
        });
      } else {
        await tx.submissionAnswer.upsert({
          where: { submissionId_questionId: { submissionId: submission.id, questionId } },
          update: { optionId },
          create: { submissionId: submission.id, questionId, optionId }
        });
      }
    });

    await db.event.create({
      data: { packId: pack.id, eventType: "play_completed", metadata: JSON.stringify({ sessionToken }) }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Respond Error:", err);
    return NextResponse.json({ success: false, error: "답안 제출 중 오류가 발생했습니다." }, { status: 500 });
  }
}
