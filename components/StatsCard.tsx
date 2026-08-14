"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Users, CheckCircle2, TrendingUp, Share2, Award, AlertCircle } from "lucide-react";
import { BottariStats } from "@/lib/types";
import ShareModal from "@/components/ShareModal";

interface StatsCardProps {
  stats: BottariStats;
}

export default function StatsCard({ stats }: StatsCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <div className="p-5 rounded-3xl bg-[#1c1d2c] border border-[#2c2e44] shadow-xl space-y-4">
      {/* 카드 상단 */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <Link
            href={`/my/${stats.slug}`}
            className="font-extrabold text-base text-white hover:text-[#FFA834] transition-colors line-clamp-1"
          >
            {stats.title}
          </Link>
          <span className="text-[11px] text-gray-400 font-mono">
            {new Date(stats.createdAt).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="p-2 rounded-xl bg-[#25273c] hover:bg-[#2e314a] text-[#FFA834] border border-[#343752] transition-colors touch-active shrink-0"
          title="친구에게 공유하기"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 핵심 지표 4분할 그리드 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-2xl bg-[#14151f] border border-[#252738] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>조회수</span>
          </div>
          <div className="text-lg font-black text-white">{stats.views.toLocaleString()}회</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#14151f] border border-[#252738] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>참여 / 완료</span>
          </div>
          <div className="text-lg font-black text-white">
            {stats.completes}명
            <span className="text-xs font-normal text-emerald-400 ml-1">
              ({stats.completionRate}%)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#14151f] border border-[#252738] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <TrendingUp className="w-3.5 h-3.5 text-[#FFA834]" />
            <span>평균 일치도</span>
          </div>
          <div className="text-lg font-black text-[#FFA834]">{stats.avgScore}%</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#14151f] border border-[#252738] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>100점 친구</span>
          </div>
          <div className="text-lg font-black text-purple-300">{stats.perfectScoreCount}명</div>
        </div>
      </div>

      {/* Fun Monitoring: 가장 많이 틀린 문제 하이라이트 */}
      {stats.mostFailedQuestion && (
        <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs space-y-1">
          <div className="flex items-center gap-1 font-bold text-[#FFA834]">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>가장 많이 틀린 문제 (오답률 {stats.mostFailedQuestion.failRate}%)</span>
          </div>
          <p className="text-gray-300 font-medium line-clamp-1">
            &quot;{stats.mostFailedQuestion.question}&quot;
          </p>
        </div>
      )}

      {/* 상세 반응 링크 */}
      <div className="pt-1 flex items-center justify-between text-xs">
        <Link
          href={`/p/${stats.slug}`}
          className="text-gray-400 hover:text-white transition-colors"
        >
          직접 풀어보기 →
        </Link>
        <Link
          href={`/my/${stats.slug}`}
          className="font-bold text-[#FF6B35] hover:text-[#FFA834] transition-colors"
        >
          상세 반응 보기 →
        </Link>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={stats.title}
        slug={stats.slug}
      />
    </div>
  );
}
