import { QuestionFeedback, QuizQuestion, QuizResult } from "./types";

export function evaluateQuiz(
  questions: QuizQuestion[],
  userAnswers: number[]
): QuizResult {
  const totalQuestions = questions.length;
  let correctCount = 0;

  const questionsFeedback: QuestionFeedback[] = questions.map((q, idx) => {
    const userAnswerIndex = userAnswers[idx];
    const isCorrect = userAnswerIndex === q.answerIndex;
    if (isCorrect) correctCount++;

    return {
      id: q.id,
      question: q.question,
      userAnswer: q.options[userAnswerIndex] ?? "미응답",
      correctAnswer: q.options[q.answerIndex] ?? "",
      isCorrect,
    };
  });

  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  let gradeTitle = "";
  let gradeMessage = "";

  if (percentage === 100) {
    gradeTitle = "💯 영혼의 도플갱어";
    gradeMessage = "혹시 내 뇌 속에 들어갔다 나왔어? 넌 내 찐친 1호야!";
  } else if (percentage >= 80) {
    gradeTitle = "✨ 특급 베프 인정";
    gradeMessage = "나에 대해 꽤나 진심이구나! 사소한 취향까지 꿰뚫고 있네.";
  } else if (percentage >= 60) {
    gradeTitle = "🤝 든든한 친구";
    gradeMessage = "이 정도면 관심 많은 편! 조금만 더 관찰하면 100점 가능.";
  } else if (percentage >= 40) {
    gradeTitle = "🌱 친해지는 중";
    gradeMessage = "우리... 알고 지낸 지 얼마 안 됐지? 밥 한 끼 더 먹자!";
  } else {
    gradeTitle = "🕵️ 혹시 스파이?";
    gradeMessage = "우린 내일부터 처음 만난 사이로 하자... 섭섭할 뻔했어!";
  }

  return {
    score: correctCount,
    totalQuestions,
    percentage,
    gradeTitle,
    gradeMessage,
    questionsFeedback,
  };
}
