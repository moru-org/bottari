import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import { generateOwnerToken, hashOwnerToken, generateSlug } from "../lib/crypto";
import { logEvent, getBottariAnalytics } from "../lib/analytics";
import { QuizQuestion } from "../lib/types";

describe("BOTTARI Analytics & Retention Metrics Tests", () => {
  beforeEach(async () => {
    await db.event.deleteMany();
    await db.response.deleteMany();
    await db.bottari.deleteMany();
    await db.user.deleteMany();
  });

  it("1. Event Logging & Metrics Aggregation: 플레이 통계 및 오답률 계산 검증", async () => {
    const slug = generateSlug(7);
    const token = generateOwnerToken();
    const tokenHash = hashOwnerToken(token);

    const questions: QuizQuestion[] = [
      { id: "q1", question: "내가 좋아하는 음식은?", options: ["치킨", "피자"], answerIndex: 0 },
      { id: "q2", question: "내가 좋아하는 여행은?", options: ["휴양지", "도시관광"], answerIndex: 0 },
      { id: "q3", question: "주말에 나는?", options: ["집", "밖"], answerIndex: 1 },
    ];

    const bottari = await db.bottari.create({
      data: {
        slug,
        title: "통계 테스트 보따리",
        ownerUserId: null,
        ownerTokenHash: tokenHash,
        type: "quiz_know_me",
        payload: JSON.stringify({ questions }),
        status: "active",
      },
    });

    // 1) 이벤트 발생 시뮬레이션
    await logEvent(bottari.id, "content_viewed");
    await logEvent(bottari.id, "content_viewed");
    await logEvent(bottari.id, "content_viewed");
    await logEvent(bottari.id, "play_started");
    await logEvent(bottari.id, "play_started");
    await logEvent(bottari.id, "share_clicked");

    // 2) 응답 2건 기록
    // 응답 1: [0, 0, 1] -> 3문제 다 맞힘 (100%)
    await db.response.create({
      data: {
        bottariId: bottari.id,
        score: 3,
        totalQuestions: 3,
        answersPayload: JSON.stringify([0, 0, 1]),
      },
    });

    // 응답 2: [0, 1, 0] -> q1 맞힘, q2 틀림(답1!=0), q3 틀림(답0!=1) -> 1문제 맞힘 (33%)
    await db.response.create({
      data: {
        bottariId: bottari.id,
        score: 1,
        totalQuestions: 3,
        answersPayload: JSON.stringify([0, 1, 0]),
      },
    });

    // 3) 통계 집계 검증
    const stats = await getBottariAnalytics(bottari.id);
    expect(stats).not.toBeNull();
    expect(stats?.views).toBe(3);
    expect(stats?.starts).toBe(2);
    expect(stats?.completes).toBe(2);
    expect(stats?.completionRate).toBe(100); // 2명 시작 / 2명 완료
    expect(stats?.shares).toBe(1);
    expect(stats?.perfectScoreCount).toBe(1); // 100점 만점 1명

    // 평균 점수: (3 + 1) / (3 + 3) = 4 / 6 = 67%
    expect(stats?.avgScore).toBe(67);

    // 가장 많이 틀린 문제 확인: q2와 q3가 각각 1회 오답(50%)
    expect(stats?.mostFailedQuestion).not.toBeNull();
    expect(stats?.mostFailedQuestion?.failRate).toBe(50);
  });
});
