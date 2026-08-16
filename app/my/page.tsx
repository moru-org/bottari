"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Sparkles, PackageOpen, Loader2, ShieldCheck } from "lucide-react";
import { getOwnerTokens, removeOwnerTokens } from "@/lib/storage";

export default function MyPage() {
  const [myPacks, setMyPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = getOwnerTokens();
    if (tokens.length === 0) {
      setLoading(false);
      return;
    }

    fetch("/api/my/bottaris", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.bottaris) {
          setMyPacks(data.bottaris);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-3 select-none">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
        <span className="text-xs text-gray-400 font-medium">내 보따리 목록을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-2 space-y-6 select-none animate-fade-in">
      <div className="flex items-center justify-between pb-2 border-b border-[#232435]">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#FF6B35]" />
          <span>내 보따리</span>
        </h1>
      </div>

      {myPacks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-4">
          <PackageOpen className="w-12 h-12 text-gray-600" />
          <p className="text-sm text-gray-400">만든 보따리가 없습니다.</p>
          <Link
            href="/create"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-bold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            보따리 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {myPacks.map((pack: any) => (
            <Link
              key={pack.id}
              href={`/my/${pack.slug}`}
              className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] hover:border-[#FF6B35]/40 transition-all block"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">{pack.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {pack.slug} · {new Date(pack.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Sparkles className="w-4 h-4 text-[#FFA834]" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/create"
        className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-base shadow-xl shadow-orange-500/25"
      >
        <Plus className="w-5 h-5" />
        <span>새 보따리 만들기</span>
      </Link>
    </div>
  );
}
