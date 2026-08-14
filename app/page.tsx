"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  User,
  Play,
  Flame,
  Shuffle,
  Loader2,
} from "lucide-react";
import { getOwnerTokens } from "@/lib/storage";
import { TEMPLATE_CATEGORIES } from "@/data/pack-templates";
import { CategoryType, PackTemplateDefinition } from "@/lib/pack-types";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("featured");
  const [templates, setTemplates] = useState<any[]>([]);
  const [createdCount, setCreatedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = getOwnerTokens();
    setCreatedCount(tokens.length);
    fetchTemplates();
  }, []);

  const fetchTemplates = async (cat = "featured") => {
    setLoading(true);
    try {
      let url = "/api/templates";
      if (cat === "featured") {
        url += "?featured=true";
      } else if (cat !== "all") {
        url += `?category=${cat}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    fetchTemplates(catId);
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-2 select-none animate-fade-in space-y-6">
      {/* 상단 Hero 영역 */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF6B35] text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>30초 모바일 소셜 놀이터</span>
          </div>
          {createdCount > 0 && (
            <Link
              href="/my"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1c1d2c] border border-orange-500/30 text-orange-400 text-xs font-bold hover:bg-[#25273c] transition-colors"
            >
              <User className="w-3 h-3" />
              <span>내 보따리 ({createdCount})</span>
            </Link>
          )}
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            오늘 친구한테 <br />
            <span className="text-gradient-brand">어떤 보따리</span> 던져볼까?
          </h1>
          <p className="text-xs text-gray-400">
            링크 하나로 30초 만에 즐기는 취향 & 밸런스 놀이터
          </p>
        </div>

        {/* 카테고리 탭 (기술적 타입 이름 완전 분리) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => handleSelectCategory("featured")}
            className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1 border ${
              selectedCategory === "featured"
                ? "bg-orange-500/20 border-[#FF6B35] text-white shadow-sm shadow-orange-500/20"
                : "bg-[#181926] border-[#252738] text-gray-400 hover:text-gray-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#FFA834]" />
            <span>인기 추천</span>
          </button>

          {TEMPLATE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1 border ${
                  isSelected
                    ? "bg-orange-500/20 border-[#FF6B35] text-white shadow-sm shadow-orange-500/20"
                    : "bg-[#181926] border-[#252738] text-gray-400 hover:text-gray-200"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 템플릿 콘텐츠 카드 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
          <span>놀거리 목록</span>
          <span className="text-[11px] text-gray-500">원클릭 시작</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#FF6B35]" />
            <span>보따리 불러오는 중...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs bg-[#181926] rounded-2xl border border-[#252738]">
            등록된 보따리가 없습니다.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-0.5">
            {templates.map((tpl) => (
              <div
                key={tpl.id || tpl.slug}
                className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] hover:border-orange-500/40 shadow-md space-y-3 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{tpl.emoji || "🎁"}</span>
                      <h3 className="text-sm font-extrabold text-white group-hover:text-[#FFA834] transition-colors">
                        {tpl.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                  {tpl.isFeatured && (
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-[#FFA834] border border-orange-500/20 text-[10px] font-bold shrink-0">
                      인기
                    </span>
                  )}
                </div>

                {/* 액션 버튼 2개: 내 것으로 만들기 / 직접 해보기 */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/create?template=${tpl.slug}`}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white text-xs font-extrabold flex items-center justify-center gap-1 shadow-md shadow-orange-500/20 hover:opacity-95 transition-all touch-active"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>내 보따리 만들기</span>
                  </Link>

                  <Link
                    href={`/create?template=${tpl.slug}`}
                    className="py-2.5 px-3 rounded-xl bg-[#25273c] hover:bg-[#2e314a] text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1 border border-[#343752] transition-colors"
                  >
                    <span>미리보기</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 직접 만들기 CTA */}
      <div className="sticky bottom-4 pt-2">
        <Link
          href="/create"
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-base shadow-xl shadow-orange-500/25 hover:opacity-95 transition-all touch-active"
        >
          <Sparkles className="w-5 h-5" />
          <span>새 보따리 직접 만들기 (30초)</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
