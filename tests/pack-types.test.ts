import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import { generateOwnerToken, hashOwnerToken, generateSlug } from "../lib/crypto";

describe("Pack Types, Ownership & Snapshot Invariants Tests", () => {
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

  it("1. Template -> Pack Invariant: 템플릿 생성 및 Pack 관계 검증", async () => {
    const template = await db.packTemplate.create({
      data: {
        slug: "tpl_original_test",
        type: "friend_quiz",
        category: "friend",
        title: "원본 템플릿",
        emoji: "🎁",
        payload: JSON.stringify({ type: "friend_quiz", title: "원본" }),
      },
    });

    const token = generateOwnerToken();
    const tokenHash = hashOwnerToken(token);

    const pack = await db.pack.create({
      data: {
        slug: generateSlug(7),
        templateId: template.id,
        type: "friend_quiz",
        title: "사용자 생성 팩",
        ownerTokenHash: tokenHash,
        status: "active",
      },
    });

    await db.packTemplate.update({
      where: { id: template.id },
      data: {
        title: "수정된 템플릿 제목",
      },
    });

    const fetchedPack = await db.pack.findUnique({ where: { id: pack.id } });
    expect(fetchedPack?.title).toBe("사용자 생성 팩");
  });

  it("2. Ownership Model: Anonymous, User 분리 검증", async () => {
    // 1) Anonymous Pack (익명 생성 - ownerTokenHash 필수)
    const rawToken = generateOwnerToken();
    const tokenHash = hashOwnerToken(rawToken);
    const anonPack = await db.pack.create({
      data: {
        slug: generateSlug(7),
        type: "friend_quiz",
        title: "익명 생성 팩",
        ownerId: null,
        ownerTokenHash: tokenHash,
        status: "active",
      },
    });
    expect(anonPack.ownerTokenHash).toBe(tokenHash);
    expect(anonPack.ownerId).toBeNull();

    // 2) User Pack (로그인 회원 생성 - ownerId 필수)
    const user = await db.user.create({
      data: {
        provider: "kakao",
        providerUserId: "kakao_9999",
        name: "테스트유저",
      },
    });

    const userPack = await db.pack.create({
      data: {
        slug: generateSlug(7),
        type: "guess_me",
        title: "회원 생성 팩",
        ownerId: user.id,
        ownerTokenHash: null,
        status: "active",
      },
    });
    expect(userPack.ownerId).toBe(user.id);
    expect(userPack.ownerTokenHash).toBeNull();
  });
});
