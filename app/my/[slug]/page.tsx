"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Award,
  AlertTriangle,
  CheckCircle,
  Eye,
  Users,
  TrendingUp,
  Loader2,
  Heart,
  Lock,
  Unlock,
  Trash2,
  EyeOff,
  Scale,
  Sparkles,
} from "lucide-react";
import { DetailedBottariAnalytics } from "@/lib/analytics";
import { getOwnerTokens } from "@/lib/storage";
import ShareModal from "@/components/ShareModal";

interface DetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function BottariAnalyticsDetailPage({ params }: DetailPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [analytics, setAnalytics] = useState<DetailedBottariAnalytics | null>(null);
  const [status, setStatus] = useState<"active" | "disabled">("active");
  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const localTokens = getOwnerTokens();
        const matched = localTokens.find((t) => t.slug === slug);
        if (matched?.token) {
          setOwnerToken(matched.token);
        }

        // 1. 세션 기반 시도
        const getRes = await fetch(`/api/my/${slug}/analytics`);
        if (getRes.ok) {
          const data = await getRes.json();
          if (data.success && data.analytics) {
            setAnalytics(data.analytics);
            setStatus(data.status || "active");
            setLoading(false);
            return;
          }
        }

        // 2. 토큰 기반 시도
        if (matched?.token) {
          const postRes = await fetch(`/api/my/${slug}/analytics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: matched.token }),
          });
          const postData = await postRes.json();
          if (postRes.ok && postData.success && postData.analytics) {
            setAnalytics(postData.analytics);
            setStatus(postData.status || "active");
            setLoading(false);
            return;
          }
        }

        setErrorMsg("보따리 반응을 볼 수 있는 권한이 없습니다.");
      } catch (err) {
        console.error(err);
        setErrorMsg("통계를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [slug]);

  // 보따리 열기/잠그기 토글
  const handleToggleStatus = async () => {
    const nextStatus = status === "active" ? "disabled" : "active";
    setTogglingStatus(true);
    try {
      const res = await fetch(`/api/my/bottaris/${slug}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, ownerToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingStatus(false);
    }
  };

  // 익명 메시지 숨김 토글
  const handleToggleHideMessage = async (msgId: string, currentHidden: boolean) => {
    try {
      const res = await fetch(`/api/my/responses/${msgId}/hide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: !currentHidden, ownerToken }),
      });
      if (res.ok) {
        setAnalytics((prev) => {
          if (!prev || !prev.anonymousMessages) return prev;
          const updated = prev.anonymousMessages.map((m) =>
            m.id === msgId ? { ...m, isHidden: !currentHidden } : m
          );
          return { ...prev, anonymousMessages: updated };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 익명 메시지 삭제
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("이 익명 메시지를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/my/responses/${msgId}/delete?token=${ownerToken || ""}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAnalytics((prev) => {
          if (!prev || !prev.anonymousMessages) return prev;
          const updated = prev.anonymousMessages.filter((m) => m.id !== msgId);
          return { ...prev, anonymousMessages: updated };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-3 select-none">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
        <span className="text-xs text-gray-400 font-medium">상세 반응 불러오는 중...</span>
      </div>
    );
  }

  if (errorMsg || !analytics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4 text-center select-none animate-fade-in">
        <p className="text-sm text-gray-300">{errorMsg || "보따리를 찾을 수 없습니다."}</p>
        <Link
          href="/my"
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors"
        >
          내 보따리로 돌아가기
        </Link>
      </div>
    );
  }

  const reactionEntries = analytics.reactions ? Object.entries(analytics.reactions) : [];

  return (
    <div className="flex-1 flex flex-col py-2 space-y-5 select-none animate-fade-in">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <Link
          href="/my"
          className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={togglingStatus}
            onClick={handleToggleStatus}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border transition-colors ${
              status === "active"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/15 border-rose-500/30 text-rose-400"
            }`}
          >
            {status === "active" ? (
              <>
                <Unlock className="w-3 h-3" />
                <span>응답 받는 중</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3" />
                <span>응답 마감됨</span>
              </>
            )}
          </button>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="p-2 -mr-2 rounded-xl text-[#FFA834] hover:bg-white/5 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* 보따리 기본 정보 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-white">{analytics.title}</h1>
        <p className="text-xs text-gray-400">
          생성일: {new Date(analytics.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </div>

      {/* 핵심 4분할 지표 그리드 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Eye className="w-4 h-4 text-blue-400" />
            <span>총 조회수</span>
          </div>
          <div className="text-2xl font-black text-white">{analytics.views}회</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>완료자 수</span>
          </div>
          <div className="text-2xl font-black text-white">
            {analytics.completes}명
            <span className="text-xs font-normal text-emerald-400 ml-1">
              ({analytics.completionRate}%)
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <TrendingUp className="w-4 h-4 text-[#FFA834]" />
            <span>평균 일치도</span>
          </div>
          <div className="text-2xl font-black text-[#FFA834]">{analytics.avgScore}%</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Award className="w-4 h-4 text-purple-400" />
            <span>100점 만점자</span>
          </div>
          <div className="text-2xl font-black text-purple-300">{analytics.perfectScoreCount}명</div>
        </div>
      </div>

      {/* 익명 피드백 메시지 목록 (Anonymous 전용) */}
      {analytics.type === "anonymous_feedback" && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>도착한 익명 메시지 ({analytics.anonymousMessages?.length || 0}개)</span>
            <span className="text-[11px] text-gray-500 font-normal">나만 볼 수 있어요 🔒</span>
          </div>

          {(!analytics.anonymousMessages || analytics.anonymousMessages.length === 0) ? (
            <div className="p-6 rounded-2xl bg-[#181926] border border-[#2c2e44] text-center text-xs text-gray-400">
              아직 도착한 익명 메시지가 없습니다. 링크를 공유해보세요!
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {analytics.anonymousMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 ${
                    msg.isHidden
                      ? "bg-[#14151f]/50 border-gray-800 opacity-60"
                      : "bg-[#1c1d2c] border-[#2c2e44]"
                  }`}
                >
                  <p className="text-gray-200 leading-relaxed break-words whitespace-pre-wrap">
                    {msg.message}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#25273c] text-[11px] text-gray-500">
                    <span>{new Date(msg.createdAt).toLocaleDateString("ko-KR")}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleHideMessage(msg.id, msg.isHidden)}
                        className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <EyeOff className="w-3 h-3" />
                        <span>{msg.isHidden ? "숨김 해제" : "숨기기"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 이모지 반응 목록 */}
      {reactionEntries.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Heart className="w-4 h-4 text-rose-400 fill-current" />
            <span>친구들이 남긴 이모지 반응</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {reactionEntries.map(([label, count]) => (
              <span
                key={label}
                className="px-3 py-1.5 rounded-xl bg-[#14151f] border border-[#2a2c40] text-sm font-bold text-gray-200 flex items-center gap-1.5"
              >
                <span>{label}</span>
                <span className="text-[#FFA834] font-mono">{count}개</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 하단 다시 공유하기 CTA */}
      <div className="pt-2 pb-2">
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition-all touch-active"
        >
          <Share2 className="w-4 h-4" />
          <span>친구들에게 다시 보따리 보내기</span>
        </button>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={analytics.title}
        slug={analytics.slug}
      />
    </div>
  );
}
