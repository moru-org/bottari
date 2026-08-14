"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, LogOut, PackageOpen, Loader2, ArrowRight } from "lucide-react";
import { BottariStats, UserSession } from "@/lib/types";
import { getOwnerTokens, removeOwnerTokens } from "@/lib/storage";
import StatsCard from "@/components/StatsCard";

export default function MyBottariPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [bottaris, setBottaris] = useState<BottariStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [unclaimedCount, setUnclaimedCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. 세션 확인
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();

      if (sessionData.authenticated) {
        setSession(sessionData.user);

        // 2. 미귀속 로컬 토큰 자동 Claim 시도
        const localTokens = getOwnerTokens();
        if (localTokens.length > 0) {
          try {
            const claimRes = await fetch("/api/bottari/claim", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tokens: localTokens }),
            });
            const claimData = await claimRes.json();
            if (claimData.claimedSlugs && claimData.claimedSlugs.length > 0) {
              removeOwnerTokens(claimData.claimedSlugs);
            }
          } catch {
            // ignore claim error
          }
        }

        // 3. 내 보따리 목록 조회
        const myRes = await fetch("/api/my/bottaris");
        const myData = await myRes.json();
        if (myRes.ok && myData.success) {
          setBottaris(myData.bottaris || []);
        }
      } else {
        // 비로그인 상태일 때 로컬에 저장된 보따리 수 체크
        const localTokens = getOwnerTokens();
        setUnclaimedCount(localTokens.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession(null);
      setBottaris([]);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
        <span className="text-xs text-gray-400 font-medium">내 보따리 불러오는 중...</span>
      </div>
    );
  }

  // 1. 비로그인 상태 뷰
  if (!session) {
    return (
      <div className="flex-1 flex flex-col justify-between py-6 space-y-6 select-none animate-fade-in">
        <div className="space-y-6 pt-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-orange-500/15 text-[#FF6B35] flex items-center justify-center mx-auto shadow-lg shadow-orange-500/10">
            <PackageOpen className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">
              내 보따리 반응 보기
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {unclaimedCount > 0
                ? `이 기기에서 만든 보따리 ${unclaimedCount}개가 있습니다. 로그인하여 안전하게 저장하고 친구들의 반응을 확인하세요!`
                : "로그인하면 내가 만든 보따리의 조회수, 점수 통계, 오답률을 실시간으로 확인할 수 있습니다."}
            </p>
          </div>

          {unclaimedCount > 0 && (
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-left flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#FFA834] shrink-0 animate-pulse" />
              <div className="text-xs text-orange-200">
                <span className="font-bold">저장 대기 중인 보따리 {unclaimedCount}개</span>
                <p className="text-[11px] text-orange-300/80">
                  로그인 한 번으로 내 계정에 자동 귀속됩니다.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-6 pb-2">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition-all touch-active"
          >
            <span>로그인하고 반응 확인하기</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full flex items-center justify-center py-3 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 2. 로그인 완료 및 내 보따리 목록 뷰
  return (
    <div className="flex-1 flex flex-col py-2 space-y-6 select-none animate-fade-in">
      {/* 상단 프로필 및 헤더 */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232435]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#25273c] border border-orange-500/30 flex items-center justify-center text-sm font-bold text-[#FFA834]">
            {session.name.substring(0, 1)}
          </div>
          <div>
            <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <span>{session.name}님의 보따리</span>
            </div>
            <span className="text-[11px] text-gray-400">
              총 {bottaris.length}개 보따리 운영 중
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs flex items-center gap-1"
          title="로그아웃"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[11px]">로그아웃</span>
        </button>
      </div>

      {/* 보따리 목록 */}
      <div className="space-y-4">
        {bottaris.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#1c1d2c] border border-[#2c2e44] text-center space-y-4 py-12">
            <div className="w-12 h-12 rounded-2xl bg-[#25273c] text-gray-400 flex items-center justify-center mx-auto">
              <PackageOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">아직 만든 보따리가 없습니다</h3>
              <p className="text-xs text-gray-400">
                새 보따리를 만들어 친구들에게 링크를 보내보세요!
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-md shadow-orange-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>첫 보따리 만들기</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bottaris.map((item) => (
              <StatsCard key={item.id} stats={item} />
            ))}
          </div>
        )}
      </div>

      {/* 하단 보따리 추가 생성 CTA */}
      <div className="sticky bottom-4 pt-2">
        <Link
          href="/create"
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 hover:opacity-95 transition-all touch-active"
        >
          <Plus className="w-4 h-4" />
          <span>새 보따리 만들기</span>
        </Link>
      </div>
    </div>
  );
}
