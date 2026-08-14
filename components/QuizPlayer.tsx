"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Share2, CheckCircle2, XCircle, RotateCcw, Award } from "lucide-react";
import confetti from "canvas-confetti";
import { BottariPlayData, QuizResult } from "@/lib/types";
import { hasOwnerToken } from "@/lib/storage";
import ShareModal from "@/components/ShareModal";

interface QuizPlayerProps {
  bottari: BottariPlayData;
}

export default function QuizPlayer({ bottari }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // 컴포넌트 마운트 시 시작 이벤트 로깅 및 소유권 여부 체크
  useEffect(() => {
    setIsOwner(hasOwnerToken(bottari.slug));

    fetch(`/api/bottari/${bottari.slug}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "play_started" }),
    }).catch(() => {});
  }, [bottari.slug]);

  // 고득점 시 축하 콘페티 효과
  useEffect(() => {
    if (result && result.percentage >= 60) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FF6B35", "#FFDF00", "#2EC4B6", "#FF4E50"],
        });
      } catch {
        // ignore
      }
    }
  }, [result]);

  const currentQuestion = bottari.questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / bottari.questions.length) * 100);

  // 선택지 클릭
  const handleSelectOption = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers, optionIndex];
    setSelectedAnswers(newAnswers);

    if (currentIndex + 1 < bottari.questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 모든 문제 풀이 완료 -> 서버 채점 요청
      submitAnswers(newAnswers);
    }
  };

  // 답안 제출 및 채점
  const submitAnswers = async (answers: number[]) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bottari/${bottari.slug}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 다시 풀기
  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setResult(null);
  };

  // 1. 결과 화면 뷰
  if (result) {
    return (
      <div className="flex-1 flex flex-col justify-between py-2 space-y-6 select-none animate-fade-in">
        <div className="space-y-5">
          {/* 상단 뱃지 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">
              {bottari.title}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              풀이 완료
            </span>
          </div>

          {/* 메인 점수 카드 */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#24253a] to-[#1a1b28] border border-[#343752] text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                최종 일치도
              </span>
              <div className="text-5xl sm:text-6xl font-black text-gradient-brand tracking-tight">
                {result.percentage}%
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {result.totalQuestions}문제 중 {result.score}개 정답!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#14151f]/80 border border-white/5 space-y-1">
              <h3 className="font-extrabold text-base text-white">{result.gradeTitle}</h3>
              <p className="text-xs text-gray-300 leading-relaxed font-normal">
                {result.gradeMessage}
              </p>
            </div>
          </div>

          {/* 문항별 정답/오답 확인 아코디언 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 px-1">정답 확인</h4>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {result.questionsFeedback.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl bg-[#1c1d2c] border border-[#2c2e44] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5 max-w-[80%]">
                    <span className="font-bold text-gray-200">
                      Q{idx + 1}. {item.question}
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className={item.isCorrect ? "text-emerald-400" : "text-rose-400"}>
                        내 답: {item.userAnswer}
                      </span>
                      {!item.isCorrect && (
                        <span className="text-gray-400">
                          (정답: {item.correctAnswer})
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 바이럴 & 리텐션 액션 버튼 */}
        <div className="space-y-2.5 pt-4 pb-2">
          {/* CTA 1: 결과 공유 */}
          <button
            onClick={() => setShowShareModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#FEE500] hover:bg-[#ebd300] text-[#191919] font-extrabold text-sm shadow-lg transition-all touch-active"
          >
            <Share2 className="w-4 h-4 fill-current" />
            <span>내 점수 친구에게 자랑하기</span>
          </button>

          {/* CTA 2: 나도 보따리 만들기 (바이럴 유입 핵심) */}
          <Link
            href={`/create?ref=${bottari.slug}`}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-sm shadow-lg shadow-orange-500/20 transition-all touch-active"
          >
            <Sparkles className="w-4 h-4" />
            <span>나도 친구들 테스트해볼래! (내 보따리 만들기)</span>
          </Link>

          {/* 생성자이거나 반응 보러가기 */}
          {isOwner && (
            <Link
              href="/my"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              <span>내가 만든 보따리 반응 확인하기</span>
            </Link>
          )}

          <button
            onClick={handleRestart}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>다시 풀어보기</span>
          </button>
        </div>

        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={`${bottari.title}에서 ${result.percentage}% 일치!`}
          slug={bottari.slug}
        />
      </div>
    );
  }

  // 2. 문제 풀이 진행 화면 뷰
  return (
    <div className="flex-1 flex flex-col justify-between py-2 space-y-6 select-none">
      {/* 상단 프로그레스 바 및 문항 번호 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
          <span className="text-[#FFA834]">{bottari.title}</span>
          <span>
            {currentIndex + 1} / {bottari.questions.length}
          </span>
        </div>
        <div className="w-full h-2 bg-[#232538] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FFA834] transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 메인 퀴즈 문항 카드 */}
      <div className="flex-1 flex flex-col justify-center space-y-6 animate-scale-up key={currentIndex}">
        <div className="p-6 rounded-3xl bg-[#1c1d2c] border border-[#2c2e44] shadow-xl text-center space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20">
            QUESTION {currentIndex + 1}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
            {currentQuestion?.question}
          </h2>
        </div>

        {/* 선택지 2~4개 큼직한 터치 버튼 영역 */}
        <div className="space-y-3">
          {currentQuestion?.options.map((option, idx) => (
            <button
              key={idx}
              disabled={isSubmitting}
              onClick={() => handleSelectOption(idx)}
              className="w-full p-4 sm:p-5 rounded-2xl bg-[#25273c] hover:bg-[#2e314a] active:bg-orange-500/20 border border-[#343752] hover:border-orange-500/50 text-white font-bold text-base sm:text-lg text-left flex items-center justify-between shadow-lg transition-all touch-active group"
            >
              <span className="group-hover:text-[#FFA834] transition-colors">{option}</span>
              <div className="w-7 h-7 rounded-full bg-[#1c1d2c] border border-[#3a3d5c] flex items-center justify-center text-xs font-bold text-gray-400 group-hover:border-[#FF6B35] group-hover:text-white transition-colors shrink-0 ml-2">
                {idx + 1}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 하단 보따리 힌트 */}
      <div className="text-center pb-2">
        <p className="text-[11px] text-gray-500">
          * 친구의 취향이라고 생각하는 보기를 터치하세요!
        </p>
      </div>
    </div>
  );
}
