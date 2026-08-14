export interface PresetQuestion {
  question: string;
  options: string[];
  defaultAnswerIndex?: number;
}

export const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    question: "내가 더 좋아하는 야식은?",
    options: ["바삭한 치킨", "치즈 듬뿍 피자"],
    defaultAnswerIndex: 0,
  },
  {
    question: "주말에 나를 만나려면?",
    options: ["집에서 충전 중인 침대", "핫플 카페나 야외 나들이"],
    defaultAnswerIndex: 0,
  },
  {
    question: "여행을 떠날 때 나의 스타일은?",
    options: ["분 단위로 짜인 파워 J", "발길 닿는 대로 즐기는 즉흥 P"],
    defaultAnswerIndex: 1,
  },
  {
    question: "약속 시간에 늦었을 때 나의 반응은?",
    options: ["5분 전부터 발 동동 구르며 사죄", "당당하고 자연스럽게 합류"],
    defaultAnswerIndex: 0,
  },
  {
    question: "더 선호하는 음악 장르는?",
    options: ["감성 터지는 잔잔한 발라드/인디", "심장 뛰는 신나는 힙합/댄스"],
    defaultAnswerIndex: 1,
  },
  {
    question: "카페에 가면 주로 마시는 음료는?",
    options: ["시원한 얼죽아 (아이스 아메리카노)", "달달하고 묵직한 라떼/스무디"],
    defaultAnswerIndex: 0,
  },
  {
    question: "스트레스 받을 때 해소하는 법은?",
    options: ["혼자 넷플릭스 보며 푹 자기", "친구들과 만나 수다 떨며 매운 음식 먹기"],
    defaultAnswerIndex: 0,
  },
  {
    question: "놀이기구를 탈 때 나의 모습은?",
    options: ["스릴 만점 롤러코스터 맨 앞자리", "안전제일 회전목마나 구경하기"],
    defaultAnswerIndex: 0,
  },
  {
    question: "문자/카톡 답장 스타일은?",
    options: ["보자마자 1초 만에 칼답", "읽고 마음속으로 답장하다 3시간 뒤"],
    defaultAnswerIndex: 0,
  },
  {
    question: "아침에 일어났을 때 나의 알람은?",
    options: ["첫 알람 1번에 칼같이 기상", "1분 간격으로 10개 맞춰둠"],
    defaultAnswerIndex: 1,
  },
];
