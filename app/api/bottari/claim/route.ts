import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashOwnerToken } from "@/lib/crypto";
import { OwnerTokenItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요한 요청입니다." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { tokens } = body as { tokens: OwnerTokenItem[] };

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json({
        claimedCount: 0,
        claimedSlugs: [],
        message: "귀속할 보따리 토큰이 없습니다.",
      });
    }

    const claimedSlugs: string[] = [];

    for (const item of tokens) {
      if (!item.slug || !item.token) continue;

      const tokenHash = hashOwnerToken(item.token);

      // 1. 토큰 해시가 일치하고 아직 주인이 없는(ownerUserId === null) 보따리 조회
      const bottari = await db.bottari.findFirst({
        where: {
          slug: item.slug,
          ownerTokenHash: tokenHash,
        },
      });

      if (bottari) {
        // 이미 본인 소유인 경우
        if (bottari.ownerUserId === session.id) {
          claimedSlugs.push(bottari.slug);
          continue;
        }

        // 다른 사용자에게 이미 claim된 경우 보안상 덮어쓰기 불가
        if (bottari.ownerUserId && bottari.ownerUserId !== session.id) {
          continue;
        }

        // 미귀속 보따리를 현재 로그인 사용자로 업데이트
        await db.bottari.update({
          where: { id: bottari.id },
          data: { ownerUserId: session.id },
        });

        claimedSlugs.push(bottari.slug);
      }
    }

    return NextResponse.json({
      success: true,
      claimedCount: claimedSlugs.length,
      claimedSlugs,
    });
  } catch (err) {
    console.error("Claim error:", err);
    return NextResponse.json(
      { error: "소유권 귀속 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
