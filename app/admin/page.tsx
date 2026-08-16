"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  PackageOpen,
  Loader2,
  ArrowLeft,
  Users,
  TrendingUp,
} from "lucide-react";

type PackItem = {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  _count?: { submissions: number };
};

export default function AdminPage() {
  const [packs, setPacks] = useState<PackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/packs")
      .then((res) => res.json())
      .then((data) => {
        if (data.packs) setPacks(data.packs);
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

  return (
    <div className="flex-1 flex flex-col py-2 space-y-6 select-none animate-fade-in">
      <div className="flex items-center justify-between pb-2 border-b border-[#232435]">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1.5 -ml-1.5 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-extrabold text-white flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#FF6B35]" />
            <span>보따리 대시보드</span>
          </h1>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#25273c] text-emerald-400 border border-emerald-500/20">
          V1
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44]">
          <div className="text-xs text-gray-400 mb-1">총 보따리</div>
          <div className="text-2xl font-black text-white">{packs.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44]">
          <div className="text-xs text-gray-400 mb-1">총 응답 수</div>
          <div className="text-2xl font-black text-white">
            {packs.reduce((acc, p) => acc + (p._count?.submissions || 0), 0)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-extrabold text-gray-400">최근 생성된 보따리</h2>
        {packs.map((p) => (
          <div key={p.id} className="p-3 rounded-xl bg-[#1c1d2c] border border-[#2c2e44] flex justify-between items-center">
            <div>
              <div className="font-bold text-white text-sm">{p.title}</div>
              <div className="text-xs text-gray-500">{p.type} · {p._count?.submissions || 0} 응답</div>
            </div>
            <Link href={`/p/${p.slug}`} className="text-xs text-orange-400">
              보기
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
