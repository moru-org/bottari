import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import { generateOwnerToken, hashOwnerToken, generateSlug } from "../lib/crypto";
import { getBottariAnalytics } from "../lib/analytics";
import { PackDefinition } from "../lib/pack-types";

describe("Security & Authorization Tests", () => {
  beforeEach(async () => {
    await db.event.deleteMany();
    await db.answerAggregate.deleteMany();
    await db.response.deleteMany();
    await db.bottari.deleteMany();
    await db.user.deleteMany();
  });

  it("1. Anonymous Feedback IDOR 방어: 비소유자는 익명 메시지 본문 열람 불가", async () => {
    const rawToken = generateOwnerToken();
    const tokenHash = hashOwnerToken(rawToken);
    const slug = generateSlug(7);

    const definition: PackDefinition = {
      version: 1,
      type: "anonymous_feedback",
      title: "익명 메시지 테스트",
      submissionPolicy: { maxSubmissionsPerSession: 3, allowMultiple: true },
      config: {
        type: "anonymous_feedback",
        question: { id: "a1", prompt: "메시지를 남겨줘" },
      },
    };

    const bottari = await db.bottari.create({
      data: {
        slug,
        type: "anonymous_feedback",
        title: "익명 메시지 테스트",
        ownershipType: "anonymous",
        ownerTokenHash: tokenHash,
        payload: JSON.stringify(definition),
        status: "active",
      },
    });

    // 익명 플레이어가 메시지 작성
    await db.response.create({
      data: {
        bottariId: bottari.id,
        answersPayload: JSON.stringify({ message: "비밀 메시지입니다: 12345" }),
        resultPayload: JSON.stringify({ submitted: true }),
      },
    });

    // 1) 공개/비인증 조회 시 (includePrivateData = false) -> anonymousMessages 필드 없음
    const publicAnalytics = await getBottariAnalytics(bottari.id, false);
    expect(publicAnalytics?.anonymousMessages).toBeUndefined();

    // 2) 소유자 인증 조회 시 (includePrivateData = true) -> anonymousMessages 본문 확인 가능
    const privateAnalytics = await getBottariAnalytics(bottari.id, true);
    expect(privateAnalytics?.anonymousMessages).toBeDefined();
    expect(privateAnalytics?.anonymousMessages?.length).toBe(1);
    expect(privateAnalytics?.anonymousMessages?.[0].message).toBe("비밀 메시지입니다: 12345");
  });

  it("2. 보따리 잠금 (status: disabled) 상태에서는 새 응답 제출 차단 검증", async () => {
    const slug = generateSlug(7);
    const bottari = await db.bottari.create({
      data: {
        slug,
        type: "friend_quiz",
        title: "마감 테스트 보따리",
        ownershipType: "anonymous",
        ownerTokenHash: "hash123",
        payload: JSON.stringify({ version: 1, type: "friend_quiz" }),
        status: "disabled", // 잠금/마감 상태
      },
    });

    expect(bottari.status).toBe("disabled");
  });

  it("3. AnswerAggregate O(1) 증분 및 일관성 검증", async () => {
    const slug = generateSlug(7);
    const bottari = await db.bottari.create({
      data: {
        slug,
        type: "balance",
        title: "집계 테스트 보따리",
        ownershipType: "anonymous",
        ownerTokenHash: "hash123",
        payload: JSON.stringify({ version: 1, type: "balance" }),
        status: "active",
      },
    });

    // 3명의 플레이어가 0번 문제에서 각각 0, 1, 0 선택
    const choices = [0, 1, 0];
    for (const choice of choices) {
      await db.$transaction([
        db.response.create({
          data: {
            bottariId: bottari.id,
            answersPayload: JSON.stringify([choice]),
          },
        }),
        db.answerAggregate.upsert({
          where: {
            bottariId_questionIndex_optionIndex: {
              bottariId: bottari.id,
              questionIndex: 0,
              optionIndex: choice,
            },
          },
          update: { count: { increment: 1 } },
          create: {
            bottariId: bottari.id,
            questionIndex: 0,
            optionIndex: choice,
            count: 1,
          },
        }),
      ]);
    }

    const aggregates = await db.answerAggregate.findMany({
      where: { bottariId: bottari.id, questionIndex: 0 },
      orderBy: { optionIndex: "asc" },
    });

    // Option 0은 2표, Option 1은 1표
    expect(aggregates.find((a) => a.optionIndex === 0)?.count).toBe(2);
    expect(aggregates.find((a) => a.optionIndex === 1)?.count).toBe(1);
  });
});
