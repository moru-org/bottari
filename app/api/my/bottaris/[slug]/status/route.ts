import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashOwnerToken } from "@/lib/crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { status, ownerToken } = body as {
      status: "active" | "disabled";
      ownerToken?: string;
    };

    if (status !== "active" && status !== "disabled") {
      return NextResponse.json(
        { success: false, error: "상태 값이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const session = await getSession();
    const tokenHash = ownerToken ? hashOwnerToken(ownerToken) : null;

    // 소유자 확인 (세션 or 토큰 해시)
    const bottari = await db.bottari.findFirst({
      where: {
        slug,
        OR: [
          session ? { ownerUserId: session.id } : { id: "no_match" },
          tokenHash ? { ownerTokenHash: tokenHash } : { id: "no_match" },
        ],
      },
    });

    if (!bottari) {
      return NextResponse.json(
        { success: false, error: "보따리 소유자 권한이 없습니다." },
        { status: 403 }
      );
    }

    const updated = await db.bottari.update({
      where: { id: bottari.id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      slug: updated.slug,
      status: updated.status,
      message: updated.status === "disabled" ? "보따리가 마감(잠금)되었습니다." : "보따리가 활성화되었습니다.",
    });
  } catch (err) {
    console.error("Status toggle error:", err);
    return NextResponse.json(
      { success: false, error: "상태 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
