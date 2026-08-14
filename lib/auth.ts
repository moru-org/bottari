import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { UserSession } from "./types";

const COOKIE_NAME = "bottari_session";
const AUTH_SECRET = process.env.AUTH_SECRET || "bottari_default_secure_secret_2026";

/**
 * 안전한 HMAC-SHA256 세션 토큰 생성
 */
export function signSession(session: UserSession): string {
  const payloadStr = JSON.stringify(session);
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

/**
 * 세션 토큰 검증 및 복호화
 */
export function verifySession(token: string): UserSession | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;

    const expectedSig = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(payloadB64)
      .digest("base64url");

    if (signature !== expectedSig) return null;

    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf-8");
    return JSON.parse(payloadStr) as UserSession;
  } catch {
    return null;
  }
}

/**
 * Next.js Server Request에서 현재 세션 유저 가져오기
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySession(sessionCookie.value);
}

/**
 * 세션 쿠키 설정
 */
export async function setSessionCookie(session: UserSession) {
  const token = signSession(session);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
}

/**
 * 세션 쿠키 삭제
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * SSO 로그인 시 사용자 조회 또는 생성
 */
export async function findOrCreateUser(
  provider: string,
  providerUserId: string,
  name?: string,
  avatar?: string
) {
  const user = await db.user.upsert({
    where: { providerUserId },
    update: {
      name: name || undefined,
      avatar: avatar || undefined,
    },
    create: {
      provider,
      providerUserId,
      name: name || "보따리 친구",
      avatar: avatar || undefined,
    },
  });

  return {
    id: user.id,
    provider: user.provider,
    providerUserId: user.providerUserId,
    name: user.name || "보따리 친구",
    avatar: user.avatar || undefined,
  };
}
