import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBottariAnalytics } from "@/lib/analytics";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요한 요청입니다." },
        { status: 401 }
      );
    }

    const { slug } = await params;

    const bottari = await db.bottari.findUnique({
      where: { slug },
    });

    if (!bottari || bottari.status !== "active") {
      return NextResponse.json(
        { error: "보따리를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 소유자 권한 확인
    if (bottari.ownerUserId !== session.id) {
      return NextResponse.json(
        { error: "해당 보따리의 반응을 볼 수 있는 권한이 없습니다." },
        { status: 403 }
      );
    }

    const analytics = await getBottariAnalytics(bottari.id);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err) {
    console.error("Get analytics error:", err);
    return NextResponse.json(
      { error: "상세 반응 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
