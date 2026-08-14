export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
}

export interface QuizPayload {
  questions: QuizQuestion[];
}

export interface PlayQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface PlayPayload {
  questions: PlayQuestion[];
}

export interface BottariView {
  id: string;
  slug: string;
  title: string;
  type: string;
  questionCount: number;
  isOwner?: boolean;
  createdAt: string;
}

export interface BottariPlayData {
  id: string;
  slug: string;
  title: string;
  type: string;
  questions: PlayQuestion[];
  createdAt: string;
}

export interface QuestionFeedback {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  gradeTitle: string;
  gradeMessage: string;
  questionsFeedback: QuestionFeedback[];
}

export type BottariEventType =
  | "bottari_created"
  | "bottari_opened"
  | "play_started"
  | "question_answered"
  | "play_completed"
  | "share_clicked"
  | "link_copied"
  | "reaction_created"
  | "create_from_result_clicked"
  | "login_started"
  | "anonymous_bottari_claimed"
  | "content_viewed"
  | "result_viewed";

export interface BottariStats {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  views: number;
  starts: number;
  completes: number;
  completionRate: number;
  avgScore: number;
  shares: number;
  reactions?: Record<string, number>;
  createAfterPlayCount?: number;
  viralConversionRate?: number;
  mostFailedQuestion?: {
    question: string;
    failRate: number;
    failedCount: number;
  } | null;
  perfectScoreCount: number;
}

export interface UserSession {
  id: string;
  provider: string;
  providerUserId: string;
  name: string;
  avatar?: string;
}

export interface OwnerTokenItem {
  slug: string;
  token: string;
  createdAt?: string;
}
