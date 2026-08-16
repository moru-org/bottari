import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOwnerToken, hashOwnerToken } from "@/lib/crypto";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      type = "friend_quiz",
      templateId,
    } = body as {
      title: string;
      description?: string;
      type?: string;
      templateId?: string;
    };

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "보따리 제목을 입력해주세요." },
        { status: 400 }
      );
    }

    const sessionUser = await getSession();
    let ownerId: string | null = null;
    let ownerTokenHash: string | null = null;

    if (sessionUser) {
      ownerId = sessionUser.id;
    } else {
      const rawOwnerToken = generateOwnerToken();
      ownerTokenHash = hashOwnerToken(rawOwnerToken);
      
      // Return token in a cookie or separate field for V1
      // For now, we'll just return it in the response body
      const slug = title.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20) || 'bottari';
      
      const pack = await db.pack.create({
        data: {
          slug,
          title: title.trim(),
          description: description?.trim() || null,
          type,
          ownerId,
          ownerTokenHash,
          templateId,
          status: "active",
        }
      });

      return NextResponse.json({
        success: true,
        slug: pack.slug,
        title: pack.title,
        type: pack.type,
        ownerToken: rawOwnerToken,
      });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20) || 'bottari';

    const pack = await db.pack.create({
      data: {
        slug,
        title: title.trim(),
        description: description?.trim() || null,
        type,
        ownerId,
        ownerTokenHash,
        templateId,
        status: "active",
      },
    });

    return NextResponse.json({
      success: true,
      slug: pack.slug,
      title: pack.title,
      type: pack.type,
    });
  } catch (err) {
    console.error("Create Bottari Error:", err);
    return NextResponse.json(
      { success: false, error: "보따리를 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
