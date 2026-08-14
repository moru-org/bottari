import {
  PackType,
  PackDefinition,
  FriendQuizConfig,
  GuessMeConfig,
  FirstImpressionConfig,
  AnonymousFeedbackConfig,
  BalanceConfig,
  FriendQuizResultPayload,
  GuessMeResultPayload,
  FirstImpressionResultPayload,
  AnonymousFeedbackResultPayload,
  BalanceGameResultPayload,
  PackResultPayload,
  PublicQuestion,
  ImpressionDistribution,
  BalanceQuestionStats,
  QuestionFeedbackItem,
} from "./pack-types";

// 기본 등급 규칙
const DEFAULT_QUIZ_GRADES = [
  { minPercentage: 100, maxPercentage: 100, title: "🏆 영혼의 도플갱어 (100%)", message: "나보다 나를 더 잘 아는 찐친! 소름 돋을 정도로 완벽해요." },
  { minPercentage: 80, maxPercentage: 99, title: "🥇 특급 베프 인정 (80~99%)", message: "거의 모든 걸 꿰뚫고 있네요! 평소에 나를 정말 눈여겨보는 친구." },
  { minPercentage: 60, maxPercentage: 79, title: "🥈 절친 진입 단계 (60~79%)", message: "꽤 많이 알고 있군요! 조금만 더 관심 가져주면 찐친 등극." },
  { minPercentage: 40, maxPercentage: 59, title: "🥉 평범한 지인 (40~59%)", message: "반타작 성공! 앞으로 우리 더 많이 알아가요." },
  { minPercentage: 0, maxPercentage: 39, title: "🕵️ 혹시 스파이? (0~39%)", message: "어색한 사이 인증?! 오늘부터 다시 친해져 봅시다." },
];

const DEFAULT_GUESS_GRADES = [
  { minPercentage: 100, maxPercentage: 100, title: "🎯 텔레파시 100%", message: "우린 생각하는 것마저 똑같아요! 소울메이트 확정." },
  { minPercentage: 80, maxPercentage: 99, title: "⚡ 환상의 케미 (80%)", message: "내 선택을 척척 맞히네요! 서로의 마음을 너무 잘 읽는 사이." },
  { minPercentage: 50, maxPercentage: 79, title: "🤝 잘 통하는 사이 (50~70%)", message: "취향과 선택이 제법 잘 맞아요. 훌륭한 케미!" },
  { minPercentage: 0, maxPercentage: 49, title: "🌪️ 완전 극과 극 (0~40%)", message: "반대라서 더 끌리는 법! 서로 다른 매력이 넘치는 사이." },
];

/**
 * 1. Friend Quiz 채점
 */
export function evaluateFriendQuiz(
  config: FriendQuizConfig,
  answers: number[]
): FriendQuizResultPayload {
  const questions = config.questions;
  let score = 0;
  const feedback: QuestionFeedbackItem[] = [];

  questions.forEach((q, idx) => {
    const userAnsIdx = answers[idx] ?? -1;
    const correctAnsIdx = q.answerIndex ?? 0;
    const isCorrect = userAnsIdx === correctAnsIdx;

    if (isCorrect) score++;

    feedback.push({
      id: q.id || `q_${idx}`,
      question: q.question,
      userAnswer: userAnsIdx >= 0 && userAnsIdx < q.options.length ? q.options[userAnsIdx] : "미응답",
      correctAnswer: correctAnsIdx >= 0 && correctAnsIdx < q.options.length ? q.options[correctAnsIdx] : "정답 없음",
      isCorrect,
    });
  });

  const total = Math.max(questions.length, 1);
  const percentage = Math.round((score / total) * 100);

  const grade =
    config.resultRules?.find(
      (r) => percentage >= r.minPercentage && percentage <= r.maxPercentage
    ) ||
    DEFAULT_QUIZ_GRADES.find(
      (g) => percentage >= g.minPercentage && percentage <= g.maxPercentage
    ) ||
    DEFAULT_QUIZ_GRADES[DEFAULT_QUIZ_GRADES.length - 1];

  return {
    type: "friend_quiz",
    score,
    totalQuestions: total,
    percentage,
    gradeTitle: grade.title,
    gradeMessage: grade.message,
    questionsFeedback: feedback,
  };
}

