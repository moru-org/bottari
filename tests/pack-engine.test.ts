import { describe, it, expect } from "vitest";
import {
  evaluateFriendQuiz,
  evaluateGuessMe,
  aggregateFirstImpression,
  processAnonymousFeedback,
  aggregateBalanceGame,
  extractPublicQuestions,
} from "../lib/pack-engine";
import {
  FriendQuizConfig,
  GuessMeConfig,
  FirstImpressionConfig,
  BalanceConfig,
  PackDefinition,
} from "../lib/pack-types";

describe("Pack Engine Tests (5 Pack Types Verification)", () => {
  // 1. Friend Quiz
  it("1. Friend Quiz: 점수 계산, 백분율 및 등급 산출 검증", () => {
    const config: FriendQuizConfig = {
      type: "friend_quiz",
      questions: [
        { id: "q1", question: "치킨 vs 피자", options: ["치킨", "피자"], answerIndex: 0 },
        { id: "q2", question: "집 vs 밖", options: ["집", "밖"], answerIndex: 0 },
        { id: "q3", question: "얼죽아 vs 뜨아", options: ["얼죽아", "뜨아"], answerIndex: 0 },
        { id: "q4", question: "여름 vs 겨울", options: ["여름", "겨울"], answerIndex: 1 },
      ],
      resultRules: [
        { minPercentage: 100, maxPercentage: 100, title: "만점 찐친", message: "완벽!" },
        { minPercentage: 50, maxPercentage: 99, title: "절친", message: "잘 통함" },
        { minPercentage: 0, maxPercentage: 49, title: "스파이", message: "친해지자" },
      ],
    };

    // 4문제 중 3문제 정답 (75%)
    const answers1 = [0, 0, 0, 0]; // 마지막 틀림 (답: 1)
    const result1 = evaluateFriendQuiz(config, answers1);
    expect(result1.score).toBe(3);
    expect(result1.totalQuestions).toBe(4);
    expect(result1.percentage).toBe(75);
    expect(result1.gradeTitle).toBe("절친");
    expect(result1.questionsFeedback[3].isCorrect).toBe(false);

    // 4문제 중 4문제 만점 (100%)
    const answers2 = [0, 0, 0, 1];
    const result2 = evaluateFriendQuiz(config, answers2);
    expect(result2.score).toBe(4);
    expect(result2.percentage).toBe(100);
    expect(result2.gradeTitle).toBe("만점 찐친");

    // 0문제 정답 (0%)
    const answers3 = [1, 1, 1, 0];
    const result3 = evaluateFriendQuiz(config, answers3);
    expect(result3.score).toBe(0);
    expect(result3.percentage).toBe(0);
    expect(result3.gradeTitle).toBe("스파이");
  });

  // 2. Guess Me
  it("2. Guess Me: Creator의 선택과의 일치율 계산 검증", () => {
    const config: GuessMeConfig = {
      type: "guess_me",
      questions: [
        { id: "g1", question: "평생 하나만?", options: ["치킨", "피자"], creatorChoiceIndex: 0 },
        { id: "g2", question: "초능력은?", options: ["시간되돌리기", "순간이동"], creatorChoiceIndex: 1 },
        { id: "g3", question: "주말에는?", options: ["집", "밖"], creatorChoiceIndex: 0 },
      ],
    };

    // 3개 중 2개 일치 (67%)
    const answers = [0, 1, 1]; // g3 불일치
    const result = evaluateGuessMe(config, answers);
    expect(result.matchCount).toBe(2);
    expect(result.totalQuestions).toBe(3);
    expect(result.matchPercentage).toBe(67);
    expect(result.matchesFeedback[0].isMatched).toBe(true);
    expect(result.matchesFeedback[2].isMatched).toBe(false);
  });

  // 3. First Impression (Aggregate)
  it("3. First Impression: 집계 득표수 및 선택지별 백분율 계산 검증", () => {
    const config: FirstImpressionConfig = {
      type: "first_impression",
      questions: [
        {
          id: "i1",
          question: "나의 첫인상은?",
          options: ["차분함", "친근함", "웃김", "시크함"],
        },
      ],
    };

    // Aggregate DB 모의 데이터: 차분함 10표, 친근함 30표, 웃김 50표, 시크함 10표 (총 100표)
    const aggregates = [
      { questionIndex: 0, optionIndex: 0, count: 10 },
      { questionIndex: 0, optionIndex: 1, count: 30 },
      { questionIndex: 0, optionIndex: 2, count: 50 },
      { questionIndex: 0, optionIndex: 3, count: 10 },
    ];

    const result = aggregateFirstImpression(config, [2], aggregates, 100);
    expect(result.totalResponses).toBe(100);
    expect(result.distributions[0].options[2].percentage).toBe(50);
    expect(result.distributions[0].options[1].percentage).toBe(30);
    expect(result.selectedOption).toBe("웃김");
  });

  // 4. Anonymous Feedback
  it("4. Anonymous Feedback: 글자수 제한 및 XSS 이스케이프 검증", () => {
    // 정상 입력
    const valid = processAnonymousFeedback("친구야 생일 축하해! 항상 고마워.");
    expect(valid.isValid).toBe(true);
    expect(valid.cleanText).toContain("친구야 생일 축하해");

    // XSS 시도 살균
    const xss = processAnonymousFeedback("<script>alert('hack')</script> & 'hello'");
    expect(xss.isValid).toBe(true);
    expect(xss.cleanText).not.toContain("<script>");
    expect(xss.cleanText).toContain("&lt;script&gt;");

    // 빈 문자열 에러
    const empty = processAnonymousFeedback("   ");
    expect(empty.isValid).toBe(false);

    // 500자 초과 에러
    const longText = "a".repeat(501);
    const tooLong = processAnonymousFeedback(longText, 500);
    expect(tooLong.isValid).toBe(false);
    expect(tooLong.error).toContain("500자");
  });

  // 5. Balance Game (Aggregate)
  it("5. Balance Game: A vs B 실시간 백분율 집계 검증", () => {
    const config: BalanceConfig = {
      type: "balance",
      questions: [
        { id: "b1", question: "전애인 친구 vs 전애인 사진", optionA: "친구", optionB: "사진" },
      ],
    };

    // A: 40표, B: 60표 (총 100표)
    const aggregates = [
      { questionIndex: 0, optionIndex: 0, count: 40 },
      { questionIndex: 0, optionIndex: 1, count: 60 },
    ];

    const result = aggregateBalanceGame(config, [1], aggregates, 100);
    expect(result.totalPlayers).toBe(100);
    expect(result.questionsStats[0].optionAPercentage).toBe(40);
    expect(result.questionsStats[0].optionBPercentage).toBe(60);
    expect(result.questionsStats[0].userChoiceIndex).toBe(1);
  });

  // 6. Security Question Extraction
  it("6. extractPublicQuestions: 플레이어용 공개 질문에서 정답 정보 제거 확인", () => {
    const definition: PackDefinition = {
      version: 1,
      type: "friend_quiz",
      title: "보안 테스트 퀴즈",
      submissionPolicy: { maxSubmissionsPerSession: 1, allowMultiple: false },
      config: {
        type: "friend_quiz",
        questions: [
          { id: "q1", question: "비밀 문제", options: ["정답", "오답"], answerIndex: 0 },
        ],
        resultRules: [],
      },
    };

    const publicQuestions = extractPublicQuestions(definition);
    expect(publicQuestions.length).toBe(1);
    expect((publicQuestions[0] as any).answerIndex).toBeUndefined();
    expect((publicQuestions[0] as any).creatorChoiceIndex).toBeUndefined();
  });
});
