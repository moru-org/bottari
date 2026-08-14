import { db } from "./db";
import { BottariEventType, BottariStats } from "./types";
import { PackConfig, PackType, AnonymousFeedbackItem } from "./pack-types";

export async function logEvent(
  bottariId: string,
  eventType: BottariEventType | string,
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

export interface DetailedBottariAnalytics extends BottariStats {
  type: PackType;
  anonymousMessages?: AnonymousFeedbackItem[];
  distributions?: any[];
  questionsStats?: any[];
}

export async function getBottariAnalytics(
  bottariId: string,
  includePrivateData = false
): Promise<DetailedBottariAnalytics | null> {
  const bottari = await db.bottari.findUnique({
    where: { id: bottariId },
    include: {
      responses: {
        orderBy: { createdAt: "desc" },
      },
      events: true,
    },
  });

  if (!bottari) return null;

  const views = bottari.events.filter(
    (e) => e.eventType === "content_viewed" || e.eventType === "bottari_opened"
  ).length;
  const starts = bottari.events.filter((e) => e.eventType === "play_started").length;
  const completes = bottari.responses.length;
  const shares = bottari.events.filter(
    (e) => e.eventType === "share_clicked" || e.eventType === "link_copied"
  ).length;

  const createAfterPlayCount = bottari.events.filter(
    (e) => e.eventType === "create_from_result_clicked"
  ).length;

  const completionRate = starts > 0 ? Math.round((completes / starts) * 100) : completes > 0 ? 100 : 0;
  const viralConversionRate = completes > 0 ? Math.round((createAfterPlayCount / completes) * 100) : 0;

  // 이모지 반응 집계
  const reactions: Record<string, number> = {};
  bottari.events
    .filter((e) => e.eventType === "reaction_created" && e.metadata)
    .forEach((e) => {
      try {
        const meta = JSON.parse(e.metadata!) as { reaction?: string };
        if (meta.reaction) {
          reactions[meta.reaction] = (reactions[meta.reaction] || 0) + 1;
        }
      } catch {
        // ignore
      }
    });

  let totalScore = 0;
  let totalMaxScore = 0;
  let perfectScoreCount = 0;

  bottari.responses.forEach((res) => {
    const s = res.score ?? 0;
    const t = res.totalQuestions ?? 0;
    totalScore += s;
    totalMaxScore += t;
    if (t > 0 && s === t) {
      perfectScoreCount++;
    }
  });

  const avgScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  // 가장 많이 틀린 문제 분석 (Friend Quiz용)
  let mostFailedQuestion: { question: string; failRate: number; failedCount: number } | null = null;
  let anonymousMessages: AnonymousFeedbackItem[] | undefined = undefined;

  const packType = (bottari.type as PackType) || "friend_quiz";

  try {
    const rawPayload = JSON.parse(bottari.payload);
    let questions: any[] = [];
    if (rawPayload.config?.questions) {
      questions = rawPayload.config.questions;
    } else if (rawPayload.questions) {
      questions = rawPayload.questions;
    }

    if (
      (packType === "friend_quiz" || (bottari.type as string) === "quiz_know_me") &&
      questions.length > 0 &&
      bottari.responses.length > 0
    ) {
      const questionStats = questions.map((q, qIndex) => {
        let failedCount = 0;
        bottari.responses.forEach((res) => {
          try {
            const userAnswers = JSON.parse(res.answersPayload) as number[];
            const ansIdx = q.answerIndex ?? 0;
            if (userAnswers[qIndex] !== ansIdx) {
              failedCount++;
            }
          } catch {
            // ignore
          }
        });
        const failRate = Math.round((failedCount / bottari.responses.length) * 100);
        return {
          question: q.question,
          failRate,
          failedCount,
        };
      });

      questionStats.sort((a, b) => b.failRate - a.failRate);
      if (questionStats[0] && questionStats[0].failedCount > 0) {
        mostFailedQuestion = questionStats[0];
      }
    }

    // 소유자 인증된 경우에만 익명 메시지 본문 포함 (IDOR 보안 방어)
    if (includePrivateData && packType === "anonymous_feedback") {
      anonymousMessages = bottari.responses.map((r) => {
        let msg = "";
        try {
          const parsed = JSON.parse(r.answersPayload);
          msg = parsed.message || "";
        } catch {
          msg = r.answersPayload;
        }
        return {
          id: r.id,
          message: msg,
          createdAt: r.createdAt.toISOString(),
          isHidden: r.isHidden,
        };
      });
    }
  } catch {
    // ignore
  }

  return {
    id: bottari.id,
    slug: bottari.slug,
    title: bottari.title,
    type: packType,
    createdAt: bottari.createdAt.toISOString(),
    views: Math.max(views, starts, completes),
    starts: Math.max(starts, completes),
    completes,
    completionRate,
    avgScore,
    shares,
    reactions,
    createAfterPlayCount,
    viralConversionRate,
    mostFailedQuestion,
    perfectScoreCount,
    anonymousMessages,
  };
}

export interface AdminMetrics {
  totalBottariCount: number;
  todayCreatedCount: number;
  todayViewsCount: number;
  todayCompletesCount: number;
  totalResponsesCount: number;
  overallCompletionRate: number;
  overallViralConversionRate: number;
  recentBottaris: {
    id: string;
    slug: string;
    type: string;
    title: string;
    status: string;
    createdAt: string;
    ownerName: string;
    views: number;
    completes: number;
    shares: number;
    createAfterPlays: number;
  }[];
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const totalBottariCount = await db.bottari.count();
  const todayCreatedCount = await db.bottari.count({
    where: { createdAt: { gte: startOfToday } },
  });

  const totalResponsesCount = await db.response.count();
  const todayCompletesCount = await db.response.count({
    where: { createdAt: { gte: startOfToday } },
  });

  const todayViewsCount = await db.event.count({
    where: {
      eventType: { in: ["content_viewed", "bottari_opened"] },
      createdAt: { gte: startOfToday },
    },
  });

  const totalStarts = await db.event.count({
    where: { eventType: "play_started" },
  });

  const totalCreatesAfterPlay = await db.event.count({
    where: { eventType: "create_from_result_clicked" },
  });

  const overallCompletionRate =
    totalStarts > 0
      ? Math.round((totalResponsesCount / totalStarts) * 100)
      : totalResponsesCount > 0
      ? 100
      : 0;

  const overallViralConversionRate =
    totalResponsesCount > 0
      ? Math.round((totalCreatesAfterPlay / totalResponsesCount) * 100)
      : 0;

  const recentList = await db.bottari.findMany({
    take: 30,
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      responses: true,
      events: true,
    },
  });

  const recentBottaris = recentList.map((b) => {
    const views = b.events.filter(
      (e) => e.eventType === "content_viewed" || e.eventType === "bottari_opened"
    ).length;
    const completes = b.responses.length;
    const shares = b.events.filter(
      (e) => e.eventType === "share_clicked" || e.eventType === "link_copied"
    ).length;
    const createAfterPlays = b.events.filter(
      (e) => e.eventType === "create_from_result_clicked"
    ).length;

    return {
      id: b.id,
      slug: b.slug,
      type: b.type,
      title: b.title,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      ownerName: b.owner?.name || "익명 제작자",
      views: Math.max(views, completes),
      completes,
      shares,
      createAfterPlays,
    };
  });

  return {
    totalBottariCount,
    todayCreatedCount,
    todayViewsCount,
    todayCompletesCount,
    totalResponsesCount,
    overallCompletionRate,
    overallViralConversionRate,
    recentBottaris,
  };
}
