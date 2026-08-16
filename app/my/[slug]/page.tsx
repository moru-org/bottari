"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Loader2, Play } from "lucide-react";
import { getOwnerTokens } from "@/lib/storage";

export default function MyPackPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [pack, setPack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ownerToken, setOwnerToken] = useState<string | null>(null);

  useEffect(() => {
    const tokens = getOwnerTokens();
    const matched = tokens.find((t: any) => t.slug === slug);
    if (matched) setOwnerToken(matched.token);

    fetch(`/api/my/bottaris/${slug}/status`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setPack(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(`https://bottari.moru.my/p/${slug}`);
    alert("링크가 복사되었습니다!");
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <Link href="/my" className="text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">내 보따리 관리</h1>
      </div>

      {pack && (
        <>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{pack.title || "내 보따리"}</h2>
                <p className="text-sm text-slate-500">{pack.slug}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${pack.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {pack.status === 'active' ? '진행 중' : '마감됨'}
              </span>
            </div>

            <div className="space-y-2">
              <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800">
                <Share2 className="w-4 h-4" />
                공유 링크 복사
              </button>
              <button onClick={() => router.push(`/p/${slug}`)} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-50">
                <Play className="w-4 h-4" />
                결과 보기
              </button>
            </div>
          </div>

          {ownerToken && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 break-all">
              <strong>관리자 토큰:</strong> {ownerToken}
            </div>
          )}
        </>
      )}
    </div>
  );
}
