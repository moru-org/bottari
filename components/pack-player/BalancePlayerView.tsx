"use client";

import { useState } from "react";
import { PublicQuestion } from "@/lib/pack-types";
import { Scale } from "lucide-react";

interface BalancePlayerViewProps {
  questions: PublicQuestion[];
  onComplete: (answers: number[]) => void;
  isSubmitting: boolean;
}

export default function BalancePlayerView({
  questions,
  onComplete,
  isSubmitting,
}: BalancePlayerViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelect = (choiceIdx: number) => {
    const nextAnswers = [...answers, choiceIdx];
    setAnswers(nextAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete(nextAnswers);
    }
  };

  const optionA = currentQ?.options[0] || "선택 A";
  const optionB = currentQ?.options[1] || "선택 B";

  return (
    <div className="flex-1 flex flex-col justify-between space-y-4 animate-fade-in">
      {/* 상단 프로그레스 바 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
          <span className="text-[#FFA834] flex items-center gap-1 font-bold">
            <Scale className="w-3.5 h-3.5" />
            <span>극한 밸런스 게임</span>
          </span>
          <span className="font-mono text-white font-bold">
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

      {/* 질문 타이틀 */}
      <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] text-center space-y-1">
        <span className="text-[11px] font-bold text-orange-400 font-mono">
          BALANCE MATCH #{currentIndex + 1}
        </span>
        <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
          {currentQ?.question}
        </h2>
      </div>

      {/* 2지선다 A vs B 대결 카드 (거대 터치 버튼) */}
      <div className="flex-1 flex flex-col justify-center gap-3">
        {/* Option A 카드 */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSelect(0)}
          className="flex-1 min-h-[110px] p-5 rounded-3xl bg-gradient-to-br from-[#27293d] to-[#1f2030] hover:from-[#2e314a] hover:to-[#25273c] active:scale-[0.98] border-2 border-[#373a54] hover:border-orange-500/60 flex flex-col justify-between text-left shadow-xl transition-all touch-active group relative overflow-hidden"
        >
          <div className="flex items-center justify-between w-full">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-[#FF6B35] text-xs font-black">
              A
            </span>
            <span className="text-[11px] font-bold text-gray-400 group-hover:text-white">
              선택하기 👈
            </span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-white leading-snug group-hover:text-[#FFA834] transition-colors">
            {optionA}
          </p>
        </button>

        {/* VS 뱃지 */}
        <div className="flex items-center justify-center -my-2 z-10">
          <span className="w-8 h-8 rounded-full bg-[#FF6B35] text-white font-black text-xs flex items-center justify-center shadow-lg shadow-orange-500/40">
            VS
          </span>
        </div>

        {/* Option B 카드 */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSelect(1)}
          className="flex-1 min-h-[110px] p-5 rounded-3xl bg-gradient-to-br from-[#1f2030] to-[#27293d] hover:from-[#25273c] hover:to-[#2e314a] active:scale-[0.98] border-2 border-[#373a54] hover:border-blue-500/60 flex flex-col justify-between text-left shadow-xl transition-all touch-active group relative overflow-hidden"
        >
          <div className="flex items-center justify-between w-full">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-black">
              B
            </span>
            <span className="text-[11px] font-bold text-gray-400 group-hover:text-white">
              선택하기 👉
            </span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-white leading-snug group-hover:text-blue-300 transition-colors">
            {optionB}
          </p>
        </button>
      </div>

      <div className="text-center pb-1">
        <p className="text-[11px] text-gray-500">
          * 선택 즉시 전체 참여자의 득표율 통계가 집계됩니다.
        </p>
      </div>
    </div>
  );
}
