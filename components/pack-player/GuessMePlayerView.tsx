"use client";

import { useState } from "react";
import { PublicQuestion } from "@/lib/pack-types";
import { Zap } from "lucide-react";

interface GuessMePlayerViewProps {
  questions: PublicQuestion[];
  onComplete: (answers: number[]) => void;
  isSubmitting: boolean;
}

export default function GuessMePlayerView({
  questions,
  onComplete,
  isSubmitting,
}: GuessMePlayerViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (optIdx: number) => {
    const nextAnswers = [...answers, optIdx];
    setAnswers(nextAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete(nextAnswers);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between space-y-5 animate-fade-in">
      {/* 상단 프로그레스 바 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
          <span className="text-[#FFA834] flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>내 선택 맞히기</span>
          </span>
          <span className="font-mono text-white">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full h-2 bg-[#232538] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FFA834] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 질문 카드 */}
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <div className="p-6 rounded-3xl bg-[#1c1d2c] border border-[#2c2e44] shadow-xl text-center space-y-2.5">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20 font-mono">
            ROUND {currentIndex + 1}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
            {currentQ?.question}
          </h2>
          <p className="text-xs text-gray-400">둘 중 친구가 어떤 것을 골랐을까요?</p>
        </div>

        {/* 2지선다 또는 4지선다 선택지 목록 */}
        <div className="space-y-2.5">
          {currentQ?.options.map((option, idx) => (
            <button
              key={idx}
              disabled={isSubmitting}
              onClick={() => handleSelectOption(idx)}
              className="w-full min-h-[58px] p-4 sm:p-5 rounded-2xl bg-[#25273c] hover:bg-[#2e314a] active:bg-orange-500/20 border border-[#343752] hover:border-orange-500/50 text-white font-bold text-base text-left flex items-center justify-between shadow-lg transition-all touch-active group"
            >
              <span className="group-hover:text-[#FFA834] transition-colors">{option}</span>
              <div className="w-7 h-7 rounded-full bg-[#1c1d2c] border border-[#3a3d5c] flex items-center justify-center text-xs font-bold text-gray-400 group-hover:border-[#FF6B35] group-hover:text-white transition-colors shrink-0 ml-2">
                {idx + 1}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="text-center pb-1">
        <p className="text-[11px] text-gray-500">
          * 친구의 마음을 읽고 텔레파시를 맞춰보세요!
        </p>
      </div>
    </div>
  );
}