/**
 * 2. Guess Me (내 선택 맞히기) 채점
 */
export function evaluateGuessMe(
  config: GuessMeConfig,
  answers: number[]
): GuessMeResultPayload {
  const questions = config.questions;
  let matchCount = 0;
  const matchesFeedback: {
    id: string;
    question: string;
    creatorChoice: string;
    userChoice: string;
    isMatched: boolean;
  }[] = [];

  questions.forEach((q, idx) => {
    const userChoiceIdx = answers[idx] ?? -1;
    const creatorChoiceIdx = q.creatorChoiceIndex ?? 0;
    const isMatched = userChoiceIdx === creatorChoiceIdx;

    if (isMatched) matchCount++;

    matchesFeedback.push({
      id: q.id || `q_${idx}`,
      question: q.question,
      creatorChoice: creatorChoiceIdx >= 0 && creatorChoiceIdx < q.options.length ? q.options[creatorChoiceIdx] : "선택 없음",
      userChoice: userChoiceIdx >= 0 && userChoiceIdx < q.options.length ? q.options[userChoiceIdx] : "미선택",
      isMatched,
    });
  });

  const total = Math.max(questions.length, 1);
  const matchPercentage = Math.round((matchCount / total) * 100);

  const grade =
    DEFAULT_GUESS_GRADES.find(
      (g) => matchPercentage >= g.minPercentage && matchPercentage <= g.maxPercentage
    ) || DEFAULT_GUESS_GRADES[DEFAULT_GUESS_GRADES.length - 1];

  return {
    type: "guess_me",
    matchCount,
    totalQuestions: total,
    matchPercentage,
    gradeTitle: grade.title,
    gradeMessage: grade.message,
    matchesFeedback,
  };
}

/**
 * 3. First Impression (첫인상 투표) 집계
 * AnswerAggregate DB 레코드를 기반으로 O(1) 계산
 */
export function aggregateFirstImpression(
  config: FirstImpressionConfig,
  currentAnswers: number[],
  aggregates: { questionIndex: number; optionIndex: number; count: number }[],
  totalResponsesCount: number
): FirstImpressionResultPayload {
  const questions = config.questions;

  // aggregate 맵 구축: questionIndex -> optionIndex -> count
  const aggMap: Record<number, Record<number, number>> = {};
  aggregates.forEach((a) => {
    if (!aggMap[a.questionIndex]) aggMap[a.questionIndex] = {};
    aggMap[a.questionIndex][a.optionIndex] = a.count;
  });

  const distributions: ImpressionDistribution[] = questions.map((q, qIdx) => {
    let questionTotal = 0;
    const optCounts = q.options.map((_, optIdx) => {
      const c = aggMap[qIdx]?.[optIdx] ?? 0;
      questionTotal += c;
      return c;
    });

    const options = q.options.map((optLabel, optIdx) => {
      const votes = optCounts[optIdx];
      const percentage = questionTotal > 0 ? Math.round((votes / questionTotal) * 100) : 0;
      return {
        label: optLabel,
        votes,
        percentage,
      };
    });

    return {
      questionId: q.id || `q_${qIdx}`,
      question: q.question,
      totalVotes: questionTotal,
      options,
    };
  });

  const selectedFirst =
    currentAnswers[0] !== undefined && questions[0]?.options[currentAnswers[0]]
      ? questions[0].options[currentAnswers[0]]
      : "선택 완료";

  return {
    type: "first_impression",
    selectedOption: selectedFirst,
    totalResponses: Math.max(totalResponsesCount, 1),
    distributions,
    message: `${Math.max(totalResponsesCount, 1)}명의 친구가 투표한 결과입니다.`,
  };
}

/**
 * 4. Anonymous Feedback (익명 한마디) 처리
 */
export function processAnonymousFeedback(
  rawText: string,
  maxLength = 500
): { cleanText: string; isValid: boolean; error?: string } {
  const text = (rawText || "").trim();

  if (!text || text.length === 0) {
    return { cleanText: "", isValid: false, error: "메시지를 입력해주세요." };
  }

  if (text.length > maxLength) {
    return { cleanText: "", isValid: false, error: `메시지는 최대 ${maxLength}자까지 작성할 수 있습니다.` };
  }

  // XSS 이스케이프
  const cleanText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return { cleanText, isValid: true };
}

