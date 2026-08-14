"use client";

import { useState } from "react";
import { Check, Copy, Share2, X, MessageCircle } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  slug: string;
}

export default function ShareModal({ isOpen, onClose, title, slug }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/p/${slug}`
    : `https://bottari.app/p/${slug}`;

  const trackShare = async () => {
    try {
      await fetch(`/api/bottari/${slug}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "share_clicked" }),
      });
    } catch {
      // ignore
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackShare();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      trackShare();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    trackShare();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `🎒 ${title}`,
          text: `친구야, 나를 얼마나 알고 있어? 30초 퀴즈 보따리 풀어봐!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or not supported
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#1a1b28] border-t sm:border border-[#2a2c40] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-scale-up">
        {/* 상단 닫기 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/20 text-[#FF6B35]">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">친구에게 보따리 보내기</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-300 mb-5 leading-relaxed">
          카톡방이나 인스타 DM에 링크를 보내 친구들이 나를 얼마나 아는지 확인해보세요!
        </p>

        {/* 공유 옵션 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#ebd300] text-[#191919] font-bold text-sm shadow-lg transition-all touch-active"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>카카오톡 / SNS로 바로 보내기</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl bg-[#25273c] hover:bg-[#2e314a] text-white border border-[#32354f] font-medium text-sm transition-all touch-active"
          >
            <span className="truncate max-w-[240px] text-gray-300 text-xs font-mono">
              {shareUrl}
            </span>
            <div className="flex items-center gap-1 text-[#FFA834] font-bold text-xs shrink-0">
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
          onClick={onClose}
          className="w-full mt-4 py-2.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          나중에 보내기
        </button>
      </div>
    </div>
  );
}
