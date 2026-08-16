import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import { generateOwnerToken, hashOwnerToken, generateSlug } from "../lib/crypto";
import { logEvent, getBottariAnalytics, getAdminMetrics } from "../lib/analytics";

describe("BOTTARI Analytics & Retention Metrics Tests", () => {
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

  it("1. Event Logging & Metrics Aggregation: 플레이 통계 및 오답률 계산 검증", async () => {
    const slug = generateSlug(7);
    const token = generateOwnerToken();
    const tokenHash = hashOwnerToken(token);

    const questions = [
      { id: "q1", question: "내가 좋아하는 음식은?", options: ["치킨", "피자"], answerIndex: 0 },
      { id: "q2", question: "내가 좋아하는 여행은?", options: ["휴양지", "도시관광"], answerIndex: 0 },
      { id: "q3", question: "주말에 나는?", options: ["집", "밖"], answerIndex: 1 },
    ];

    const pack = await db.pack.create({
      data: {
        slug,
        title: "통계 테스트 보따리",
        ownerId: null,
        ownerTokenHash: tokenHash,
        type: "friend_quiz",
        status: "active",
      },
    });

    // 1) 이벤트 발생 시뮬레이션
    await logEvent(pack.id, "content_viewed");
    await logEvent(pack.id, "bottari_opened");
    await logEvent(pack.id, "play_started");
    await logEvent(pack.id, "play_started");
    await logEvent(pack.id, "share_clicked");
    await logEvent(pack.id, "link_copied");
    await logEvent(pack.id, "reaction_created", null, { reaction: "ㅋㅋ" });
    await logEvent(pack.id, "reaction_created", null, { reaction: "ㅋㅋ" });
    await logEvent(pack.id, "reaction_created", null, { reaction: "인정" });
    await logEvent(pack.id, "create_from_result_clicked");

    // 2) 응답 2건 기록
    await db.submission.create({
      data: {
        packId: pack.id,
      },
    });
    await db.submission.create({
      data: {
        packId: pack.id,
      },
    });

    // 3) 통계 집계 검증
    const stats = await getBottariAnalytics(pack.id);
    expect(stats).not.toBeNull();
    expect(stats?.views).toBe(2);
    expect(stats?.starts).toBe(2);
    expect(stats?.completes).toBe(2);
    expect(stats?.completionRate).toBe(100);
    expect(stats?.shares).toBe(2);
    expect(stats?.createAfterPlayCount).toBe(1);
    expect(stats?.viralConversionRate).toBe(50);

    // 이모지 반응 집계 검증
    expect(stats?.reactions).toEqual({
      "ㅋㅋ": 2,
      "인정": 1,
    });
  });

  it("2. Admin Metrics: 전체 시스템 퍼널 및 바이럴 전환율 집계 검증", async () => {
    const slug = generateSlug(7);
    const pack = await db.pack.create({
      data: {
        slug,
        title: "어드민 테스트 보따리",
        ownerId: null,
        ownerTokenHash: "dummyhash",
        type: "friend_quiz",
        status: "active",
      },
    });

    await logEvent(pack.id, "play_started");
    await logEvent(pack.id, "create_from_result_clicked");
    await db.submission.create({
      data: {
        packId: pack.id,
      },
    });

    const admin = await getAdminMetrics();
    expect(admin.totalBottariCount).toBeGreaterThanOrEqual(1);
    expect(admin.totalResponsesCount).toBeGreaterThanOrEqual(1);
    expect(admin.overallViralConversionRate).toBeGreaterThanOrEqual(100);
    expect(admin.recentBottaris.length).toBeGreaterThanOrEqual(1);
  });
});
