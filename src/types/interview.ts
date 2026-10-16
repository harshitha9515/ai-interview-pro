export type InterviewType = 
  | 'hr' 
  | 'technical' 
  | 'coding' 
  | 'aptitude' 
  | 'communication' 
  | 'placement_mixed';

export type ExperienceLevel = 
  | 'fresher' 
  | 'junior' 
  | 'mid' 
  | 'senior';

export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type InterviewMode = 'voice' | 'text';

export type AIStatus = 'idle' | 'speaking' | 'listening' | 'thinking' | 'analyzing' | 'error';

export interface QuestionTestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
}

export interface Question {
  id: string;
  category: InterviewType;
  roleSpecific?: string[];
  difficulty: QuestionDifficulty;
  question: string;
  contextHint?: string;
  expectedKeywords: string[];
  modelAnswer: string;
  source?: 'ai_generated' | 'predefined';
  isFollowUp?: boolean;
  parentQuestionId?: string;
  testCases?: QuestionTestCase[];
  rubricCriteria: {
    criterion: string;
    weight: number;
    description: string;
  }[];
}

export interface CandidateResponse {
  questionId: string;
  questionText: string;
  category: InterviewType;
  answerText: string;
  timeSpentSeconds: number;
  wordCount: number;
  audioDurationSeconds?: number;
  isFollowUp?: boolean;
  codeTestResults?: {
    total: number;
    passed: number;
    results: { input: string; expected: string; actual: string; passed: boolean }[];
  };
  evaluations?: QuestionEvaluation;
}

export interface QuestionEvaluation {
  score: number; // 0 - 100
  accuracyScore: number;
  clarityScore: number;
  depthScore: number;
  relevanceScore?: number;
  completenessScore?: number;
  reasoningScore?: number;
  codingScore?: number;
  isUnavailable?: boolean;
  unavailableReason?: string;
  suggestFollowUp?: boolean;
  followUpTopic?: string;
  matchedKeywords: string[];
  missedKeywords: string[];
  missingPoints?: string[];
  suggestedImprovedAnswer?: string;
  feedback: string;
  keyStrengths: string[];
  keyImprovements: string[];
  modelAnswer: string;
  codingTestSummary?: {
    passed: number;
    total: number;
    details?: string;
  };
}

export interface CategoryScore {
  category: string;
  score: number;
  totalQuestions: number;
  status: 'excellent' | 'good' | 'needs_work';
  criteriaDescription?: string;
}

export interface CategoryWeightInfo {
  category: string;
  weightPercent: number;
  score: number;
  weightedContribution: number;
  criteriaDescription: string;
}

export interface FeedbackSummary {
  overallSummary: string;
  readinessStatus: 'Placement Ready' | 'Promising Candidate' | 'Needs Practice' | 'Foundational Review Needed';
  strengths: string[];
  improvements: string[];
  categoryScores: CategoryScore[];
  categoryWeights?: CategoryWeightInfo[];
  recommendedTopics?: string[];
  nextPracticeRecommendation?: string;
  source?: string;
  disclaimer?: string;
}

export interface InterviewSession {
  id: string;
  createdAt: string;
  candidateName: string;
  userName?: string;
  role: string;
  type: InterviewType;
  experienceLevel: ExperienceLevel;
  language: string;
  difficulty: QuestionDifficulty;
  mode: InterviewMode;
  durationMinutes: number;
  totalQuestions: number;
  completedAt?: string;
  overallScore?: number;
  status: 'draft' | 'in_progress' | 'completed' | 'abandoned';
  questions: Question[];
  responses: CandidateResponse[];
  feedbackSummary?: FeedbackSummary;
}

export interface UserSettings {
  language: string;
  voiceURI: string;
  voicePitch: number;
  voiceRate: number;
  voiceVolume: number;
  autoSpeakQuestions: boolean;
  theme: 'dark-navy' | 'cyber-cyan' | 'midnight-violet';
  micDeviceId: string;
  aiProvider: 'built-in' | 'gemini';
  geminiApiKey?: string;
  sttProvider: 'browser-native' | 'cloud-whisper';
  whisperApiKey?: string;
  enableSoundEffects: boolean;
  hapticFeedback: boolean;
}

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';
export type SpeechState = 'stopped' | 'speaking' | 'paused';
export type RecordingState = 'inactive' | 'requesting' | 'recording' | 'processing' | 'error';


export interface InterviewCategoryMeta {
  id: InterviewType;
  title: string;
  description: string;
  icon: string;
  badge: string;
  recommendedDuration: number;
  skillsCovered: string[];
  gradient: string;
}
