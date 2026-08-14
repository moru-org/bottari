"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, LogOut, PackageOpen, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { UserSession } from "@/lib/types";
import { DetailedBottariAnalytics } from "@/lib/analytics";
import { getOwnerTokens, removeOwnerTokens } from "@/lib/storage";
import StatsCard from "@/components/StatsCard";

export default function MyBottariPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [bottaris, setBottaris] = useState<DetailedBottariAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);

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
        setIsAnonymousMode(false);

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
            // ignore
          }
        }

        // 3. 로그인된 내 보따리 목록 조회
        const myRes = await fetch("/api/my/bottaris");
        const myData = await myRes.json();
        if (myRes.ok && myData.success) {
          setBottaris(myData.bottaris || []);
        }
      } else {
        // 비로그인 상태: 로컬 토큰으로 보따리 목록 조회
        setIsAnonymousMode(true);
        const localTokens = getOwnerTokens();
        if (localTokens.length > 0) {
          const res = await fetch("/api/my/bottaris", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tokens: localTokens }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setBottaris(data.bottaris || []);
          }
        } else {
          setBottaris([]);
        }
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
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-3 select-none">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
        <span className="text-xs text-gray-400 font-medium">내 보따리 불러오는 중...</span>
      </div>
    );
  }

  // 생성된 보따리가 하나도 없고 비로그인일 때
  if (!session && bottaris.length === 0) {
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
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
              아직 만든 보따리가 없습니다. <br />
              30초 만에 새 보따리를 만들어 친구들에게 보내보세요!
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-6 pb-2">
          <Link
            href="/create"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition-all touch-active"
          >
            <span>보따리 만들기</span>
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

  return (
    <div className="flex-1 flex flex-col py-2 space-y-5 select-none animate-fade-in">
      {/* 상단 프로필 및 헤더 */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232435]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#25273c] border border-orange-500/30 flex items-center justify-center text-sm font-bold text-[#FFA834]">
            {session ? session.name.substring(0, 1) : "🎁"}
          </div>
          <div>
            <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <span>{session ? `${session.name}님의 보따리` : "내 보따리 반응"}</span>
            </div>
            <span className="text-[11px] text-gray-400">
              총 {bottaris.length}개 보따리 운영 중
            </span>
          </div>
        </div>

        {session ? (
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs flex items-center gap-1"
            title="로그아웃"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[11px]">로그아웃</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-full bg-orange-500/15 hover:bg-orange-500/25 text-[#FFA834] border border-orange-500/30 text-xs font-bold transition-colors"
          >
            로그인 / 저장
          </Link>
        )}
      </div>

      {/* 비로그인 안내 배너 (가치 발생 후 로그인 유도) */}
      {isAnonymousMode && (
        <div className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#FFA834] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>현재 기기에 임시 보관 중입니다</span>
            </span>
            <Link
              href="/login"
              className="text-[11px] font-bold text-orange-400 underline underline-offset-2"
            >
              계정에 영구 저장 →
            </Link>
          </div>
          <p className="text-[11px] text-gray-400">
            로그인하시면 브라우저 캐시가 삭제되거나 기기가 바뀌어도 보따리를 안전하게 보관할 수 있습니다.
          </p>
        </div>
      )}

      {/* 보따리 목록 */}
      <div className="space-y-4">
        {bottaris.map((item) => (
          <StatsCard key={item.id} stats={item} />
        ))}
      </div>

      {/* 하단 새 보따리 추가 생성 CTA */}
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
