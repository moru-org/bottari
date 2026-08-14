"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, User, PackageOpen } from "lucide-react";
import { getOwnerTokens } from "@/lib/storage";

export default function Header() {
  const [hasTokens, setHasTokens] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 로컬 저장소 토큰 체크
    const tokens = getOwnerTokens();
    setHasTokens(tokens.length > 0);

    // 세션 체크
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full px-5 py-3.5 bg-[#14151f]/90 backdrop-blur-md border-b border-[#232435] flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 group touch-active">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FFA834] flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
          <PackageOpen className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-white">
          보따리
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/my"
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all touch-active ${
            isLoggedIn || hasTokens
              ? "bg-[#25273c] hover:bg-[#2e314a] text-[#FFA834] border border-[#FFA834]/30"
              : "bg-[#1c1d2d] hover:bg-[#25273c] text-gray-400"
          }`}
        >
          {isLoggedIn ? (
            <>
              <User className="w-3.5 h-3.5" />
              <span>내 보따리</span>
            </>
          ) : hasTokens ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#FFA834] animate-pulse" />
              <span>반응 보기</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5" />
              <span>내 보따리</span>
            </>
          )}
        </Link>
      </div>
    </header>
  );
}
