import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOwnerToken, hashOwnerToken, generateSlug } from "@/lib/crypto";
import { getSession } from "@/lib/auth";
import { logEvent } from "@/lib/analytics";
import { PackDefinition, PackType, OwnershipType } from "@/lib/pack-types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      emoji = "🎁",
      type = "friend_quiz",
      templateId,
      definition,
      referralId,
    } = body as {
      title: string;
      description?: string;
      emoji?: string;
      type?: PackType;
      templateId?: string;
      definition?: PackDefinition;
      referralId?: string;
    };

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "보따리 제목을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!definition || !definition.config) {
      return NextResponse.json(
        { success: false, error: "보따리 설정(definition)이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 소유권 유형 및 사용자/토큰 결정
    const sessionUser = await getSession();
    let ownershipType: OwnershipType = "anonymous";
    let ownerUserId: string | null = null;
    let rawOwnerToken: string | null = null;
    let ownerTokenHash: string | null = null;

    if (sessionUser) {
      ownershipType = "user";
      ownerUserId = sessionUser.id;
    } else {
      ownershipType = "anonymous";
      rawOwnerToken = generateOwnerToken();
      ownerTokenHash = hashOwnerToken(rawOwnerToken);
    }

    const slug = generateSlug(7);

    // Deep-copied immutable snapshot of PackDefinition
    const finalDefinition: PackDefinition = {
      version: 1,
      type: definition.type || type,
      title: title.trim(),
      description: description?.trim() || undefined,
      emoji: emoji || "🎁",
      config: definition.config,
      submissionPolicy: definition.submissionPolicy || {
        maxSubmissionsPerSession: definition.type === "anonymous_feedback" ? 3 : 1,
        allowMultiple: definition.type === "anonymous_feedback",
      },
    };

    const bottari = await db.bottari.create({
      data: {
        slug,
        type: finalDefinition.type,
        title: finalDefinition.title,
        description: finalDefinition.description || null,
        templateId: templateId || null,
        ownershipType,
        ownerUserId,
        ownerTokenHash,
        payload: JSON.stringify(finalDefinition),
        status: "active",
      },
    });

    await logEvent(bottari.id, "bottari_created", referralId || null, {
      type: finalDefinition.type,
      isTemplate: !!templateId,
      ownershipType,
    });

    return NextResponse.json({
      success: true,
      slug: bottari.slug,
      title: bottari.title,
      type: bottari.type,
      ownerToken: rawOwnerToken,
    });
  } catch (err) {
    console.error("Create Bottari Error:", err);
    return NextResponse.json(
      { success: false, error: "보따리를 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
