import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashOwnerToken } from "@/lib/crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { isHidden = true, ownerToken } = body as {
      isHidden?: boolean;
      ownerToken?: string;
    };

    const session = await getSession();
    const tokenHash = ownerToken ? hashOwnerToken(ownerToken) : null;

    const responseItem = await db.response.findUnique({
      where: { id },
      include: { bottari: true },
    });

    if (!responseItem) {
      return NextResponse.json(
        { success: false, error: "응답을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const isOwner =
      (session && responseItem.bottari.ownerUserId === session.id) ||
      (tokenHash && responseItem.bottari.ownerTokenHash === tokenHash);

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "소유자 권한이 없습니다." },
        { status: 403 }
      );
    }

    const updated = await db.response.update({
      where: { id },
      data: { isHidden },
    });

    return NextResponse.json({
      success: true,
      id: updated.id,
      isHidden: updated.isHidden,
    });
  } catch (err) {
    console.error("Hide response error:", err);
    return NextResponse.json(
      { success: false, error: "메시지 상태 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
