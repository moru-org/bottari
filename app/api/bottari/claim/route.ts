import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashOwnerToken } from "@/lib/crypto";

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
    const { tokens } = body as { tokens: { slug: string; token: string }[] };

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

      const pack = await db.pack.findFirst({
        where: {
          slug: item.slug,
          ownerTokenHash: tokenHash,
        },
      });

      if (pack) {
        if (pack.ownerId === session.id) {
          claimedSlugs.push(pack.slug);
          continue;
        }

        if (pack.ownerId && pack.ownerId !== session.id) {
          continue;
        }

        await db.pack.update({
          where: { id: pack.id },
          data: { ownerId: session.id },
        });

        claimedSlugs.push(pack.slug);
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
