import crypto from "crypto";

/**
 * 32바이트 무작위 보안 난수 owner_token 생성 (익명 소유권용)
 */
export function generateOwnerToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * owner_token을 DB에 저장하기 위한 SHA-256 해시값 생성
 */
export function hashOwnerToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * 보따리 공유용 짧고 충돌 없는 URL Slug 생성 (Base62)
 */
export function generateSlug(length: number = 7): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
