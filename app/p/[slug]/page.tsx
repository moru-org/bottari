import Link from "next/link";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { PackDefinition, PackPlayData, PackType } from "@/lib/pack-types";
import { extractPublicQuestions } from "@/lib/pack-engine";
import GenericPackPlayer from "@/components/pack-player/GenericPackPlayer";
import { PackageOpen } from "lucide-react";

interface PlayPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PlayPageProps): Promise<Metadata> {
  const { slug } = await params;
  const bottari = await db.bottari.findUnique({
    where: { slug },
  });

  if (!bottari) {
    return {
      title: "보따리를 찾을 수 없습니다 — 보따리",
      description: "삭제되었거나 존재하지 않는 보따리 링크입니다.",
    };
  }

  let count = 3;
  let emoji = "🎁";
  try {
    const def = JSON.parse(bottari.payload) as PackDefinition;
    emoji = def.emoji || "🎁";
    if (def.config.type === "anonymous_feedback") {
      count = 1;
    } else if (def.config.questions) {
      count = def.config.questions.length;
    }
  } catch {
    // ignore
  }

  const metaTitle = `${emoji} ${bottari.title} — 30초 보따리`;
  const metaDescription = `${count}문항 놀이 보따리! 로그인 없이 30초 만에 풀고 결과를 확인해보세요.`;

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "website",
      siteName: "보따리 (BOTTARI)",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
    },
  };
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { slug } = await params;

  const bottari = await db.bottari.findUnique({
    where: { slug },
  });

  if (!bottari) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
          <PackageOpen className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">존재하지 않는 보따리입니다</h2>
          <p className="text-sm text-gray-400">
            삭제되었거나 링크 주소가 올바르지 않습니다.
          </p>
        </div>
        <Link
          href="/"
          className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors"
        >
          홈으로 가기
        </Link>
      </div>
    );
  }

  let definition: PackDefinition;
  try {
    definition = JSON.parse(bottari.payload);
  } catch {
    definition = {
      version: 1,
      type: bottari.type as any,
      title: bottari.title,
      description: bottari.description || undefined,
      emoji: "🎁",
      config: { type: bottari.type as any, questions: [] } as any,
      submissionPolicy: { maxSubmissionsPerSession: 1, allowMultiple: false },
    };
  }

  const publicQuestions = extractPublicQuestions(definition);

  const playData: PackPlayData = {
    id: bottari.id,
    slug: bottari.slug,
    type: (bottari.type as PackType) || "friend_quiz",
    title: bottari.title,
    description: bottari.description,
    emoji: definition.emoji || "🎁",
    creatorName: definition.config.creatorName,
    status: (bottari.status as "active" | "disabled") || "active",
    questions: publicQuestions,
    submissionPolicy: definition.submissionPolicy || {
      maxSubmissionsPerSession: 1,
      allowMultiple: false,
    },
    createdAt: bottari.createdAt.toISOString(),
  };

  return <GenericPackPlayer bottari={playData} />;
}
