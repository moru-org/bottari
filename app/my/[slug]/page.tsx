"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Award, AlertTriangle, CheckCircle, Eye, Users, TrendingUp, Loader2 } from "lucide-react";
import { BottariStats } from "@/lib/types";
import ShareModal from "@/components/ShareModal";

interface DetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function BottariAnalyticsDetailPage({ params }: DetailPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [analytics, setAnalytics] = useState<BottariStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetch(`/api/my/${slug}/analytics`)
      .then((res) => {
        if (res.status === 401) {
          router.push(`/login?returnTo=/my/${slug}`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success) {
          setAnalytics(data.analytics);
        } else if (data && data.error) {
          setErrorMsg(data.error);
        }
      })
      .catch(() => setErrorMsg("통계를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
        <span className="text-xs text-gray-400 font-medium">상세 반응 불러오는 중...</span>
      </div>
    );
  }

  if (errorMsg || !analytics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <p className="text-sm text-gray-300">{errorMsg || "보따리를 찾을 수 없습니다."}</p>
        <Link
          href="/my"
          className="px-4 py-2 rounded-xl bg-[#25273c] text-white text-xs font-bold"
        >
          내 보따리로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-2 space-y-6 select-none animate-fade-in">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between">
        <Link
          href="/my"
          className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-xs font-bold text-gray-400">보따리 상세 반응</span>
        <button
          onClick={() => setShowShareModal(true)}
          className="p-2 -mr-2 rounded-xl text-[#FFA834] hover:bg-white/5 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* 보따리 헤더 정보 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-white">{analytics.title}</h1>
        <p className="text-xs text-gray-400">
          생성일: {new Date(analytics.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </div>

      {/* 핵심 지표 4분할 */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Eye className="w-4 h-4 text-blue-400" />
            <span>총 조회수</span>
          </div>
          <div className="text-2xl font-black text-white">{analytics.views}회</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>완료자 수</span>
          </div>
          <div className="text-2xl font-black text-white">
            {analytics.completes}명
            <span className="text-xs font-normal text-emerald-400 ml-1">
              ({analytics.completionRate}%)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <TrendingUp className="w-4 h-4 text-[#FFA834]" />
            <span>친구들 평균 점수</span>
          </div>
          <div className="text-2xl font-black text-[#FFA834]">{analytics.avgScore}점</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Award className="w-4 h-4 text-purple-400" />
            <span>100점 만점자</span>
          </div>
          <div className="text-2xl font-black text-purple-300">{analytics.perfectScoreCount}명</div>
        </div>
      </div>

      {/* Fun Monitoring 하이라이트 섹션 */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-[#25273c] to-[#1c1d2c] border border-[#343752] space-y-4">
        <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
          <Award className="w-4 h-4 text-[#FFA834]" />
          <span>반응 요약 리포트</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-[#14151f] border border-white/5 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-200">총 {analytics.completes}명이 보따리를 풀었어요!</span>
              <p className="text-gray-400 text-[11px]">
                {analytics.completes > 0
                  ? `친구들의 평균 점수는 ${analytics.avgScore}점입니다.`
                  : "아직 풀이한 친구가 없습니다. 링크를 단톡방에 공유해보세요!"}
              </p>
            </div>
          </div>

          {analytics.mostFailedQuestion && (
            <div className="p-3 rounded-2xl bg-[#14151f] border border-white/5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-200">
                  가장 많이 틀린 문제 (오답률 {analytics.mostFailedQuestion.failRate}%)
                </span>
                <p className="text-gray-400 text-[11px]">
                  &quot;{analytics.mostFailedQuestion.question}&quot;에서 {analytics.mostFailedQuestion.failedCount}명이 낚였습니다!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 다시 공유하기 CTA */}
      <div className="pt-4 pb-2">
        <button
          onClick={() => setShowShareModal(true)}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition-all touch-active"
        >
          <Share2 className="w-4 h-4" />
          <span>친구들에게 다시 보따리 보내기</span>
        </button>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={analytics.title}
        slug={analytics.slug}
      />
    </div>
  );
}
