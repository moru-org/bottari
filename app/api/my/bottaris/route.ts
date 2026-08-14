import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBottariAnalytics } from "@/lib/analytics";

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
        const stats = await getBottariAnalytics(b.id);
        return (
          stats || {
            id: b.id,
            slug: b.slug,
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
