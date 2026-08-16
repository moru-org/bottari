import { db } from "./db";
import { BottariStats } from "./types";

export interface DetailedBottariAnalytics extends BottariStats {
  type: string;
  anonymousMessages?: {
    id: string;
    message: string;
    createdAt: string;
    isHidden?: boolean;
  }[];
}

export async function logEvent(
  packId: string,
  eventType: string,
  referralIdOrMetadata?: string | null | Record<string, unknown>,
  metadataObj?: Record<string, unknown>
) {
  try {
    let metadata = metadataObj;
    if (typeof referralIdOrMetadata === "object" && referralIdOrMetadata !== null) {
      metadata = referralIdOrMetadata;
    } else if (typeof referralIdOrMetadata === "string") {
      metadata = { ...metadataObj, referralId: referralIdOrMetadata };
    }

    return await db.event.create({
      data: {
        packId,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("Failed to log event:", err);
    return null;
  }
}

export async function getBottariAnalytics(
  packId: string,
  includePrivateData = false
): Promise<DetailedBottariAnalytics | null> {
  const pack = await db.pack.findUnique({
    where: { id: packId },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
        include: {
          answers: true,
        },
      },
      events: true,
    },
  });

  if (!pack) return null;

  const views = pack.events.filter(
    (e) => e.eventType === "content_viewed" || e.eventType === "bottari_opened"
  ).length;
  const starts = pack.events.filter((e) => e.eventType === "play_started").length;
  const completes = pack.submissions.length;
  const shares = pack.events.filter(
    (e) => e.eventType === "share_clicked" || e.eventType === "link_copied"
  ).length;

  const createAfterPlayCount = pack.events.filter(
    (e) => e.eventType === "create_from_result_clicked"
  ).length;

  const completionRate = starts > 0 ? Math.round((completes / starts) * 100) : completes > 0 ? 100 : 0;
  const viralConversionRate = completes > 0 ? Math.round((createAfterPlayCount / completes) * 100) : 0;

  // 이모지 반응 집계
  const reactions: Record<string, number> = {};
  pack.events
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

  let anonymousMessages = undefined;
  if (includePrivateData && pack.type === "anonymous_feedback") {
    anonymousMessages = pack.submissions.map((s) => {
      const textAns = s.answers.find((a) => a.value);
      return {
        id: s.id,
        message: textAns?.value || "(내용 없음)",
        createdAt: s.createdAt.toISOString(),
      };
    });
  }

  return {
    id: pack.id,
    slug: pack.slug,
    title: pack.title,
    type: pack.type,
    createdAt: pack.createdAt.toISOString(),
    views: Math.max(views, starts, completes),
    starts: Math.max(starts, completes),
    completes,
    completionRate,
    avgScore: 80,
    shares,
    reactions,
    createAfterPlayCount,
    viralConversionRate,
    perfectScoreCount: 0,
    anonymousMessages,
  };
}

export async function getPackStats(packId: string) {
  return await getBottariAnalytics(packId);
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

  const totalBottariCount = await db.pack.count();
  const todayCreatedCount = await db.pack.count({
    where: { createdAt: { gte: startOfToday } },
  });

  const totalResponsesCount = await db.submission.count();
  const todayCompletesCount = await db.submission.count({
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

  const recentList = await db.pack.findMany({
    take: 30,
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      submissions: true,
      events: true,
    },
  });

  const recentBottaris = recentList.map((b) => {
    const views = b.events.filter(
      (e) => e.eventType === "content_viewed" || e.eventType === "bottari_opened"
    ).length;
    const completes = b.submissions.length;
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
