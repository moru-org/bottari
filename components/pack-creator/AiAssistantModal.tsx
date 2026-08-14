"use client";

import { useState } from "react";
import { Sparkles, X, Loader2, ArrowRight, Check } from "lucide-react";
import { PackType } from "@/lib/pack-types";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  packType: PackType;
  onApplyQuestions: (questions: any[]) => void;
}

export default function AiAssistantModal({
  isOpen,
  onClose,
  packType,
  onApplyQuestions,
}: AiAssistantModalProps) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("웃김");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<any[] | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setCandidates(null);
    setSelectedIndices(new Set());

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packType,
          topic: topic.trim(),
          tone,
          count,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.questions)) {
        setCandidates(data.questions);
        // 기본으로 전체 선택
        setSelectedIndices(new Set(data.questions.map((_: any, idx: number) => idx)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleApply = () => {
    if (!candidates) return;
    const selected = candidates.filter((_, idx) => selectedIndices.has(idx));
    if (selected.length > 0) {
      onApplyQuestions(selected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md rounded-3xl bg-[#1c1d2c] border border-[#2c2e44] shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col justify-between">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-2 border-b border-[#2c2e44]">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm">
            <Sparkles className="w-4 h-4 text-[#FFA834]" />
            <span>AI 질문 생성 도우미</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 컨텐츠 본문 */}
        <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {!candidates ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300">
                  어떤 주제로 만들고 싶나요?
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="예: 회사 동료 밸런스, 대학 동기 찐친 고사, 여행 취향"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14151f] border border-[#2a2c40] text-white text-xs font-semibold focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">분위기</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#14151f] border border-[#2a2c40] text-white text-xs font-semibold focus:outline-none focus:border-[#FF6B35]"
                  >
                    <option value="웃김">🤣 빵 터지는/유쾌한</option>
                    <option value="솔직">🤫 솔직/은밀한</option>
                    <option value="감성">💌 따뜻한/감성적인</option>
                    <option value="매운맛">🌶️ 극한/매운맛</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">질문 수</label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#14151f] border border-[#2a2c40] text-white text-xs font-semibold focus:outline-none focus:border-[#FF6B35]"
                  >
                    <option value={3}>3문제 (빠른 놀이)</option>
                    <option value={5}>5문제 (추천)</option>
                    <option value={10}>10문제 (정밀 테스트)</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-gray-400">
                * AI가 주제에 맞는 재미있는 질문 후보들을 즉시 제안해 드립니다.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">생성된 질문 후보 ({candidates.length}개)</span>
                <span className="text-[11px] text-[#FFA834] font-semibold">
                  원하는 질문을 체크하세요
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {candidates.map((q, idx) => {
                  const isSelected = selectedIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelect(idx)}
                      className={`cursor-pointer p-3 rounded-2xl border text-xs space-y-1.5 transition-all touch-active ${
                        isSelected
                          ? "bg-orange-500/15 border-[#FF6B35] text-white"
                          : "bg-[#14151f] border-[#2a2c40] text-gray-400"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>Q{idx + 1}. {q.question}</span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center ${
                            isSelected ? "bg-[#FF6B35] text-white" : "border border-gray-600"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      {q.options && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {q.options.map((opt: string, oIdx: number) => (
                            <span
                              key={oIdx}
                              className="px-2 py-0.5 rounded-lg bg-[#25273c] text-[10px] text-gray-300"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="pt-2">
          {!candidates ? (
            <button
              type="button"
              disabled={!topic.trim() || loading}
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 disabled:opacity-40 transition-all touch-active"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>질문 생성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>질문 후보 생성하기</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCandidates(null)}
                className="flex-1 py-3 px-3 rounded-2xl bg-[#25273c] text-gray-300 font-bold text-xs hover:text-white transition-colors"
              >
                다시 생성
              </button>
              <button
                type="button"
                disabled={selectedIndices.size === 0}
                onClick={handleApply}
                className="flex-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFA834] text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 disabled:opacity-40 transition-all touch-active"
              >
                선택한 질문 적용하기 ({selectedIndices.size}개)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
