import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBottariAnalytics } from "@/lib/analytics";
import { hashOwnerToken } from "@/lib/crypto";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await getSession();

    const bottari = await db.bottari.findUnique({
      where: { slug },
    });

    if (!bottari) {
      return NextResponse.json(
        { error: "보따리를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (session && bottari.ownerUserId === session.id) {
      const analytics = await getBottariAnalytics(bottari.id, true);
      return NextResponse.json({
        success: true,
        analytics,
        status: bottari.status,
      });
    }

    return NextResponse.json(
      { error: "로그인이 필요하거나 권한이 없습니다." },
      { status: 401 }
    );
  } catch (err) {
    console.error("Get analytics error:", err);
    return NextResponse.json(
      { error: "상세 반응 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 익명 토큰으로 상세 통계 및 소유자 데이터 조회
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { token } = body as { token?: string };

    const bottari = await db.bottari.findUnique({
      where: { slug },
    });

    if (!bottari) {
      return NextResponse.json(
        { error: "보따리를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (token) {
      const tokenHash = hashOwnerToken(token);
      if (bottari.ownerTokenHash === tokenHash) {
        const analytics = await getBottariAnalytics(bottari.id, true);
        return NextResponse.json({
          success: true,
          analytics,
          status: bottari.status,
        });
      }
    }

    return NextResponse.json(
      { error: "보따리 조회 권한이 없습니다." },
      { status: 403 }
    );
  } catch (err) {
    console.error("Post analytics error:", err);
    return NextResponse.json(
      { error: "상세 반응 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
