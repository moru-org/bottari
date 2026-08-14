"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Users, TrendingUp, Share2, Award, AlertCircle, Heart } from "lucide-react";
import { DetailedBottariAnalytics } from "@/lib/analytics";
import ShareModal from "@/components/ShareModal";

interface StatsCardProps {
  stats: DetailedBottariAnalytics;
}

export default function StatsCard({ stats }: StatsCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  const reactionEntries = stats.reactions ? Object.entries(stats.reactions) : [];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "friend_quiz":
        return <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-[#FF6B35] text-[10px] font-bold">친구퀴즈</span>;
      case "guess_me":
        return <span className="px-2 py-0.5 rounded-md bg-yellow-500/15 text-yellow-400 text-[10px] font-bold">맞혀봐</span>;
      case "first_impression":
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">첫인상</span>;
      case "anonymous_feedback":
        return <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 text-[10px] font-bold">익명한마디</span>;
      case "balance":
        return <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-[10px] font-bold">밸런스</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-[#1c1d2c] border border-[#2c2e44] shadow-xl space-y-4 animate-fade-in">
      {/* 카드 상단 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 max-w-[80%]">
          <div className="flex items-center gap-1.5">
            {getTypeBadge(stats.type)}
            <Link
              href={`/my/${stats.slug}`}
              className="font-extrabold text-base text-white hover:text-[#FFA834] transition-colors line-clamp-1"
            >
              {stats.title}
            </Link>
          </div>
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
          title="친구에게 다시 보내기"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 핵심 4분할 지표 그리드 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-2xl bg-[#14151f] border border-[#252738] space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>조회수</span>
          </div>
          <div className="text-lg font-black text-white">{stats.views.toLocaleString()}회</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#14151f] border border-[#252738] space-y-0.5">
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

        <div className="p-3 rounded-2xl bg-[#14151f] border border-[#252738] space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <TrendingUp className="w-3.5 h-3.5 text-[#FFA834]" />
            <span>평균 일치도</span>
          </div>
          <div className="text-lg font-black text-[#FFA834]">{stats.avgScore}%</div>
        </div>

        <div className="p-3 rounded-2xl bg-[#14151f] border border-[#252738] space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>100점 만점</span>
          </div>
          <div className="text-lg font-black text-purple-300">{stats.perfectScoreCount}명</div>
        </div>
      </div>

      {/* 친구들의 실시간 이모지 반응 목록 */}
      {reactionEntries.length > 0 && (
        <div className="p-3 rounded-2xl bg-[#14151f] border border-[#252738] space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
            <Heart className="w-3 h-3 text-rose-400 fill-current" />
            <span>친구들의 반응</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {reactionEntries.map(([label, count]) => (
              <span
                key={label}
                className="px-2.5 py-1 rounded-xl bg-[#1c1d2c] border border-[#2c2e44] text-xs font-bold text-gray-200 flex items-center gap-1"
              >
                <span>{label}</span>
                <span className="text-orange-400 font-mono">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 가장 많이 틀린 문제 하이라이트 */}
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
          className="font-bold text-[#FF6B35] hover:text-[#FFA834] transition-colors flex items-center gap-1"
        >
          <span>상세 반응 및 관리</span>
          <span>→</span>
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
