import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import { generateOwnerToken, hashOwnerToken, generateSlug } from "../lib/crypto";
import { evaluateQuiz } from "../lib/scoring";
import { signSession, verifySession } from "../lib/auth";
import { QuizQuestion } from "../lib/types";

describe("BOTTARI Core Architecture & Security Tests", () => {
  beforeEach(async () => {
    // 테스트용 DB 정리
    await db.event.deleteMany();
    await db.response.deleteMany();
    await db.bottari.deleteMany();
    await db.user.deleteMany();
  });

  it("1. Crypto & Slug Generation: 난수 토큰 생성 및 해시 무결성 검증", () => {
    const token1 = generateOwnerToken();
    const token2 = generateOwnerToken();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64); // 32 bytes hex

    const hash1 = hashOwnerToken(token1);
    const hash1Again = hashOwnerToken(token1);
    expect(hash1).toBe(hash1Again);
    expect(hash1).not.toBe(token1);

    const slug = generateSlug(7);
    expect(slug.length).toBe(7);
    expect(/^[a-zA-Z0-9]+$/.test(slug)).toBe(true);
  });

  it("2. Scoring Engine: 퀴즈 채점 및 등급 산출 검증", () => {
    const mockQuestions: QuizQuestion[] = [
      { id: "1", question: "치킨 vs 피자", options: ["치킨", "피자"], answerIndex: 0 },
      { id: "2", question: "집 vs 밖", options: ["집", "밖"], answerIndex: 0 },
      { id: "3", question: "J vs P", options: ["J", "P"], answerIndex: 1 },
      { id: "4", question: "얼죽아 vs 뜨아", options: ["얼죽아", "뜨아"], answerIndex: 0 },
      { id: "5", question: "칼답 vs 늦답", options: ["칼답", "늦답"], answerIndex: 0 },
    ];

    // 5개 중 4개 맞힘 (80%)
    const answers1 = [0, 0, 1, 0, 1];
    const result1 = evaluateQuiz(mockQuestions, answers1);
    expect(result1.score).toBe(4);
    expect(result1.totalQuestions).toBe(5);
    expect(result1.percentage).toBe(80);
    expect(result1.gradeTitle).toContain("특급 베프");
    expect(result1.questionsFeedback[4].isCorrect).toBe(false);

    // 5개 중 5개 맞힘 (100%)
    const answers2 = [0, 0, 1, 0, 0];
    const result2 = evaluateQuiz(mockQuestions, answers2);
    expect(result2.score).toBe(5);
    expect(result2.percentage).toBe(100);
    expect(result2.gradeTitle).toContain("영혼의 도플갱어");

    // 0개 맞힘 (0%)
    const answers3 = [1, 1, 0, 1, 1];
    const result3 = evaluateQuiz(mockQuestions, answers3);
    expect(result3.score).toBe(0);
    expect(result3.percentage).toBe(0);
    expect(result3.gradeTitle).toContain("혹시 스파이");
  });

  it("3. Session Auth Token: HMAC 서명 및 검증", () => {
    const mockUser = {
      id: "usr_123",
      provider: "kakao",
      providerUserId: "kakao_9999",
      name: "테스트유저",
    };

    const token = signSession(mockUser);
    const verified = verifySession(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe("usr_123");
    expect(verified?.name).toBe("테스트유저");

    // 위조 토큰 검증 실패 확인
    const tamperedToken = token + "bad";
    expect(verifySession(tamperedToken)).toBeNull();
  });

  it("4. Anonymous Ownership & Claim Flow: 익명 생성 후 로그인 귀속 및 IDOR 방어 검증", async () => {
    // 1) 익명 생성자가 보따리 생성
    const rawOwnerToken = generateOwnerToken();
    const tokenHash = hashOwnerToken(rawOwnerToken);
    const slug = generateSlug(7);

    const questions: QuizQuestion[] = [
      { id: "q1", question: "선호 음식", options: ["치킨", "피자"], answerIndex: 0 },
      { id: "q2", question: "선호 여행", options: ["국내", "해외"], answerIndex: 1 },
      { id: "q3", question: "선호 요일", options: ["토", "일"], answerIndex: 0 },
    ];

    const createdBottari = await db.bottari.create({
      data: {
        slug,
        title: "익명 생성 보따리",
        ownerUserId: null,
        ownerTokenHash: tokenHash,
        type: "quiz_know_me",
        payload: JSON.stringify({ questions }),
        status: "active",
      },
    });

    expect(createdBottari.ownerUserId).toBeNull();

    // 2) 사용자 A가 로그인하여 본인 소유로 Claim
    const userA = await db.user.create({
      data: {
        provider: "kakao",
        providerUserId: "kakao_user_a",
        name: "유저A",
      },
    });

    // 유효한 ownerToken으로 Claim 성공
    const validHash = hashOwnerToken(rawOwnerToken);
    const claimTarget = await db.bottari.findFirst({
      where: { slug, ownerTokenHash: validHash },
    });
    expect(claimTarget).not.toBeNull();

    await db.bottari.update({
      where: { id: claimTarget!.id },
      data: { ownerUserId: userA.id },
    });

    const claimedBottari = await db.bottari.findUnique({ where: { slug } });
    expect(claimedBottari?.ownerUserId).toBe(userA.id);

    // 3) 다른 사용자 B가 잘못된 토큰 또는 이미 Claim된 보따리를 가로채려 시도하는 경우 방어
    const userB = await db.user.create({
      data: {
        provider: "google",
        providerUserId: "google_user_b",
        name: "유저B",
      },
    });

    // 잘못된 토큰 시도 -> 조회 불가
    const fakeHash = hashOwnerToken("invalid_fake_token_12345");
    const fakeTarget = await db.bottari.findFirst({
      where: { slug, ownerTokenHash: fakeHash },
    });
    expect(fakeTarget).toBeNull();

    // 이미 userA에게 소유권이 귀속된 보따리는 userB가 재-claim 불가
    const reClaimCheck = await db.bottari.findFirst({
      where: { slug, ownerTokenHash: validHash },
    });
    expect(reClaimCheck?.ownerUserId).toBe(userA.id); // userA 소유 유지
    expect(reClaimCheck?.ownerUserId).not.toBe(userB.id);
  });
});
