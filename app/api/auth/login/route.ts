import { NextRequest, NextResponse } from "next/server";
import { findOrCreateUser, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider = "mock", name = "보따리 친구", providerUserId } = body;

    // 데모/Mock 로그인용 ID 생성 또는 지정
    const effectiveUserId =
      providerUserId ||
      `mock_${provider}_${Math.random().toString(36).substring(2, 10)}`;

    const user = await findOrCreateUser(
      provider,
      effectiveUserId,
      name,
      `https://api.dicebear.com/7.x/bottts/svg?seed=${effectiveUserId}`
    );

    await setSessionCookie(user);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
