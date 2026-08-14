"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Loader2, MessageCircle } from "lucide-react";
import { getOwnerTokens, removeOwnerTokens } from "@/lib/storage";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/my";

  const [name, setName] = useState("즐거운 보따리");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (provider: "mock" | "kakao" | "google") => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 로그인 요청
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          name: name.trim() || "보따리 친구",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "로그인에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      // 익명 생성된 보따리가 로컬에 있다면 일괄 Claim 수행
      const localTokens = getOwnerTokens();
      if (localTokens.length > 0) {
        const claimRes = await fetch("/api/bottari/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokens: localTokens }),
        });
        const claimData = await claimRes.json();
        if (claimData.claimedSlugs && claimData.claimedSlugs.length > 0) {
          removeOwnerTokens(claimData.claimedSlugs);
        }
      }

      router.push(returnTo);
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMsg("로그인 처리 중 네트워크 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-4 space-y-6 select-none animate-fade-in">
      <div className="space-y-6 pt-4">
        {/* 상단 뱃지 */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF6B35] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>내 보따리 보관함 & 반응 보기</span>
        </div>

        {/* 메인 카피 */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
            친구들이 얼마나 풀었는지 <br />
            <span className="text-gradient-brand">실시간으로 확인하기</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal">
            로그인하시면 지금까지 만든 보따리의 <br />
            조회수, 완료율, 친구들의 오답률을 모아볼 수 있습니다.
          </p>
        </div>

        {/* 닉네임 입력 (간편 로그인용) */}
        <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-3">
          <label className="text-xs font-bold text-gray-300">내 닉네임</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="표시될 닉네임을 입력하세요"
            maxLength={15}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#14151f] border border-[#2a2c40] text-white text-sm focus:outline-none focus:border-[#FF6B35]"
          />
        </div>

        {/* 소셜 & 간편 로그인 버튼들 */}
        <div className="space-y-2.5">
          {/* 카카오 로그인 버튼 (OAuth 연동 규격) */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleLogin("kakao")}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-[#FEE500] hover:bg-[#ebd300] text-[#191919] font-extrabold text-sm shadow-md transition-all touch-active disabled:opacity-50"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>카카오로 1초 만에 시작하기</span>
          </button>

          {/* 구글 로그인 버튼 */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleLogin("google")}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-[#25273c] hover:bg-[#2e314a] text-white font-bold text-sm border border-[#343752] shadow-md transition-all touch-active disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-[#FFA834]" />
            <span>Google 계정으로 시작하기</span>
          </button>

          {/* 원클릭 빠른 시작 버튼 */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleLogin("mock")}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#181926] hover:bg-[#202234] text-gray-300 font-semibold text-xs border border-[#26283b] transition-all touch-active disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#FF6B35]" />
            ) : (
              <span>체험 계정으로 즉시 로그인</span>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
            {errorMsg}
          </div>
        )}
      </div>

      {/* 하단 보안 및 개인정보 최소 수집 안내 */}
      <div className="pt-6 pb-2 text-center space-y-1">
        <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>보따리는 불필요한 개인정보나 연락처를 수집하지 않습니다.</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">불러오는 중...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
