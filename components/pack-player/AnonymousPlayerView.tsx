"use client";

import { useState } from "react";
import { PublicQuestion } from "@/lib/pack-types";
import { Send, Sparkles, Loader2 } from "lucide-react";

interface AnonymousPlayerViewProps {
  question: PublicQuestion;
  onSubmit: (message: string) => void;
  isSubmitting: boolean;
}

export default function AnonymousPlayerView({
  question,
  onSubmit,
  isSubmitting,
}: AnonymousPlayerViewProps) {
  const [message, setMessage] = useState("");
  const maxLength = question.maxLength || 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;
    onSubmit(message.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 flex flex-col justify-between space-y-5 animate-fade-in"
    >
      <div className="space-y-4">
        {/* 질문 카드 */}
        <div className="p-6 rounded-3xl bg-[#1c1d2c] border border-[#2c2e44] shadow-xl text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-[#FF6B35] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
            {question.question}
          </h2>
          <p className="text-xs text-gray-400">
            {question.placeholder || "보낸 사람의 이름은 어디에도 남지 않아요 💌"}
          </p>
        </div>

        {/* 텍스트 에디터 영역 */}
        <div className="p-4 rounded-3xl bg-[#181926] border border-[#2c2e44] space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={maxLength}
            rows={6}
            placeholder="평소 쑥스러워 하지 못했던 말, 고마웠던 점, 솔직한 생각을 자유롭게 적어보세요..."
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 resize-none focus:outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-[#25273c]">
            <span>* 안전한 소통을 위해 비방/욕설은 지양해주세요.</span>
            <span className="font-mono font-bold text-gray-400">
              {message.length} / {maxLength}
            </span>
          </div>
        </div>
      </div>

      {/* 하단 전송 버튼 */}
      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={!message.trim() || isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-base shadow-xl shadow-orange-500/25 hover:opacity-95 disabled:opacity-40 transition-all touch-active"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>익명 메시지 담는 중...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>익명으로 메시지 보내기</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
