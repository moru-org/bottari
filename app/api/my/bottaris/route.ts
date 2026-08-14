import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBottariAnalytics } from "@/lib/analytics";
import { hashOwnerToken } from "@/lib/crypto";
import { OwnerTokenItem } from "@/lib/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요한 페이지입니다." },
        { status: 401 }
      );
    }

    const bottaris = await db.bottari.findMany({
      where: {
        ownerUserId: session.id,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    });

    const statsList = await Promise.all(
      bottaris.map(async (b) => {
        const stats = await getBottariAnalytics(b.id, true);
        return (
          stats || {
            id: b.id,
            slug: b.slug,
            type: b.type as any,
            title: b.title,
            createdAt: b.createdAt.toISOString(),
            views: 0,
            starts: 0,
            completes: 0,
            completionRate: 0,
            avgScore: 0,
            shares: 0,
            mostFailedQuestion: null,
            perfectScoreCount: 0,
          }
        );
      })
    );

    return NextResponse.json({
      success: true,
      bottaris: statsList,
    });
  } catch (err) {
    console.error("Get my bottaris error:", err);
    return NextResponse.json(
      { error: "내 보따리 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 비로그인 상태에서 로컬 토큰으로 내 보따리 목록 및 통계 조회
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokens } = body as { tokens: OwnerTokenItem[] };

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json({
        success: true,
        bottaris: [],
      });
    }

    const statsList = [];

    for (const item of tokens) {
      if (!item.slug || !item.token) continue;
      const tokenHash = hashOwnerToken(item.token);

      const bottari = await db.bottari.findFirst({
        where: {
          slug: item.slug,
          ownerTokenHash: tokenHash,
          status: "active",
        },
      });

      if (bottari) {
        const stats = await getBottariAnalytics(bottari.id, true);
        if (stats) {
          statsList.push(stats);
        }
      }
    }

    return NextResponse.json({
      success: true,
      bottaris: statsList,
    });
  } catch (err) {
    console.error("Post my bottaris by tokens error:", err);
    return NextResponse.json(
      { error: "보따리 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
