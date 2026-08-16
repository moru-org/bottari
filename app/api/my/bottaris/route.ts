import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashOwnerToken } from "@/lib/crypto";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요한 페이지입니다." },
        { status: 401 }
      );
    }

    const packs = await db.pack.findMany({
      where: {
        ownerId: session.id,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      bottaris: packs,
    });
  } catch (err) {
    console.error("Get my bottaris error:", err);
    return NextResponse.json(
      { error: "내 보따리 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokens } = body as { tokens: { slug: string; token: string }[] };

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json({
        success: true,
        bottaris: [],
      });
    }

    const bottaris = [];

    for (const item of tokens) {
      if (!item.slug || !item.token) continue;
      const tokenHash = hashOwnerToken(item.token);

      const pack = await db.pack.findFirst({
        where: {
          slug: item.slug,
          ownerTokenHash: tokenHash,
          status: "active",
        },
      });

      if (pack) {
        bottaris.push(pack);
      }
    }

    return NextResponse.json({
      success: true,
      bottaris,
    });
  } catch (err) {
    console.error("Post my bottaris by tokens error:", err);
    return NextResponse.json(
      { error: "보따리 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
