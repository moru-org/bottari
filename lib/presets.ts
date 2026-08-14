export interface PresetQuestion {
  id?: string;
  category?: string;
  question: string;
  options: string[];
  defaultAnswerIndex?: number;
}

export interface PresetCategory {
  id: string;
  name: string;
  emoji: string;
  questions: PresetQuestion[];
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    id: "food",
    name: "음식",
    emoji: "🍗",
    questions: [
      {
        question: "내가 더 좋아하는 야식은?",
        options: ["🍗 바삭한 치킨", "🍕 치즈 듬뿍 피자"],
        defaultAnswerIndex: 0,
      },
      {
        question: "카페 가면 주로 시키는 음료는?",
        options: ["☕ 시원한 얼죽아", "🥤 달달한 라떼/스무디"],
        defaultAnswerIndex: 0,
      },
      {
        question: "탕수육 먹을 때 내 스타일은?",
        options: ["바삭하게 찍먹", "촉촉하게 부먹"],
        defaultAnswerIndex: 0,
      },
      {
        question: "라면 끓일 때 면 상태는?",
        options: ["쫄깃한 꼬들면", "부드러운 퍼진면"],
        defaultAnswerIndex: 0,
      },
      {
        question: "민트초코에 대한 나의 입장은?",
        options: ["🌿 완전 극호 (맛잘알)", "🪥 치약맛 불호"],
        defaultAnswerIndex: 0,
      },
    ],
  },
  {
    id: "lifestyle",
    name: "성격·일상",
    emoji: "⚡",
    questions: [
      {
        question: "주말에 나를 만나려면?",
        options: ["🏠 집 침대에서 충전 중", "🌳 핫플 카페나 나들이"],
        defaultAnswerIndex: 0,
      },
      {
        question: "여행 갈 때 나의 스타일은?",
        options: ["📋 분 단위 계획 파워 J", "🗺️ 발길 닿는 대로 즉흥 P"],
        defaultAnswerIndex: 1,
      },
      {
        question: "문자/카톡 답장 스타일은?",
        options: ["⚡ 1초 만에 칼답", "💭 읽고 마음으로 답장(3시간 뒤)"],
        defaultAnswerIndex: 0,
      },
      {
        question: "아침 기상 알람 스타일은?",
        options: ["⏰ 1번에 칼기상", "📱 1분 간격 10개 맞춤"],
        defaultAnswerIndex: 1,
      },
      {
        question: "스트레스 받을 때 푸는 법은?",
        options: ["🛌 혼자 넷플릭스 보며 자기", "🎉 친구들 만나 수다 떨기"],
        defaultAnswerIndex: 0,
      },
    ],
  },
  {
    id: "taste",
    name: "취향",
    emoji: "🎧",
    questions: [
      {
        question: "더 선호하는 음악 장르는?",
        options: ["🎧 감성 발라드/인디", "🔥 신나는 힙합/댄스"],
        defaultAnswerIndex: 1,
      },
      {
        question: "놀이공원 가면 타는 기구는?",
        options: ["🎢 롤러코스터 맨 앞자리", "🎠 회전목마나 구경"],
        defaultAnswerIndex: 0,
      },
      {
        question: "영화관에서 볼 영화 장르는?",
        options: ["🍿 손에 땀 쥐는 스릴러/액션", "💧 눈물 펑펑 로맨스/드라마"],
        defaultAnswerIndex: 0,
      },
      {
        question: "선호하는 계절은?",
        options: ["❄️ 차가운 겨울", "☀️ 따뜻한 여름"],
        defaultAnswerIndex: 0,
      },
      {
        question: "평소 선호하는 패션 스타일은?",
        options: ["👟 편안한 꾸안꾸 캐주얼", "✨ 각 잡힌 꾸꾸꾸 룩"],
        defaultAnswerIndex: 0,
      },
    ],
  },
  {
    id: "balance",
    name: "밸런스",
    emoji: "⚖️",
    questions: [
      {
        question: "평생 하나만 먹어야 한다면?",
        options: ["🍗 평생 치킨만 먹기", "🍕 평생 피자만 먹기"],
        defaultAnswerIndex: 0,
      },
      {
        question: "둘 중 더 참기 힘든 것은?",
        options: ["📵 스마트폰 없이 3일", "🤐 말 한마디 없이 3일"],
        defaultAnswerIndex: 0,
      },
      {
        question: "약속 시간 늦었을 때 나의 반응은?",
        options: ["🙇‍♂️ 5분 전부터 발 동동 사죄", "😎 당당하고 자연스럽게 합류"],
        defaultAnswerIndex: 0,
      },
      {
        question: "더 부러운 초능력은?",
        options: ["⏳ 시간 되돌리기", "🚀 공간 순간이동"],
        defaultAnswerIndex: 1,
      },
      {
        question: "10억 받기 vs 평생 건강하기?",
        options: ["💰 당장 현금 10억 받기", "💪 100살까지 안 아프기"],
        defaultAnswerIndex: 0,
      },
    ],
  },
];

// Flat list for compatibility
export const PRESET_QUESTIONS: PresetQuestion[] = PRESET_CATEGORIES.flatMap((c) => c.questions);
