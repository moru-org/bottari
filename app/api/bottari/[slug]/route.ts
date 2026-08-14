import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PackDefinition, PackPlayData, PackType } from "@/lib/pack-types";
import { extractPublicQuestions } from "@/lib/pack-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const bottari = await db.bottari.findUnique({
      where: { slug },
      include: {
        template: {
          select: { title: true, emoji: true, category: true },
        },
      },
    });

    if (!bottari) {
      return NextResponse.json(
        { success: false, error: "보따리를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    let definition: PackDefinition;
    try {
      definition = JSON.parse(bottari.payload);
    } catch {
      definition = {
        version: 1,
        type: bottari.type as any,
        title: bottari.title,
        description: bottari.description || undefined,
        emoji: "🎁",
        config: { type: bottari.type as any, questions: [] } as any,
        submissionPolicy: { maxSubmissionsPerSession: 1, allowMultiple: false },
      };
    }

    // 보안: 정답 정보 제거된 공개 질문 목록 생성
    const publicQuestions = extractPublicQuestions(definition);

    const playData: PackPlayData = {
      id: bottari.id,
      slug: bottari.slug,
      type: (bottari.type as PackType) || "friend_quiz",
      title: bottari.title,
      description: bottari.description,
      emoji: definition.emoji || "🎁",
      creatorName: definition.config.creatorName,
      status: (bottari.status as "active" | "disabled") || "active",
      questions: publicQuestions,
      submissionPolicy: definition.submissionPolicy || {
        maxSubmissionsPerSession: 1,
        allowMultiple: false,
      },
      createdAt: bottari.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, bottari: playData });
  } catch (err) {
    console.error("Get Bottari Error:", err);
    return NextResponse.json(
      { success: false, error: "보따리 정보를 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}
