"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Share2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Play,
  Heart,
  Lock,
  MessageCircle,
  Eye,
  Scale,
  Users,
} from "lucide-react";
import confetti from "canvas-confetti";
import { PackPlayData, PackResultPayload } from "@/lib/pack-types";
import { hasOwnerToken } from "@/lib/storage";
import ShareModal from "@/components/ShareModal";
import QuizPlayerView from "./QuizPlayerView";
import GuessMePlayerView from "./GuessMePlayerView";
import ImpressionPlayerView from "./ImpressionPlayerView";
import AnonymousPlayerView from "./AnonymousPlayerView";
import BalancePlayerView from "./BalancePlayerView";

interface GenericPackPlayerProps {
  bottari: PackPlayData;
}

const EMOJI_REACTIONS = [
  { emoji: "🤣", label: "ㅋㅋ" },
  { emoji: "😱", label: "헐" },
  { emoji: "👍", label: "인정" },
  { emoji: "🤯", label: "어이없음" },
  { emoji: "👑", label: "천재" },
];

export default function GenericPackPlayer({ bottari }: GenericPackPlayerProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PackResultPayload | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 컴포넌트 마운트 시 진입 이벤트 로깅 및 소유권 여부 체크
  useEffect(() => {
    setIsOwner(hasOwnerToken(bottari.slug));

    fetch(`/api/bottari/${bottari.slug}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "bottari_opened" }),
    }).catch(() => {});
  }, [bottari.slug]);

  // 점수형/일치형 결과 시 콘페티 효과
  useEffect(() => {
    if (result) {
      if (
        (result.type === "friend_quiz" && result.percentage >= 60) ||
        (result.type === "guess_me" && result.matchPercentage >= 60) ||
        result.type === "anonymous_feedback"
      ) {
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#FF6B35", "#FFDF00", "#2EC4B6", "#FF4E50"],
          });
        } catch {
          // ignore
        }
      }
    }
  }, [result]);

  const handleStartPlay = () => {
    setIsStarted(true);
    fetch(`/api/bottari/${bottari.slug}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "play_started" }),
    }).catch(() => {});
  };

  // 선택형 팩 답안 제출
  const handleAnswersComplete = async (answers: number[]) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/bottari/${bottari.slug}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.result);
      } else {
        setErrorMsg(data.error || "답안 제출에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 익명 텍스트 피드백 제출
  const handleAnonymousSubmit = async (messageText: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/bottari/${bottari.slug}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.result);
      } else {
        setErrorMsg(data.error || "메시지 전송에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReaction = (emojiLabel: string) => {
    setSelectedReaction(emojiLabel);
    fetch(`/api/bottari/${bottari.slug}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "reaction_created",
        metadata: { reaction: emojiLabel },
      }),
    }).catch(() => {});
  };

  const handleCreateFromResult = () => {
    fetch(`/api/bottari/${bottari.slug}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "create_from_result_clicked" }),
    }).catch(() => {});
  };

  const handleRestart = () => {
    setResult(null);
    setSelectedReaction(null);
    setIsStarted(true);
  };

  // ==========================================
  // 보따리가 마감(잠금)된 경우
  // ==========================================
  if (bottari.status === "disabled") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12 select-none animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-gray-500/10 text-gray-400 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">참여가 마감된 보따리입니다</h2>
          <p className="text-xs text-gray-400">
            제작자가 응답 받기를 일시 중지했습니다.
          </p>
        </div>
        <div className="pt-2 space-y-2">
          <Link
            href={`/create?ref=${bottari.slug}`}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-bold text-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>나만의 새 보따리 만들기</span>
          </Link>
          <br />
          <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors">
            홈으로 가기 →
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // 1. 인트로 화면
  // ==========================================
  if (!isStarted && !result) {
    return (
      <div className="flex-1 flex flex-col justify-between py-4 space-y-6 select-none animate-fade-in">
        <div className="space-y-6 pt-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#FF6B35] to-[#FFA834] flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/25 animate-scale-up">
            <span className="text-4xl">{bottari.emoji || "🎁"}</span>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF6B35] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>보따리가 도착했어요!</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {bottari.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300">
              {bottari.description || "친구가 보낸 보따리를 풀고 반응을 남겨보세요!"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] text-xs text-gray-300 flex items-center justify-around font-medium">
            <div className="space-y-0.5">
              <span className="text-gray-400 text-[11px]">문항 수</span>
              <p className="font-bold text-white text-sm">{bottari.questions.length}개</p>
            </div>
            <div className="w-px h-6 bg-[#2c2e44]" />
            <div className="space-y-0.5">
              <span className="text-gray-400 text-[11px]">소요 시간</span>
              <p className="font-bold text-white text-sm">약 30초</p>
            </div>
            <div className="w-px h-6 bg-[#2c2e44]" />
            <div className="space-y-0.5">
              <span className="text-gray-400 text-[11px]">참여 방식</span>
              <p className="font-bold text-[#FFA834] text-sm">로그인 없이 즉시</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-6 pb-2">
          <button
            type="button"
            onClick={handleStartPlay}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-base shadow-xl shadow-orange-500/25 hover:opacity-95 transition-all touch-active"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>시작하기</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. 결과 화면 (5개 팩 타입별 결과 뷰)
  // ==========================================
  if (result) {
    return (
      <div className="flex-1 flex flex-col justify-between py-2 space-y-5 select-none animate-fade-in">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 truncate max-w-[200px]">
              {bottari.title}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              참여 완료
            </span>
          </div>

          {/* Type 1. Friend Quiz 결과 카드 */}
          {result.type === "friend_quiz" && (
            <>
              <div className="p-5 rounded-3xl bg-gradient-to-b from-[#24253a] to-[#1a1b28] border border-[#343752] text-center space-y-3 shadow-2xl">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    일치도
                  </span>
                  <div className="text-5xl font-black text-gradient-brand tracking-tight">
                    {result.percentage}%
                  </div>
                  <p className="text-xs text-gray-400 font-medium">
                    {result.totalQuestions}문제 중 {result.score}개 정답!
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#14151f]/80 border border-white/5 space-y-0.5">
                  <h3 className="font-extrabold text-sm text-white">{result.gradeTitle}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed font-normal">
                    {result.gradeMessage}
                  </p>
                </div>
              </div>

              {/* 정답 오답 확인 */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-gray-400 px-1">정답 확인</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {result.questionsFeedback.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-xl bg-[#1c1d2c] border border-[#2c2e44] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 max-w-[80%]">
                        <span className="font-bold text-gray-200">
                          Q{idx + 1}. {item.question}
                        </span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={item.isCorrect ? "text-emerald-400 font-bold" : "text-rose-400"}>
                            내 답: {item.userAnswer}
                          </span>
                          {!item.isCorrect && (
                            <span className="text-gray-400">(정답: {item.correctAnswer})</span>
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
            </>
          )}

          {/* Type 2. Guess Me 결과 카드 */}
          {result.type === "guess_me" && (
            <>
              <div className="p-5 rounded-3xl bg-gradient-to-b from-[#24253a] to-[#1a1b28] border border-[#343752] text-center space-y-3 shadow-2xl">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    텔레파시 일치율
                  </span>
                  <div className="text-5xl font-black text-gradient-brand tracking-tight">
                    {result.matchPercentage}%
                  </div>
                  <p className="text-xs text-gray-400 font-medium">
                    {result.totalQuestions}개 중 {result.matchCount}개 일치!
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#14151f]/80 border border-white/5 space-y-0.5">
                  <h3 className="font-extrabold text-sm text-white">{result.gradeTitle}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed font-normal">
                    {result.gradeMessage}
                  </p>
                </div>
              </div>

              {/* 매칭 피드백 */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-gray-400 px-1">선택 비교</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {result.matchesFeedback.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-xl bg-[#1c1d2c] border border-[#2c2e44] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 max-w-[80%]">
                        <span className="font-bold text-gray-200">
                          #{idx + 1}. {item.question}
                        </span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={item.isMatched ? "text-emerald-400 font-bold" : "text-gray-300"}>
                            내 추측: {item.userChoice}
                          </span>
                          {!item.isMatched && (
                            <span className="text-[#FFA834] font-semibold">(친구의 선택: {item.creatorChoice})</span>
                          )}
                        </div>
                      </div>
                      <div>
                        {item.isMatched ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Type 3. First Impression 결과 카드 */}
          {result.type === "first_impression" && (
            <div className="space-y-3">
              <div className="p-4 rounded-3xl bg-gradient-to-b from-[#24253a] to-[#1a1b28] border border-[#343752] text-center space-y-1">
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>투표가 반영되었어요!</span>
                </span>
                <h3 className="text-base font-extrabold text-white">친구들이 보는 이미지 분포</h3>
                <p className="text-xs text-gray-400">{result.message}</p>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {result.distributions.map((dist, dIdx) => (
                  <div
                    key={dist.questionId || dIdx}
                    className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-2"
                  >
                    <span className="text-xs font-bold text-white block">
                      Q{dIdx + 1}. {dist.question}
                    </span>
                    <div className="space-y-1.5">
                      {dist.options.map((opt, oIdx) => (
                        <div key={oIdx} className="space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">{opt.label}</span>
                            <span className="font-bold text-[#FFA834] font-mono">
                              {opt.percentage}% ({opt.votes}표)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[#14151f] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FFA834] rounded-full"
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Type 4. Anonymous Feedback 결과 카드 */}
          {result.type === "anonymous_feedback" && (
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#24253a] to-[#1a1b28] border border-[#343752] text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">메시지가 전달되었어요! 💌</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  친구의 보따리 보관함에 익명으로 안전하게 보관되었습니다.
                </p>
              </div>
            </div>
          )}

          {/* Type 5. Balance Game 결과 카드 */}
          {result.type === "balance" && (
            <div className="space-y-3">
              <div className="p-4 rounded-3xl bg-gradient-to-b from-[#24253a] to-[#1a1b28] border border-[#343752] text-center space-y-1">
                <span className="text-xs font-bold text-orange-400 flex items-center justify-center gap-1">
                  <Scale className="w-4 h-4" />
                  <span>실시간 밸런스 집계 현황</span>
                </span>
                <p className="text-xs text-gray-300">{result.message}</p>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {result.questionsStats.map((stat, sIdx) => (
                  <div
                    key={stat.questionId || sIdx}
                    className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-2"
                  >
                    <span className="text-xs font-bold text-white block">
                      #{sIdx + 1}. {stat.question}
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold pt-0.5">
                      <span className="text-[#FF6B35]">A: {stat.optionAPercentage}%</span>
                      <span className="text-blue-400">B: {stat.optionBPercentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#14151f] rounded-full flex overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FFA834]"
                        style={{ width: `${stat.optionAPercentage}%` }}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${stat.optionBPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 반응 남기기 (이모지 5종) */}
          <div className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-2 text-center">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-white flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />
                <span>친구에게 한 줄 반응 남기기</span>
              </span>
              {selectedReaction && (
                <span className="text-[11px] text-emerald-400 font-normal">
                  반응 전달 완료! ✨
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-0.5">
              {EMOJI_REACTIONS.map((item) => {
                const isSelected = selectedReaction === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSendReaction(item.label)}
                    className={`py-2 px-1 rounded-xl text-center transition-all touch-active flex flex-col items-center gap-0.5 border ${
                      isSelected
                        ? "bg-orange-500/20 border-[#FF6B35] text-white shadow-sm shadow-orange-500/20 scale-105"
                        : "bg-[#14151f] border-[#2a2c40] text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <span className="text-[10px] font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 하단 바이럴 액션 CTA (나도 만들기 & 공유 & 다른 보따리) */}
        <div className="space-y-2 pt-2 pb-2">
          {/* Primary Viral Loop: 나도 보따리 만들기 */}
          <Link
            href={`/create?ref=${bottari.slug}`}
            onClick={handleCreateFromResult}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-base shadow-xl shadow-orange-500/25 hover:opacity-95 transition-all touch-active"
          >
            <Sparkles className="w-5 h-5" />
            <span>나도 보따리 만들기 (30초)</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          {/* Secondary CTA: 결과 공유 */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#FEE500] hover:bg-[#ebd300] text-[#191919] font-extrabold text-xs shadow-md transition-all touch-active"
          >
            <Share2 className="w-4 h-4 fill-current" />
            <span>이 결과 친구에게 자랑하기</span>
          </button>

          {/* 소유자일 경우 내 보따리 반응 확인 */}
          {isOwner && (
            <Link
              href="/my"
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              <span>내가 만든 보따리 반응 확인하기</span>
            </Link>
          )}

          <div className="flex items-center justify-between pt-1 text-xs">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              ← 다른 보따리 둘러보기
            </Link>
            <button
              type="button"
              onClick={handleRestart}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>다시 하기</span>
            </button>
          </div>
        </div>

        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={`${bottari.title} 플레이 완료!`}
          slug={bottari.slug}
        />
      </div>
    );
  }

  // ==========================================
  // 3. 문제 풀이 진행 중 (타입별 서브 뷰)
  // ==========================================
  return (
    <div className="flex-1 flex flex-col justify-between py-2 space-y-4 select-none">
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      {bottari.type === "friend_quiz" && (
        <QuizPlayerView
          questions={bottari.questions}
          onComplete={handleAnswersComplete}
          isSubmitting={isSubmitting}
        />
      )}

      {bottari.type === "guess_me" && (
        <GuessMePlayerView
          questions={bottari.questions}
          onComplete={handleAnswersComplete}
          isSubmitting={isSubmitting}
        />
      )}

      {bottari.type === "first_impression" && (
        <ImpressionPlayerView
          questions={bottari.questions}
          onComplete={handleAnswersComplete}
          isSubmitting={isSubmitting}
        />
      )}

      {bottari.type === "anonymous_feedback" && (
        <AnonymousPlayerView
          question={bottari.questions[0]}
          onSubmit={handleAnonymousSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {bottari.type === "balance" && (
        <BalancePlayerView
          questions={bottari.questions}
          onComplete={handleAnswersComplete}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
