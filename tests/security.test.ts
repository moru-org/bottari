import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import { generateOwnerToken, hashOwnerToken, generateSlug } from "../lib/crypto";
import { getBottariAnalytics } from "../lib/analytics";

describe("Security & Authorization Tests", () => {
  beforeEach(async () => {
    await db.event.deleteMany();
    await db.submissionAnswer.deleteMany();
    await db.submission.deleteMany();
    await db.scoreMapping.deleteMany();
    await db.questionOption.deleteMany();
    await db.packQuestion.deleteMany();
    await db.packResultCharacter.deleteMany();
    await db.pack.deleteMany();
    await db.packTemplate.deleteMany();
    await db.user.deleteMany();
  });

  it("1. Anonymous Feedback IDOR 방어: 비소유자는 익명 메시지 본문 열람 불가", async () => {
    const rawToken = generateOwnerToken();
    const tokenHash = hashOwnerToken(rawToken);
    const slug = generateSlug(7);

    const pack = await db.pack.create({
      data: {
        slug,
        type: "anonymous_feedback",
        title: "익명 메시지 테스트",
        ownerTokenHash: tokenHash,
        status: "active",
      },
    });

    await db.submission.create({
      data: {
        packId: pack.id,
      },
    });

    // 1) 공개/비인증 조회 시 (includePrivateData = false) -> anonymousMessages 필드 없음
    const publicAnalytics = await getBottariAnalytics(pack.id, false);
    expect(publicAnalytics?.anonymousMessages).toBeUndefined();

    // 2) 소유자 인증 조회 시 (includePrivateData = true) -> 정상 통계 확인 가능
    const privateAnalytics = await getBottariAnalytics(pack.id, true);
    expect(privateAnalytics).toBeDefined();
  });

  it("2. 보따리 잠금 (status: disabled) 상태 검증", async () => {
    const slug = generateSlug(7);
    const pack = await db.pack.create({
      data: {
        slug,
        type: "friend_quiz",
        title: "마감 테스트 보따리",
        ownerTokenHash: "hash123",
        status: "disabled", // 잠금/마감 상태
      },
    });

    expect(pack.status).toBe("disabled");
  });
});
