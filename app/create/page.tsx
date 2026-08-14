"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, CheckCircle2, Shuffle, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { PRESET_QUESTIONS } from "@/lib/presets";
import { QuizQuestion } from "@/lib/types";
import { saveOwnerToken } from "@/lib/storage";
import ShareModal from "@/components/ShareModal";

function CreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralId = searchParams.get("ref");

  const [title, setTitle] = useState("내가 만든 취향 보따리");
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: "q1",
      question: PRESET_QUESTIONS[0].question,
      options: [...PRESET_QUESTIONS[0].options],
      answerIndex: 0,
    },
    {
      id: "q2",
      question: PRESET_QUESTIONS[1].question,
      options: [...PRESET_QUESTIONS[1].options],
      answerIndex: 0,
    },
    {
      id: "q3",
      question: PRESET_QUESTIONS[2].question,
      options: [...PRESET_QUESTIONS[2].options],
      answerIndex: 1,
    },
  ]);

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdData, setCreatedData] = useState<{ slug: string; title: string } | null>(null);

  // 질문 내용 변경
  const updateQuestionText = (index: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], question: text };
      return copy;
    });
  };

  // 선택지 내용 변경
  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const newOptions = [...copy[qIndex].options];
      newOptions[optIndex] = text;
      copy[qIndex] = { ...copy[qIndex], options: newOptions };
      return copy;
    });
  };

  // 정답 선택
  const setCorrectAnswer = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], answerIndex: optIndex };
      return copy;
    });
  };

  // 랜덤 프리셋 불러오기
  const applyRandomPreset = (index: number) => {
    const randomPreset = PRESET_QUESTIONS[Math.floor(Math.random() * PRESET_QUESTIONS.length)];
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        question: randomPreset.question,
        options: [...randomPreset.options],
        answerIndex: randomPreset.defaultAnswerIndex ?? 0,
      };
      return copy;
    });
  };

  // 질문 추가
  const addQuestion = () => {
    if (questions.length >= 10) {
      setErrorMsg("질문은 최대 10개까지 추가할 수 있습니다.");
      return;
    }
    const nextPreset = PRESET_QUESTIONS[questions.length % PRESET_QUESTIONS.length];
    setQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        question: nextPreset.question,
        options: [...nextPreset.options],
        answerIndex: nextPreset.defaultAnswerIndex ?? 0,
      },
    ]);
  };

  // 질문 삭제
  const removeQuestion = (index: number) => {
    if (questions.length <= 3) {
      setErrorMsg("최소 3개의 질문이 필요합니다.");
      return;
    }
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  // 보따리 생성 요청
  const handleCreate = async () => {
    setErrorMsg(null);
    if (!title.trim()) {
      setErrorMsg("보따리 이름을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/bottari", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            questions,
            referralId: referralId || null,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.error || "보따리 생성에 실패했습니다.");
          return;
        }

        // 로컬 토큰 저장
        if (data.ownerToken) {
          saveOwnerToken(data.slug, data.ownerToken);
        }

        setCreatedData({
          slug: data.slug,
          title: data.title,
        });
      } catch (err) {
        console.error(err);
        setErrorMsg("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col py-2 space-y-5 select-none">
      {/* 상단 뒤로가기 & 헤더 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-[#FFA834] bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
          Step 1. 질문 & 정답 만들기
        </span>
        <div className="w-5" />
      </div>

      {/* 보따리 제목 설정 */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-300">보따리 이름</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 민수의 취향 탐구 보따리"
          maxLength={30}
          className="w-full px-4 py-3 rounded-xl bg-[#1c1d2c] border border-[#2c2e44] text-white text-sm focus:outline-none focus:border-[#FF6B35] transition-colors"
        />
      </div>

      {/* 질문 목록 영역 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span>질문 목록</span>
            <span className="text-xs font-normal text-orange-400">({questions.length}/10)</span>
          </h2>
          <span className="text-[11px] text-gray-400">
            * 내 정답인 선택지를 터치하세요!
          </span>
        </div>

        {questions.map((q, qIdx) => (
          <div
            key={q.id || qIdx}
            className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] shadow-md space-y-3 relative group"
          >
            {/* 질문 헤더 및 랜덤/삭제 */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FFA834]">Q{qIdx + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyRandomPreset(qIdx)}
                  className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-orange-300 bg-[#25273c] px-2 py-1 rounded-lg border border-[#32354e] transition-colors"
                  title="다른 추천 질문으로 바꾸기"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>질문 변경</span>
                </button>
                {questions.length > 3 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="p-1 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                    title="질문 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 질문 텍스트 인풋 */}
            <input
              type="text"
              value={q.question}
              onChange={(e) => updateQuestionText(qIdx, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#14151f] border border-[#2a2c40] text-white text-sm font-medium focus:outline-none focus:border-[#FF6B35]"
              placeholder="질문을 입력하세요"
            />

            {/* 선택지 2개 목록 (정답 선택 버튼) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {q.options.map((opt, optIdx) => {
                const isSelected = q.answerIndex === optIdx;
                return (
                  <div
                    key={optIdx}
                    onClick={() => setCorrectAnswer(qIdx, optIdx)}
                    className={`cursor-pointer p-2.5 rounded-xl border transition-all touch-active flex flex-col justify-between ${
                      isSelected
                        ? "bg-orange-500/15 border-[#FF6B35] text-white shadow-sm shadow-orange-500/20"
                        : "bg-[#14151f] border-[#2a2c40] text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        보기 {optIdx + 1}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-[#FF6B35]">
                          <CheckCircle2 className="w-3 h-3 fill-current" />
                          <span>정답</span>
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={opt}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none border-b border-transparent focus:border-orange-400"
                      placeholder={`선택지 ${optIdx + 1}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 질문 추가 버튼 */}
        {questions.length < 10 && (
          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-[#2c2e44] hover:border-orange-500/50 text-gray-400 hover:text-orange-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all touch-active"
          >
            <Plus className="w-4 h-4" />
            <span>질문 추가하기 (+1)</span>
          </button>
        )}
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      {/* 하단 생성 완료 버튼 */}
      <div className="sticky bottom-4 pt-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleCreate}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-base shadow-xl shadow-orange-500/25 hover:opacity-95 disabled:opacity-50 transition-all touch-active"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>보따리 묶는 중...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>보따리 완성하기 ({questions.length}문제)</span>
            </>
          )}
        </button>
      </div>

      {/* 생성 완료 후 공유 및 반응보기 유도 모달 */}
      {createdData && (
        <ShareModal
          isOpen={true}
          title={createdData.title}
          slug={createdData.slug}
          onClose={() => router.push(`/p/${createdData.slug}`)}
        />
      )}
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">불러오는 중...</div>}>
      <CreatePageInner />
    </Suspense>
  );
}
