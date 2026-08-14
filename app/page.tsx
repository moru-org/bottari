"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Zap, Heart, MessageSquare } from "lucide-react";
import { getOwnerTokens } from "@/lib/storage";

export default function HomePage() {
  const [createdCount, setCreatedCount] = useState(0);

  useEffect(() => {
    const tokens = getOwnerTokens();
    setCreatedCount(tokens.length);
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-between py-4 select-none">
      {/* 상단 Hero Section */}
      <div className="space-y-6 pt-2">
        {/* 상단 태그 */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF6B35] text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>30초 완성 초간단 놀이터</span>
        </div>

        {/* 메인 카피 */}
        <div className="space-y-2.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            친구들이 나를 <br />
            <span className="text-gradient-brand">얼마나 아는지</span> <br />
            확인해볼까?
          </h1>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed font-normal">
            나에 대한 질문 3~5개를 만들고, <br />
            카톡방이나 인스타 DM으로 링크를 쏴보세요!
          </p>
        </div>

        {/* 퀴즈 맛보기 프리뷰 카드 */}
        <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1 text-[#FFA834]">
              <Sparkles className="w-3.5 h-3.5" /> 퀴즈 미리보기
            </span>
            <span>Q. 내가 더 좋아하는 것은?</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#25273c] border border-orange-500/40 text-center font-bold text-sm text-white flex flex-col items-center gap-1">
              <span>🍗 치킨</span>
              <span className="text-[10px] text-orange-400 font-normal">내 정답 ✨</span>
            </div>
            <div className="p-3 rounded-xl bg-[#222334] border border-[#2f3148] text-center font-bold text-sm text-gray-400 flex flex-col items-center gap-1">
              <span>🍕 피자</span>
              <span className="text-[10px] text-gray-500 font-normal">선택지</span>
            </div>
          </div>
        </div>

        {/* 소셜 피드백 유도 안내 */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181926] border border-[#252738]">
            <Heart className="w-4 h-4 text-rose-400 shrink-0" />
            <span>로그인 없이 즉시 시작</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181926] border border-[#252738]">
            <MessageSquare className="w-4 h-4 text-[#FFA834] shrink-0" />
            <span>실시간 친구 반응 확인</span>
          </div>
        </div>
      </div>

      {/* 하단 액션 버튼 영역 */}
      <div className="pt-8 pb-4 space-y-3">
        {createdCount > 0 && (
          <Link
            href="/my"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#1e2032] hover:bg-[#25273c] text-orange-300 border border-orange-500/20 text-xs font-semibold transition-all touch-active"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>내가 만든 보따리 {createdCount}개의 반응 보기</span>
          </Link>
        )}

        <Link
          href="/create"
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-orange-500/25 hover:opacity-95 transition-all touch-active"
        >
          <span>보따리 만들기</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
