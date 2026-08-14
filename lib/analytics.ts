import { db } from "./db";
import { BottariStats, QuizPayload } from "./types";

export async function logEvent(
  bottariId: string,
  eventType: "content_viewed" | "play_started" | "play_completed" | "result_viewed" | "share_clicked",
  referralId?: string | null,
  metadata?: Record<string, unknown>
) {
  try {
    return await db.event.create({
      data: {
        bottariId,
        eventType,
        referralId: referralId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("Failed to log event:", err);
    return null;
  }
}

export async function getBottariAnalytics(bottariId: string): Promise<BottariStats | null> {
  const bottari = await db.bottari.findUnique({
    where: { id: bottariId },
    include: {
      responses: true,
      events: true,
    },
  });

  if (!bottari) return null;

  const views = bottari.events.filter((e) => e.eventType === "content_viewed").length;
  const starts = bottari.events.filter((e) => e.eventType === "play_started").length;
  const completes = bottari.responses.length;
  const shares = bottari.events.filter((e) => e.eventType === "share_clicked").length;

  const completionRate = starts > 0 ? Math.round((completes / starts) * 100) : completes > 0 ? 100 : 0;

  let totalScore = 0;
  let totalMaxScore = 0;
  let perfectScoreCount = 0;

  bottari.responses.forEach((res) => {
    totalScore += res.score;
    totalMaxScore += res.totalQuestions;
    if (res.score === res.totalQuestions && res.totalQuestions > 0) {
      perfectScoreCount++;
    }
  });

  const avgScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  // 가장 많이 틀린 문제 분석
  let mostFailedQuestion: { question: string; failRate: number; failedCount: number } | null = null;

  try {
    const payload = JSON.parse(bottari.payload) as QuizPayload;
    const questions = payload.questions || [];

    if (questions.length > 0 && bottari.responses.length > 0) {
      const questionStats = questions.map((q, qIndex) => {
        let failedCount = 0;
        bottari.responses.forEach((res) => {
          try {
            const userAnswers = JSON.parse(res.answersPayload) as number[];
            if (userAnswers[qIndex] !== q.answerIndex) {
              failedCount++;
            }
          } catch {
            // ignore JSON parse error for malformed response
          }
        });
        const failRate = Math.round((failedCount / bottari.responses.length) * 100);
        return {
          question: q.question,
          failRate,
          failedCount,
        };
      });

      // 오답률 내림차순 정렬
      questionStats.sort((a, b) => b.failRate - a.failRate);
      if (questionStats[0] && questionStats[0].failedCount > 0) {
        mostFailedQuestion = questionStats[0];
      }
    }
  } catch {
    // ignore
  }

  return {
    id: bottari.id,
    slug: bottari.slug,
    title: bottari.title,
    createdAt: bottari.createdAt.toISOString(),
    views: Math.max(views, starts, completes), // 최소 플레이 수 이상 보장
    starts: Math.max(starts, completes),
    completes,
    completionRate,
    avgScore,
    shares,
    mostFailedQuestion,
    perfectScoreCount,
  };
}
