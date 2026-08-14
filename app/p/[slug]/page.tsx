import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { BottariPlayData, PlayQuestion, QuizPayload } from "@/lib/types";
import QuizPlayer from "@/components/QuizPlayer";
import { PackageOpen } from "lucide-react";

interface PlayPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PlayPageProps) {
  const { slug } = await params;
  const bottari = await db.bottari.findUnique({
    where: { slug },
  });

  if (!bottari) {
    return { title: "보따리를 찾을 수 없습니다" };
  }

  return {
    title: `${bottari.title} — 보따리 풀어보기`,
    description: "친구가 보낸 취향 퀴즈를 풀고 결과를 확인해보세요!",
  };
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { slug } = await params;

  const bottari = await db.bottari.findUnique({
    where: { slug },
  });

  if (!bottari || bottari.status !== "active") {
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

  const payload = JSON.parse(bottari.payload) as QuizPayload;
  const sanitizedQuestions: PlayQuestion[] = (payload.questions || []).map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
  }));

  const playData: BottariPlayData = {
    id: bottari.id,
    slug: bottari.slug,
    title: bottari.title,
    type: bottari.type,
    questions: sanitizedQuestions,
    createdAt: bottari.createdAt.toISOString(),
  };

  return <QuizPlayer bottari={playData} />;
}
