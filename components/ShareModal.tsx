"use client";

import { useState } from "react";
import { Check, Copy, Share2, X, MessageCircle, Sparkles } from "lucide-react";
import { getShareUrl } from "@/lib/config";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  slug: string;
}

export default function ShareModal({ isOpen, onClose, title, slug }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = getShareUrl(slug);

  const trackEvent = async (eventType: "share_clicked" | "link_copied") => {
    try {
      await fetch(`/api/bottari/${slug}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType }),
      });
    } catch {
      // ignore
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackEvent("link_copied");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      trackEvent("link_copied");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    trackEvent("share_clicked");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `🎁 ${title}`,
          text: `친구야, 나를 얼마나 알고 있어? 30초 퀴즈 보따리 풀어봐! 🎁`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#1a1b28] border-t sm:border border-[#2a2c40] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/20 text-[#FF6B35]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-lg text-white">친구에게 보따리 보내기</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
          카톡방이나 인스타 DM에 공유해보세요! 친구들이 30초 만에 풀고 결과를 보냅니다.
        </p>

        {/* 1순위: 카카오톡 / SNS 바로 공유 */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-[#FEE500] hover:bg-[#ebd300] text-[#191919] font-extrabold text-sm shadow-lg shadow-yellow-500/10 transition-all touch-active"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>카카오톡 / DM으로 공유하기</span>
          </button>

          {/* 2순위: 링크 복사 */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center justify-between py-3.5 px-4 rounded-2xl bg-[#25273c] hover:bg-[#2e314a] text-white border border-[#343752] font-medium text-xs sm:text-sm transition-all touch-active"
          >
            <span className="truncate max-w-[220px] text-gray-300 font-mono text-xs">
              {shareUrl}
            </span>
            <div className="flex items-center gap-1.5 text-[#FFA834] font-bold text-xs shrink-0">
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>링크 복사</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="w-full pt-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