/**
 * 5. Balance Game 집계
 * AnswerAggregate DB 레코드를 기반으로 O(1) 계산
 */
export function aggregateBalanceGame(
  config: BalanceConfig,
  currentAnswers: number[],
  aggregates: { questionIndex: number; optionIndex: number; count: number }[],
  totalPlayersCount: number
): BalanceGameResultPayload {
  const questions = config.questions;

  const aggMap: Record<number, Record<number, number>> = {};
  aggregates.forEach((a) => {
    if (!aggMap[a.questionIndex]) aggMap[a.questionIndex] = {};
    aggMap[a.questionIndex][a.optionIndex] = a.count;
  });

  const questionsStats: BalanceQuestionStats[] = questions.map((q, qIdx) => {
    const optAVotes = aggMap[qIdx]?.[0] ?? 0;
    const optBVotes = aggMap[qIdx]?.[1] ?? 0;
    const totalVotes = optAVotes + optBVotes;

    const optAPercentage = totalVotes > 0 ? Math.round((optAVotes / totalVotes) * 100) : 50;
    const optBPercentage = totalVotes > 0 ? 100 - optAPercentage : 50;

    return {
      questionId: q.id || `q_${qIdx}`,
      question: q.question,
      totalVotes,
      optionAVotes: optAVotes,
      optionAPercentage: optAPercentage,
      optionBVotes: optBVotes,
      optionBPercentage: optBPercentage,
      userChoiceIndex: currentAnswers[qIdx],
    };
  });

  return {
    type: "balance",
    totalPlayers: Math.max(totalPlayersCount, 1),
    questionsStats,
    message: `총 ${Math.max(totalPlayersCount, 1).toLocaleString()}명이 밸런스 게임에 참여했어요!`,
  };
}

/**
 * 클라이언트 공개용 질문 목록 추출 (정답/선택 정보 완전 제거)
 */
export function extractPublicQuestions(definition: PackDefinition): PublicQuestion[] {
  const { config } = definition;

  switch (config.type) {
    case "friend_quiz":
      return config.questions.map((q, idx) => ({
        id: q.id || `q_${idx}`,
        question: q.question,
        options: q.options,
      }));
    case "guess_me":
      return config.questions.map((q, idx) => ({
        id: q.id || `q_${idx}`,
        question: q.question,
        options: q.options,
      }));
    case "first_impression":
      return config.questions.map((q, idx) => ({
        id: q.id || `q_${idx}`,
        question: q.question,
        options: q.options,
      }));
    case "anonymous_feedback":
      return [
        {
          id: config.question.id || "a1",
          question: config.question.prompt,
          options: [],
          placeholder: config.question.placeholder,
          maxLength: config.question.maxLength || 500,
        },
      ];
    case "balance":
      return config.questions.map((q, idx) => ({
        id: q.id || `q_${idx}`,
        question: q.question,
        options: [q.optionA, q.optionB],
      }));
    default:
      return [];
  }
}

/**
 * 범용 팩 결과 계산 라우터
 */
export function evaluatePack(
  definition: PackDefinition,
  answersPayload: any,
  aggregates: { questionIndex: number; optionIndex: number; count: number }[] = [],
  totalResponsesCount = 1
): PackResultPayload {
  const { config } = definition;

  switch (config.type) {
    case "friend_quiz": {
      const answers = Array.isArray(answersPayload) ? answersPayload : [];
      return evaluateFriendQuiz(config, answers);
    }
    case "guess_me": {
      const answers = Array.isArray(answersPayload) ? answersPayload : [];
      return evaluateGuessMe(config, answers);
    }
    case "first_impression": {
      const answers = Array.isArray(answersPayload) ? answersPayload : [];
      return aggregateFirstImpression(config, answers, aggregates, totalResponsesCount);
    }
    case "anonymous_feedback": {
      return {
        type: "anonymous_feedback",
        submitted: true,
        message: "익명 메시지가 친구의 보따리에 안전하게 담겼어요! 💌",
      };
    }
    case "balance": {
      const answers = Array.isArray(answersPayload) ? answersPayload : [];
      return aggregateBalanceGame(config, answers, aggregates, totalResponsesCount);
    }
  }
}
