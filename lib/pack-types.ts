export type PackType =
  | "friend_quiz"
  | "guess_me"
  | "first_impression"
  | "anonymous_feedback"
  | "balance";

export type CategoryType = "friend" | "love" | "balance" | "anonymous" | "fun";

export type OwnershipType = "system" | "anonymous" | "user";

export interface SubmissionPolicy {
  maxSubmissionsPerSession: number;
  allowMultiple: boolean;
}

// 1. Friend Quiz Question & Config
export interface ChoiceQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number; // Creator's true answer
  explanation?: string;
}

export interface ScoreResultRule {
  minPercentage: number;
  maxPercentage: number;
  title: string;
  message: string;
}

export interface FriendQuizConfig {
  type: "friend_quiz";
  questions: ChoiceQuestion[];
  creatorName?: string;
  resultRules: ScoreResultRule[];
}

// 2. Guess Me Question & Config
export interface GuessMeQuestion {
  id: string;
  question: string;
  options: string[];
  creatorChoiceIndex: number;
}

export interface GuessMeConfig {
  type: "guess_me";
  questions: GuessMeQuestion[];
  creatorName?: string;
  resultRules?: ScoreResultRule[];
}

// 3. First Impression Question & Config
export interface ImpressionQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface FirstImpressionConfig {
  type: "first_impression";
  questions: ImpressionQuestion[];
  creatorName?: string;
}

// 4. Anonymous Feedback Config
export interface AnonymousFeedbackQuestion {
  id: string;
  prompt: string;
  placeholder?: string;
  maxLength?: number;
}

export interface AnonymousFeedbackConfig {
  type: "anonymous_feedback";
  question: AnonymousFeedbackQuestion;
  creatorName?: string;
}

// 5. Balance Game Question & Config
export interface BalanceQuestion {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
}

export interface BalanceConfig {
  type: "balance";
  questions: BalanceQuestion[];
  creatorName?: string;
}

// Discriminator Union for Pack Payload
export type PackConfig =
  | FriendQuizConfig
  | GuessMeConfig
  | FirstImpressionConfig
  | AnonymousFeedbackConfig
  | BalanceConfig;

export interface PackDefinition {
  version: 1;
  type: PackType;
  title: string;
  description?: string;
  emoji?: string;
  config: PackConfig;
  submissionPolicy: SubmissionPolicy;
}

// Frontend Play DTO (Answer indices removed for security)
export interface PublicQuestion {
  id: string;
  question: string;
  options: string[];
  placeholder?: string;
  maxLength?: number;
}

export interface PackPlayData {
  id: string;
  slug: string;
  type: PackType;
  title: string;
  description?: string | null;
  emoji: string;
  creatorName?: string;
  status: "active" | "disabled";
  questions: PublicQuestion[];
  submissionPolicy: SubmissionPolicy;
  createdAt: string;
}

// Results
export interface QuestionFeedbackItem {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface FriendQuizResultPayload {
  type: "friend_quiz";
  score: number;
  totalQuestions: number;
  percentage: number;
  gradeTitle: string;
  gradeMessage: string;
  questionsFeedback: QuestionFeedbackItem[];
}

export interface GuessMeResultPayload {
  type: "guess_me";
  matchCount: number;
  totalQuestions: number;
  matchPercentage: number;
  gradeTitle: string;
  gradeMessage: string;
  matchesFeedback: {
    id: string;
    question: string;
    creatorChoice: string;
    userChoice: string;
    isMatched: boolean;
  }[];
}

export interface ImpressionOptionStat {
  label: string;
  votes: number;
  percentage: number;
}

export interface ImpressionDistribution {
  questionId: string;
  question: string;
  totalVotes: number;
  options: ImpressionOptionStat[];
}

export interface FirstImpressionResultPayload {
  type: "first_impression";
  selectedOption: string;
  totalResponses: number;
  distributions: ImpressionDistribution[];
  message: string;
}

export interface AnonymousFeedbackResultPayload {
  type: "anonymous_feedback";
  submitted: boolean;
  message: string;
}

export interface AnonymousFeedbackItem {
  id: string;
  message: string;
  createdAt: string;
  isHidden: boolean;
}

export interface BalanceQuestionStats {
  questionId: string;
  question: string;
  totalVotes: number;
  optionAVotes: number;
  optionAPercentage: number;
  optionBVotes: number;
  optionBPercentage: number;
  userChoiceIndex?: number;
}

export interface BalanceGameResultPayload {
  type: "balance";
  totalPlayers: number;
  questionsStats: BalanceQuestionStats[];
  message: string;
}

export type PackResultPayload =
  | FriendQuizResultPayload
  | GuessMeResultPayload
  | FirstImpressionResultPayload
  | AnonymousFeedbackResultPayload
  | BalanceGameResultPayload;

// Template Definition
export interface TemplateCategory {
  id: CategoryType;
  name: string;
  emoji: string;
  description: string;
}

export interface PackTemplateDefinition {
  slug: string;
  type: PackType;
  category: CategoryType;
  title: string;
  description: string;
  emoji: string;
  isFeatured?: boolean;
  order?: number;
  definition: PackDefinition;
}
