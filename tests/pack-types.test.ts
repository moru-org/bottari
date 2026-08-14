import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import { generateOwnerToken, hashOwnerToken, generateSlug } from "../lib/crypto";
import { PackDefinition } from "../lib/pack-types";

describe("Pack Types, Ownership & Snapshot Invariants Tests", () => {
  beforeEach(async () => {
    await db.event.deleteMany();
    await db.answerAggregate.deleteMany();
    await db.response.deleteMany();
    await db.bottari.deleteMany();
    await db.packTemplate.deleteMany();
    await db.user.deleteMany();
  });

  it("1. Template -> Pack Snapshot Invariant: 템플릿 변경이 이미 생성된 Pack에 영향을 주지 않음", async () => {
    // 1) 템플릿 생성
    const originalDefinition: PackDefinition = {
      version: 1,
      type: "friend_quiz",
      title: "원본 템플릿",
      submissionPolicy: { maxSubmissionsPerSession: 1, allowMultiple: false },
      config: {
        type: "friend_quiz",
        questions: [{ id: "q1", question: "원본 질문", options: ["A", "B"], answerIndex: 0 }],
        resultRules: [],
      },
    };

    const template = await db.packTemplate.create({
      data: {
        slug: "tpl_original_test",
        type: "friend_quiz",
        category: "friend",
        title: "원본 템플릿",
        emoji: "🎁",
        payload: JSON.stringify(originalDefinition),
      },
    });

    // 2) 템플릿으로부터 Deep-copy 스냅샷으로 Pack 생성
    const snapshotDefinition: PackDefinition = JSON.parse(JSON.stringify(originalDefinition));
    const token = generateOwnerToken();
    const tokenHash = hashOwnerToken(token);

    const pack = await db.bottari.create({
      data: {
        slug: generateSlug(7),
        templateId: template.id,
        type: "friend_quiz",
        title: "사용자 생성 팩",
        ownershipType: "anonymous",
        ownerTokenHash: tokenHash,
        payload: JSON.stringify(snapshotDefinition),
        status: "active",
      },
    });

    // 3) 운영자가 템플릿을 수정
    const modifiedDefinition: PackDefinition = {
      ...originalDefinition,
      title: "수정된 템플릿 제목",
      config: {
        type: "friend_quiz",
        questions: [{ id: "q1", question: "완전히 바뀐 질문 내용", options: ["X", "Y"], answerIndex: 1 }],
        resultRules: [],
      },
    };

    await db.packTemplate.update({
      where: { id: template.id },
      data: {
        title: "수정된 템플릿 제목",
        payload: JSON.stringify(modifiedDefinition),
      },
    });

    // 4) 기존 Pack의 payload가 그대로 보존되었는지 검증 (불변성)
    const fetchedPack = await db.bottari.findUnique({ where: { id: pack.id } });
    const fetchedDef = JSON.parse(fetchedPack!.payload) as PackDefinition;

    expect(fetchedDef.title).toBe("원본 템플릿");
    expect(fetchedDef.config.type === "friend_quiz" && fetchedDef.config.questions[0].question).toBe("원본 질문");
    expect(fetchedDef.config.type === "friend_quiz" && fetchedDef.config.questions[0].options).toEqual(["A", "B"]);
  });

  it("2. Ownership Model: System, Anonymous, User 분리 검증", async () => {
    // 1) System Pack (운영자 공식 콘텐츠 - ownerTokenHash=null, ownerUserId=null)
    const systemPack = await db.bottari.create({
      data: {
        slug: generateSlug(7),
        type: "balance",
        title: "운영자 공식 밸런스",
        ownershipType: "system",
        ownerUserId: null,
        ownerTokenHash: null,
        payload: JSON.stringify({ version: 1, type: "balance" }),
        status: "active",
      },
    });
    expect(systemPack.ownershipType).toBe("system");
    expect(systemPack.ownerTokenHash).toBeNull();
    expect(systemPack.ownerUserId).toBeNull();

    // 2) Anonymous Pack (익명 생성 - ownerTokenHash 필수)
    const rawToken = generateOwnerToken();
    const tokenHash = hashOwnerToken(rawToken);
    const anonPack = await db.bottari.create({
      data: {
        slug: generateSlug(7),
        type: "friend_quiz",
        title: "익명 생성 팩",
        ownershipType: "anonymous",
        ownerUserId: null,
        ownerTokenHash: tokenHash,
        payload: JSON.stringify({ version: 1, type: "friend_quiz" }),
        status: "active",
      },
    });
    expect(anonPack.ownershipType).toBe("anonymous");
    expect(anonPack.ownerTokenHash).toBe(tokenHash);

    // 3) User Pack (로그인 회원 생성 - ownerUserId 필수)
    const user = await db.user.create({
      data: {
        provider: "kakao",
        providerUserId: "kakao_9999",
        name: "테스트유저",
      },
    });

    const userPack = await db.bottari.create({
      data: {
        slug: generateSlug(7),
        type: "guess_me",
        title: "회원 생성 팩",
        ownershipType: "user",
        ownerUserId: user.id,
        ownerTokenHash: null,
        payload: JSON.stringify({ version: 1, type: "guess_me" }),
        status: "active",
      },
    });
    expect(userPack.ownershipType).toBe("user");
    expect(userPack.ownerUserId).toBe(user.id);
  });
});
