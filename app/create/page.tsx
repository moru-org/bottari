"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Shuffle,
  ArrowLeft,
  Loader2,
  Sparkles,
  Send,
  Copy,
  Check,
  MessageCircle,
  Eye,
  Scale,
  Heart,
  Zap,
} from "lucide-react";
import { GOLDEN_PACK_TEMPLATES, TEMPLATE_CATEGORIES } from "@/data/pack-templates";
import {
  PackDefinition,
  PackType,
  CategoryType,
  FriendQuizConfig,
  GuessMeConfig,
  FirstImpressionConfig,
  BalanceConfig,
} from "@/lib/pack-types";
import { saveOwnerToken } from "@/lib/storage";
import { getShareUrl } from "@/lib/config";
import AiAssistantModal from "@/components/pack-creator/AiAssistantModal";

function CreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralId = searchParams.get("ref");
  const templateSlugParam = searchParams.get("template");

  // 1. 현재 선택된 템플릿 / 팩 타입
  const [selectedType, setSelectedType] = useState<PackType>("friend_quiz");
  const [creatorName, setCreatorName] = useState("");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎁");

  // 2. 팩 타입별 편집 데이터 (Discriminated definition state)
  const [currentDefinition, setCurrentDefinition] = useState<PackDefinition>(
    JSON.parse(JSON.stringify(GOLDEN_PACK_TEMPLATES[0].definition))
  );

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // 생성 완료 상태
  const [createdData, setCreatedData] = useState<{
    slug: string;
    title: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // 초기 템플릿 로드
  useEffect(() => {
    if (templateSlugParam) {
      const found = GOLDEN_PACK_TEMPLATES.find((t) => t.slug === templateSlugParam);
      if (found) {
        applyTemplateSnapshot(found.definition);
      }
    }
  }, [templateSlugParam]);

  const applyTemplateSnapshot = (def: PackDefinition) => {
    const clone: PackDefinition = JSON.parse(JSON.stringify(def));
    setSelectedType(clone.type);
    setTitle(clone.title);
    setEmoji(clone.emoji || "🎁");
    setCurrentDefinition(clone);
  };

  const handleSelectTemplateType = (type: PackType) => {
    setSelectedType(type);
    const matched = GOLDEN_PACK_TEMPLATES.find((t) => t.type === type) || GOLDEN_PACK_TEMPLATES[0];
    applyTemplateSnapshot(matched.definition);
  };

  const handleNameChange = (name: string) => {
    setCreatorName(name);
    if (name.trim()) {
      if (selectedType === "friend_quiz") setTitle(`${name.trim()}의 찐친 고사`);
      else if (selectedType === "guess_me") setTitle(`${name.trim()}가 고를 것 맞혀봐`);
      else if (selectedType === "first_impression") setTitle(`${name.trim()}의 첫인상 & 이미지`);
      else if (selectedType === "anonymous_feedback") setTitle(`${name.trim()}에게 익명으로 한마디 💌`);
      else if (selectedType === "balance") setTitle(`${name.trim()}의 밸런스 게임`);
    }
  };

  // Friend Quiz 정답 설정
  const setQuizAnswer = (qIdx: number, optIdx: number) => {
    if (currentDefinition.config.type !== "friend_quiz") return;
    const nextDef = JSON.parse(JSON.stringify(currentDefinition)) as PackDefinition;
    if (nextDef.config.type === "friend_quiz") {
      nextDef.config.questions[qIdx].answerIndex = optIdx;
      setCurrentDefinition(nextDef);
    }
  };

  // Guess Me 정답 설정
  const setGuessAnswer = (qIdx: number, optIdx: number) => {
    if (currentDefinition.config.type !== "guess_me") return;
    const nextDef = JSON.parse(JSON.stringify(currentDefinition)) as PackDefinition;
    if (nextDef.config.type === "guess_me") {
      nextDef.config.questions[qIdx].creatorChoiceIndex = optIdx;
      setCurrentDefinition(nextDef);
    }
  };

  // 질문 텍스트 변경
  const updateQuestionText = (qIdx: number, text: string) => {
    const nextDef = JSON.parse(JSON.stringify(currentDefinition)) as PackDefinition;
    if (nextDef.config.type === "friend_quiz" || nextDef.config.type === "guess_me" || nextDef.config.type === "first_impression") {
      nextDef.config.questions[qIdx].question = text;
      setCurrentDefinition(nextDef);
    } else if (nextDef.config.type === "balance") {
      nextDef.config.questions[qIdx].question = text;
      setCurrentDefinition(nextDef);
    } else if (nextDef.config.type === "anonymous_feedback") {
      nextDef.config.question.prompt = text;
      setCurrentDefinition(nextDef);
    }
  };

  // 선택지 텍스트 변경
  const updateOptionText = (qIdx: number, optIdx: number, text: string) => {
    const nextDef = JSON.parse(JSON.stringify(currentDefinition)) as PackDefinition;
    if (nextDef.config.type === "friend_quiz" || nextDef.config.type === "guess_me" || nextDef.config.type === "first_impression") {
      nextDef.config.questions[qIdx].options[optIdx] = text;
      setCurrentDefinition(nextDef);
    } else if (nextDef.config.type === "balance") {
      if (optIdx === 0) nextDef.config.questions[qIdx].optionA = text;
      else nextDef.config.questions[qIdx].optionB = text;
      setCurrentDefinition(nextDef);
    }
  };

  // AI 생성 질문 적용
  const handleApplyAiQuestions = (aiQuestions: any[]) => {
    const nextDef = JSON.parse(JSON.stringify(currentDefinition)) as PackDefinition;

    if (nextDef.config.type === "friend_quiz") {
      const formatted = aiQuestions.map((q, idx) => ({
        id: `ai_q_${Date.now()}_${idx}`,
        question: q.question,
        options: q.options || ["보기 1", "보기 2"],
        answerIndex: 0,
      }));
      nextDef.config.questions = formatted;
    } else if (nextDef.config.type === "guess_me") {
      const formatted = aiQuestions.map((q, idx) => ({
        id: `ai_g_${Date.now()}_${idx}`,
        question: q.question,
        options: q.options || ["보기 1", "보기 2"],
        creatorChoiceIndex: 0,
      }));
      nextDef.config.questions = formatted;
    } else if (nextDef.config.type === "first_impression") {
      const formatted = aiQuestions.map((q, idx) => ({
        id: `ai_i_${Date.now()}_${idx}`,
        question: q.question,
        options: q.options || ["항목 1", "항목 2", "항목 3", "항목 4"],
      }));
      nextDef.config.questions = formatted;
    } else if (nextDef.config.type === "balance") {
      const formatted = aiQuestions.map((q, idx) => ({
        id: `ai_b_${Date.now()}_${idx}`,
        question: q.question,
        optionA: q.options?.[0] || "선택 A",
        optionB: q.options?.[1] || "선택 B",
      }));
      nextDef.config.questions = formatted;
    }

    setCurrentDefinition(nextDef);
  };

  // 질문 추가
  const addQuestion = () => {
    const nextDef = JSON.parse(JSON.stringify(currentDefinition)) as PackDefinition;

    if (nextDef.config.type === "friend_quiz") {
      if (nextDef.config.questions.length >= 10) return;
      nextDef.config.questions.push({
        id: `q_${Date.now()}`,
        question: "새 질문을 입력하세요",
        options: ["선택지 1", "선택지 2"],
        answerIndex: 0,
      });
    } else if (nextDef.config.type === "guess_me") {
      if (nextDef.config.questions.length >= 10) return;
      nextDef.config.questions.push({
        id: `g_${Date.now()}`,
        question: "내가 고를 것은?",
        options: ["선택지 1", "선택지 2"],
        creatorChoiceIndex: 0,
      });
    } else if (nextDef.config.type === "first_impression") {
      if (nextDef.config.questions.length >= 10) return;
      nextDef.config.questions.push({
        id: `i_${Date.now()}`,
        question: "친구들이 보는 나의 모습은?",
        options: ["보기 1", "보기 2", "보기 3", "보기 4"],
      });
    } else if (nextDef.config.type === "balance") {
      if (nextDef.config.questions.length >= 10) return;
      nextDef.config.questions.push({
        id: `b_${Date.now()}`,
        question: "둘 중 더 참기 힘든 것은?",
        optionA: "선택 A",
        optionB: "선택 B",
      });
    }

    setCurrentDefinition(nextDef);
  };

  // 질문 삭제
  const removeQuestion = (index: number) => {
    const nextDef = JSON.parse(JSON.stringify(currentDefinition)) as PackDefinition;
    if (nextDef.config.type === "anonymous_feedback") return;

    if (nextDef.config.questions.length <= 1) {
      setErrorMsg("최소 1개 이상의 질문이 필요합니다.");
      return;
    }

    if (nextDef.config.type === "friend_quiz") {
      nextDef.config.questions = nextDef.config.questions.filter((_, idx) => idx !== index);
    } else if (nextDef.config.type === "guess_me") {
      nextDef.config.questions = nextDef.config.questions.filter((_, idx) => idx !== index);
    } else if (nextDef.config.type === "first_impression") {
      nextDef.config.questions = nextDef.config.questions.filter((_, idx) => idx !== index);
    } else if (nextDef.config.type === "balance") {
      nextDef.config.questions = nextDef.config.questions.filter((_, idx) => idx !== index);
    }
    setCurrentDefinition(nextDef);
  };

  // 보따리 생성 요청
  const handleCreate = async () => {
    setErrorMsg(null);
    const finalTitle = title.trim() || currentDefinition.title || "새 보따리";

    const payloadDefinition: PackDefinition = {
      ...currentDefinition,
      title: finalTitle,
      emoji,
      config: {
        ...currentDefinition.config,
        creatorName: creatorName.trim() || undefined,
      },
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/bottari", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: finalTitle,
            emoji,
            type: selectedType,
            definition: payloadDefinition,
            referralId: referralId || null,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.error || "보따리 생성에 실패했습니다.");
          return;
        }

        if (data.ownerToken) {
          saveOwnerToken(data.slug, data.ownerToken);
        }

        setCreatedData({
          slug: data.slug,
          title: data.title,
        });
      } catch (err) {
        console.error(err);
        setErrorMsg("네트워크 오류가 발생했습니다.");
      }
    });
  };

  // 공유 액션
  const shareUrl = createdData ? getShareUrl(createdData.slug) : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      fetch(`/api/bottari/${createdData?.slug}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "link_copied" }),
      }).catch(() => {});
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (!createdData || !shareUrl) return;
    fetch(`/api/bottari/${createdData.slug}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "share_clicked" }),
    }).catch(() => {});

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `🎁 ${createdData.title}`,
          text: `친구야, 30초 보따리 풀어봐! 🎁`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  // --- 화면 1: 생성 완료 및 공유 전용 화면 ---
  if (createdData) {
    return (
      <div className="flex-1 flex flex-col justify-between py-4 space-y-6 select-none animate-fade-in">
        <div className="space-y-6 pt-2 text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FF6B35] to-[#FFA834] flex items-center justify-center mx-auto shadow-xl shadow-orange-500/25 animate-scale-up">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              보따리가 완성되었어요! 🎁
            </h1>
            <p className="text-sm text-gray-300">
              <span className="font-bold text-[#FFA834]">&quot;{createdData.title}&quot;</span>
            </p>
            <p className="text-xs text-gray-400">
              친구들에게 공유하고 실시간 반응을 확인해보세요!
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2.5 py-4 px-5 rounded-2xl bg-[#FEE500] hover:bg-[#ebd300] text-[#191919] font-extrabold text-base shadow-lg shadow-yellow-500/10 transition-all touch-active"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>카카오톡 / DM으로 바로 보내기</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-between py-3.5 px-4 rounded-2xl bg-[#1c1d2c] hover:bg-[#25273c] text-white border border-[#2c2e44] font-medium text-xs transition-all touch-active"
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
        </div>

        <div className="space-y-2.5 pt-4 pb-2">
          <Link
            href={`/p/${createdData.slug}`}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#25273c] hover:bg-[#2e314a] text-white font-bold text-sm border border-[#343752] transition-all touch-active"
          >
            <Eye className="w-4 h-4 text-[#FFA834]" />
            <span>내 보따리 직접 풀어보기</span>
          </Link>

          <Link
            href="/my"
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            <span>내 보따리 보관함으로 가기 →</span>
          </Link>
        </div>
      </div>
    );
  }

  // --- 화면 2: 생성 에디터 화면 ---
  return (
    <div className="flex-1 flex flex-col py-2 space-y-5 select-none animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-[#FFA834] bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
          30초 뚝딱 보따리 만들기
        </span>
        <div className="w-5" />
      </div>

      {/* 5대 놀이 타입 선택 탭 */}
      <div className="space-y-1.5">
        <span className="text-xs font-extrabold text-gray-300">놀이 방식 선택</span>
        <div className="grid grid-cols-5 gap-1">
          <button
            type="button"
            onClick={() => handleSelectTemplateType("friend_quiz")}
            className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-0.5 border text-xs font-bold transition-all ${
              selectedType === "friend_quiz"
                ? "bg-orange-500/20 border-[#FF6B35] text-white"
                : "bg-[#181926] border-[#252738] text-gray-400"
            }`}
          >
            <span>🏆</span>
            <span className="text-[10px]">친구퀴즈</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTemplateType("guess_me")}
            className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-0.5 border text-xs font-bold transition-all ${
              selectedType === "guess_me"
                ? "bg-orange-500/20 border-[#FF6B35] text-white"
                : "bg-[#181926] border-[#252738] text-gray-400"
            }`}
          >
            <span>🎯</span>
            <span className="text-[10px]">맞혀봐</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTemplateType("first_impression")}
            className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-0.5 border text-xs font-bold transition-all ${
              selectedType === "first_impression"
                ? "bg-orange-500/20 border-[#FF6B35] text-white"
                : "bg-[#181926] border-[#252738] text-gray-400"
            }`}
          >
            <span>👀</span>
            <span className="text-[10px]">첫인상</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTemplateType("balance")}
            className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-0.5 border text-xs font-bold transition-all ${
              selectedType === "balance"
                ? "bg-orange-500/20 border-[#FF6B35] text-white"
                : "bg-[#181926] border-[#252738] text-gray-400"
            }`}
          >
            <span>⚖️</span>
            <span className="text-[10px]">밸런스</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTemplateType("anonymous_feedback")}
            className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-0.5 border text-xs font-bold transition-all ${
              selectedType === "anonymous_feedback"
                ? "bg-orange-500/20 border-[#FF6B35] text-white"
                : "bg-[#181926] border-[#252738] text-gray-400"
            }`}
          >
            <span>💌</span>
            <span className="text-[10px]">익명한마디</span>
          </button>
        </div>
      </div>

      {/* 작성자 정보 및 제목 */}
      <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-300">내 닉네임</label>
          <input
            type="text"
            value={creatorName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="친구들이 알아볼 수 있는 이름 (예: 민수, 밍키)"
            maxLength={15}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#14151f] border border-[#2a2c40] text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF6B35]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-300">보따리 제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="보따리 제목을 입력하세요"
            maxLength={30}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#14151f] border border-[#2a2c40] text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF6B35]"
          />
        </div>
      </div>

      {/* AI 질문 도우미 버튼 */}
      {selectedType !== "anonymous_feedback" && (
        <button
          type="button"
          onClick={() => setShowAiModal(true)}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600/20 to-orange-600/20 border border-orange-500/30 text-[#FFA834] text-xs font-extrabold flex items-center justify-center gap-2 hover:opacity-90 transition-all touch-active"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI로 원하는 주제 질문 한 번에 생성하기 ✨</span>
        </button>
      )}

      {/* 질문 및 선택지 편집 영역 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-white">
            질문 및 선택지 편집
          </h2>
          {selectedType === "friend_quiz" && (
            <span className="text-[11px] text-[#FFA834] font-semibold">
              * 내 정답인 보기를 터치하세요!
            </span>
          )}
          {selectedType === "guess_me" && (
            <span className="text-[11px] text-[#FFA834] font-semibold">
              * 내가 선택한 보기를 터치하세요!
            </span>
          )}
        </div>

        {/* 1. Friend Quiz / Guess Me / First Impression */}
        {(currentDefinition.config.type === "friend_quiz" ||
          currentDefinition.config.type === "guess_me" ||
          currentDefinition.config.type === "first_impression") && (
          <>
            {currentDefinition.config.questions.map((q, qIdx) => {
              const config = currentDefinition.config as
                | FriendQuizConfig
                | GuessMeConfig
                | FirstImpressionConfig;
              const answerIdx =
                config.type === "friend_quiz"
                  ? (q as any).answerIndex
                  : config.type === "guess_me"
                  ? (q as any).creatorChoiceIndex
                  : null;

              return (
                <div
                  key={q.id || qIdx}
                  className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] shadow-md space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#FFA834]">Q{qIdx + 1}</span>
                    {config.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="p-1 rounded-lg text-gray-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#14151f] border border-[#2a2c40] text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF6B35]"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answerIdx === optIdx;
                      return (
                        <div
                          key={optIdx}
                          onClick={() => {
                            if (currentDefinition.config.type === "friend_quiz") setQuizAnswer(qIdx, optIdx);
                            else if (currentDefinition.config.type === "guess_me") setGuessAnswer(qIdx, optIdx);
                          }}
                          className={`cursor-pointer p-2.5 rounded-xl border transition-all touch-active flex flex-col justify-between ${
                            isSelected
                              ? "bg-orange-500/20 border-[#FF6B35] text-white shadow-sm shadow-orange-500/20"
                              : "bg-[#14151f] border-[#2a2c40] text-gray-400 hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-gray-400">
                              보기 {optIdx + 1}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-0.5 text-[10px] font-black text-[#FF6B35]">
                                <CheckCircle2 className="w-3 h-3 fill-current" />
                                <span>내 선택</span>
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={opt}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                            className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* 2. Balance Game */}
        {currentDefinition.config.type === "balance" && (
          <>
            {(currentDefinition.config as BalanceConfig).questions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className="p-3.5 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] shadow-md space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#FFA834]">MATCH #{qIdx + 1}</span>
                  {(currentDefinition.config as BalanceConfig).questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="p-1 rounded-lg text-gray-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#14151f] border border-[#2a2c40] text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF6B35]"
                />

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div className="p-2.5 rounded-xl bg-[#14151f] border border-[#2a2c40] space-y-1">
                    <span className="text-[10px] font-bold text-[#FF6B35]">선택 A</span>
                    <input
                      type="text"
                      value={q.optionA}
                      onChange={(e) => updateOptionText(qIdx, 0, e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#14151f] border border-[#2a2c40] space-y-1">
                    <span className="text-[10px] font-bold text-blue-400">선택 B</span>
                    <input
                      type="text"
                      value={q.optionB}
                      onChange={(e) => updateOptionText(qIdx, 1, e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* 3. Anonymous Feedback */}
        {currentDefinition.config.type === "anonymous_feedback" && (
          <div className="p-4 rounded-2xl bg-[#1c1d2c] border border-[#2c2e44] space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300">익명 메시지 질문 프롬프트</label>
              <input
                type="text"
                value={currentDefinition.config.question.prompt}
                onChange={(e) => updateQuestionText(0, e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14151f] border border-[#2a2c40] text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              * 친구들이 링크를 열었을 때 보여줄 질문입니다 (예: 나에게 하고 싶었던 말 적어줘).
            </p>
          </div>
        )}

        {/* 질문 추가 버튼 */}
        {currentDefinition.config.type !== "anonymous_feedback" && (
          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-[#2c2e44] hover:border-orange-500/50 text-gray-400 hover:text-orange-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all touch-active"
          >
            <Plus className="w-4 h-4" />
            <span>질문 1개 더 추가하기</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      {/* 하단 완성 버튼 */}
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
              <span>보따리 완성하고 링크 받기 🎁</span>
            </>
          )}
        </button>
      </div>

      <AiAssistantModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        packType={selectedType}
        onApplyQuestions={handleApplyAiQuestions}
      />
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
