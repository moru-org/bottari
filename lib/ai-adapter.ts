import { PackType } from "./pack-types";

export interface AiQuestionCandidate {
  question: string;
  options: string[];
}

export interface AiSuggestRequest {
  packType: PackType;
  topic: string;
  tone?: string;
  count?: number;
}

// 고품질 오프라인 Fallback 프리셋 (LLM 장애 / 타임아웃 시 100% 안전 보장)
const FALLBACK_PRESETS: Record<string, AiQuestionCandidate[]> = {
  friend_quiz: [
    { question: "내가 가장 좋아하는 힐링 푸드는?", options: ["바삭한 치킨", "얼큰한 떡볶이", "고소한 삼겹살", "신선한 초밥"] },
    { question: "카페에서 주로 고르는 디저트는?", options: ["꾸덕한 초코 케이크", "부드러운 티라미수", "바삭한 크로플", "소금빵"] },
    { question: "주말 약속이 취소되었을 때 나의 속마음은?", options: ["속으로 만세 부르며 침대 눕기", "너무 아쉬워서 다른 친구 찾기"] },
    { question: "노래방 가면 나는 어떤 스타일?", options: ["마이크 독점 메인보컬", "호응 전문 탬버린 요정", "조용히 팝송 예약", "발라드 감성파"] },
    { question: "더 선호하는 휴식 방식은?", options: ["혼자 OTT 몰아보기", "친구들과 카페 수다", "자연 속 드라이브", "하루 종일 꿀잠"] },
  ],
  guess_me: [
    { question: "평생 하나만 먹어야 한다면?", options: ["평생 고기만 먹기", "평생 탄수화물(빵/밥/면)만 먹기"] },
    { question: "더 참기 힘든 것은?", options: ["배터리 1% 스마트폰", "신발에 모래 들어가서 걷기"] },
    { question: "초능력을 가질 수 있다면?", options: ["순간이동 능력", "마음을 읽는 독심술"] },
    { question: "로또 1등에 당첨된다면?", options: ["주변에 알리지 않고 조용히 산다", "가까운 찐친들에게 한턱 크게 쏜다"] },
    { question: "여행 갈 때 숙소 취향은?", options: ["감성 넘치는 독채 풀빌라", "잠만 자는 가성비 호텔"] },
  ],
  first_impression: [
    { question: "나의 첫인상은 어땠어?", options: ["도도하고 시크해 보임", "친근하고 다정해 보임", "차분하고 조용해 보임", "장난기 넘치고 유쾌함"] },
    { question: "나를 색깔로 표현한다면?", options: ["열정적인 레드", "포근한 파스텔 블루", "통통 튀는 옐로우", "시크한 블랙/모노톤"] },
    { question: "내가 회사/학교에서 맡을 것 같은 역할은?", options: ["분위기 메이커", "든든한 해결사 리더", "세심한 서포터", "창의적인 아이디어 뱅크"] },
  ],
  balance: [
    { question: "둘 중 더 최악의 상황은?", options: ["사계절 내내 모기 있는 여름", "눈 펑펑 쏟아지는 영하 20도 겨울"] },
    { question: "더 원하는 직장은?", options: ["월급 300 칼퇴 & 노터치", "월급 600 매일 야근 & 성과 압박"] },
    { question: "데이트 중 더 당황스러운 순간은?", options: ["음식에 머리카락 나옴", "지갑 안 가져와서 상대가 결제"] },
    { question: "평생 하나만 포기한다면?", options: ["평생 카톡/SNS 없이 살기", "평생 유튜브/넷플릭스 없이 살기"] },
  ],
  anonymous_feedback: [
    { question: "나에게 전하고 싶은 솔직한 한마디를 적어줘!", options: [] },
  ],
};

/**
 * GoVail Gateway / LLM 추론 호출 어댑터
 */
export async function suggestQuestionsWithGoVail(
  req: AiSuggestRequest
): Promise<AiQuestionCandidate[]> {
  const { packType, topic, tone = "웃김", count = 5 } = req;

  // GoVail LLM Gateway 엔드포인트 (환경변수 또는 로컬 게이트웨이)
  const gatewayUrl =
    process.env.GOVAIL_GATEWAY_URL ||
    process.env.LLM_GATEWAY_URL ||
    "http://127.0.0.1:8000/v1/chat/completions";

  const systemPrompt = `You are Bottari AI question generator.
Generate ${count} fun, social, lightweight Korean questions for a pack type "${packType}" based on topic "${topic}" with tone "${tone}".
Return ONLY a valid JSON object in the exact format:
{
  "questions": [
    {
      "question": "질문 내용",
      "options": ["선택지 1", "선택지 2"]
    }
  ]
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5초 타임아웃

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GOVAIL_API_KEY || "govail-local-key"}`,
      },
      body: JSON.stringify({
        model: process.env.GOVAIL_MODEL || "qwen3.6-coder",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Topic: ${topic}, Tone: ${tone}, Count: ${count}` },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (rawContent) {
        const parsed = JSON.parse(rawContent);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return parsed.questions;
        }
      }
    }
  } catch (err) {
    // GoVail 오프라인 / 에러 시 폴백 프리셋으로 무결성 보장
    console.warn("GoVail Gateway unavailable, using fallback preset:", err);
  }

  // Fallback 프리셋 반환
  const presets = FALLBACK_PRESETS[packType] || FALLBACK_PRESETS.friend_quiz;
  return presets.slice(0, count);
}
