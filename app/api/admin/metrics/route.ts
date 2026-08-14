import { NextResponse } from "next/server";
import { getAdminMetrics } from "@/lib/analytics";

export async function GET() {
  try {
    const metrics = await getAdminMetrics();
    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (err) {
    console.error("Admin metrics error:", err);
    return NextResponse.json(
      { error: "운영 통계를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
