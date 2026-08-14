"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Sparkles,
  ArrowLeft,
  Loader2,
  PackageOpen,
  Plus,
} from "lucide-react";
import { AdminMetrics } from "@/lib/analytics";

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.metrics) {
          setMetrics(data.metrics);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-3 select-none">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
        <span className="text-xs text-gray-400 font-medium">관리자 지표 불러오는 중...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4 text-center select-none">
        <p className="text-sm text-gray-300">지표를 불러올 수 없습니다.</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold"
        >
          홈으로 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-2 space-y-6 select-none animate-fade-in">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232435]">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1.5 -ml-1.5 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#FF6B35]" />
              <span>보따리 운영자 대시보드</span>
            </h1>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#25273c] text-emerald-400 border border-emerald-500/20">
          V1 Live
        </span>
      </div>

      {/* Overview 핵심 퍼널 지표 4분할 그리드 */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-extrabold text-gray-400 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-[#FFA834]" />
          <span>핵심 퍼널 & 바이럴 지표</span>
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>보따리 수</span>
              <PackageOpen className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-black text-white">
              {metrics.totalBottariCount}개
            </div>
            <p className="text-[11px] text-blue-400">
              오늘 +{metrics.todayCreatedCount}개 생성
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>오늘 방문</span>
              <Eye className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-white">
              {metrics.todayViewsCount}회
            </div>
            <p className="text-[11px] text-gray-400">
              오늘 완료 {metrics.todayCompletesCount}건
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>플레이 완료율</span>
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400">
              {metrics.overallCompletionRate}%
            </div>
            <p className="text-[11px] text-gray-400">
              총 {metrics.totalResponsesCount}명 풀이 완료
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs text-orange-400 font-bold">
              <span>바이럴 전환율</span>
              <Sparkles className="w-3.5 h-3.5 text-[#FFA834]" />
            </div>
            <div className="text-xl font-black text-[#FFA834]">
              {metrics.overallViralConversionRate}%
            </div>
            <p className="text-[11px] text-orange-300/80">
              결과 후 내 보따리 생성
            </p>
          </div>
        </div>
      </div>

      {/* 최근 생성된 보따리 목록 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-gray-300">
          <span>최근 생성된 보따리 ({metrics.recentBottaris.length}개)</span>
          <span className="text-[11px] font-normal text-gray-500">실시간 집계</span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {metrics.recentBottaris.map((b) => (
            <div
              key={b.id}
              className="p-3 rounded-2xl bg-[#181926] border border-[#26283b] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/p/${b.slug}`}
                  className="font-bold text-white hover:text-orange-400 transition-colors truncate max-w-[200px]"
                >
                  {b.title}
                </Link>
                <span className="text-[10px] font-mono text-gray-400">
                  {new Date(b.createdAt).toLocaleDateString("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
                <span className="truncate max-w-[100px] text-gray-300">
                  {b.ownerName} ({b.type})
                </span>
                <div className="flex items-center gap-3 font-mono">
                  <span>조회 {b.views}</span>
                  <span className="text-emerald-400 font-bold">완료 {b.completes}</span>
                  <span className="text-[#FFA834]">공유 {b.shares}</span>
                  <span className="text-orange-300">재생성 {b.createAfterPlays}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
