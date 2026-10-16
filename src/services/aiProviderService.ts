/**
 * AI Provider Service — Frontend Client
 * ======================================
 * Communicates with the backend AI server (/api/*).
 * Never holds or exposes API keys.
 * Falls back to local multilingual question bank if server is unreachable.
 */

import { Question, QuestionEvaluation, InterviewSession, FeedbackSummary, CandidateResponse, InterviewType, QuestionDifficulty, ExperienceLevel } from '../types/interview';
import { getMultilingualQuestions } from '../data/multilingualQuestionBank';
import { aiEvaluatorService } from './aiEvaluator';
import { roleQuestionEngine, createQuestionSignature } from './roleQuestionEngine';

/**
 * Resolves the backend endpoint URL.
 * Supports configurable VITE_API_BASE_URL or VITE_API_URL environment variables
 * for cross-origin production deployments (e.g., Vercel frontend + Render backend),
 * falling back to local relative '/api' proxy for Vite dev server.
 */
function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const envUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    ''
  ).trim();

  if (!envUrl) {
    return `/api${normalizedPath}`;
  }

  const base = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  if (base.endsWith('/api')) {
    return `${base}${normalizedPath}`;
  }
  return `${base}/api${normalizedPath}`;
}

const DEFAULT_TIMEOUT_MS = 20000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIStatusResponse {
  provider: 'gemini' | 'openai' | 'fallback';
  isLive: boolean;
  model: string | null;
  message: string;
}

export interface GenerateQuestionParams {
  candidateName?: string;
  category: InterviewType;
  role: string;
  difficulty: QuestionDifficulty;
  experienceLevel: ExperienceLevel;
  language: string;
  questionNumber: number;
  totalQuestions: number;
  history: Array<{ num: number; question: string; category: string }>;
  sessionId: string;
}

export interface EvaluateAnswerParams {
  question: Question;
  answerText: string;
  timeSpentSeconds: number;
  language: string;
  sessionContext: Array<{ q: string; a: string }>;
}

export interface GenerateFollowUpParams {
  originalQuestionId: string;
  originalQuestion: string;
  candidateAnswer: string;
  followUpTopic: string;
  language: string;
  category: InterviewType;
  difficulty: QuestionDifficulty;
}

export interface GenerateReportParams {
  session: InterviewSession;
  responses: CandidateResponse[];
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const url = getApiUrl(path);
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: controller.signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`API ${res.status}: ${errText}`);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The AI service may be busy, using local fallback.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Local fallback helpers ────────────────────────────────────────────────────

function buildLocalFallbackQuestion(
  params: GenerateQuestionParams
): Question {
  const excludeSignatures = (params.history || []).map(h => createQuestionSignature(h.question));
  return roleQuestionEngine.generateQuestion({
    candidateName: params.candidateName || 'Candidate',
    role: params.role,
    experienceLevel: params.experienceLevel,
    category: params.category,
    difficulty: params.difficulty,
    language: params.language,
    questionNumber: params.questionNumber,
    totalQuestions: params.totalQuestions,
    excludeSignatures
  });
}

function buildLocalFallbackEvaluation(
  question: Question,
  answerText: string,
  timeSpentSeconds: number
): QuestionEvaluation {
  const keywords = question.expectedKeywords || [];
  const lowerAnswer = answerText.toLowerCase();
  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;

  const matched = keywords.filter(k => lowerAnswer.includes(k.toLowerCase()));
  const missed = keywords.filter(k => !lowerAnswer.includes(k.toLowerCase()));
  const keywordRatio = keywords.length > 0 ? matched.length / keywords.length : 0.5;

  const accuracyScore = clamp(Math.round(keywordRatio * 70 + (wordCount > 30 ? 25 : 10)));
  const clarityScore = clamp(wordCount > 50 ? 75 : wordCount > 20 ? 60 : 40);
  const depthScore = wordCount >= 60 ? 85 : wordCount >= 35 ? 70 : wordCount >= 20 ? 55 : 35;
  const relevanceScore = clamp(Math.round(keywordRatio * 80 + 20));
  const completenessScore = clamp(Math.round((matched.length / Math.max(keywords.length, 1)) * 85 + 10));
  const reasoningScore = clamp(wordCount > 50 ? 70 : 45);

  const score = clamp(Math.round(
    accuracyScore * 0.35 + clarityScore * 0.20 + depthScore * 0.20 +
    relevanceScore * 0.15 + reasoningScore * 0.10
  ));

  return {
    score, accuracyScore, clarityScore, depthScore,
    relevanceScore, completenessScore, reasoningScore,
    matchedKeywords: matched,
    missedKeywords: missed.slice(0, 5),
    feedback: score >= 70
      ? 'Good answer! You covered key concepts effectively.'
      : 'Your answer shows potential. Try to include more technical depth and specific examples.',
    keyStrengths: matched.length >= 2
      ? [`Covered: ${matched.slice(0, 2).join(', ')}`]
      : wordCount > 20 ? ['Provided a reasonable answer length'] : [],
    keyImprovements: missed.length > 0
      ? [`Consider including: ${missed.slice(0, 2).join(', ')}`]
      : ['Add real-world examples to strengthen your answer'],
    modelAnswer: question.modelAnswer || '',
    suggestFollowUp: keywordRatio < 0.4 && wordCount > 8
  };
}

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

// ─── AI Provider Service ──────────────────────────────────────────────────────

class AIProviderService {
  private serverAvailable: boolean | null = null;
  private statusCache: AIStatusResponse | null = null;
  private statusCacheTime = 0;
  private readonly STATUS_CACHE_TTL = 30_000; // 30 seconds

  // Check if the AI server is available
  async getStatus(): Promise<AIStatusResponse> {
    const now = Date.now();
    if (this.statusCache && (now - this.statusCacheTime) < this.STATUS_CACHE_TTL) {
      return this.statusCache;
    }

    try {
      const status = await apiFetch<AIStatusResponse>('/ai-status');
      this.statusCache = status;
      this.statusCacheTime = now;
      this.serverAvailable = true;
      return status;
    } catch (err) {
      console.warn('[AIProviderService] Server unavailable:', err);
      this.serverAvailable = false;
      return {
        provider: 'fallback',
        isLive: false,
        model: null,
        message: 'AI server not reachable. Using local curated question bank.'
      };
    }
  }

  // Generate a fresh question for the current interview state
  async generateQuestion(params: GenerateQuestionParams): Promise<{ question: Question; source: string }> {
    // Try server first
    if (this.serverAvailable !== false) {
      try {
        const resp = await apiFetch<{ question: Question; provider: string }>('/generate-question', {
          method: 'POST',
          body: JSON.stringify(params)
        });
        this.serverAvailable = true;

        // Validate required fields
        if (!resp.question?.question || !resp.question?.id) {
          throw new Error('Invalid question response from server');
        }

        return { question: resp.question, source: resp.provider };
      } catch (err: any) {
        console.warn('[AIProviderService] generateQuestion server error, using local fallback:', err.message);
        this.serverAvailable = false;
      }
    }

    // Local fallback
    const question = buildLocalFallbackQuestion(params);
    return { question, source: 'predefined' };
  }

  // Evaluate a candidate's answer
  async evaluateAnswer(params: EvaluateAnswerParams): Promise<{ evaluation: QuestionEvaluation; source: string }> {
    if (this.serverAvailable !== false) {
      try {
        const resp = await apiFetch<{ evaluation: QuestionEvaluation; source: string }>('/evaluate-answer', {
          method: 'POST',
          body: JSON.stringify(params)
        });
        this.serverAvailable = true;

        if (!resp.evaluation || typeof resp.evaluation.score !== 'number') {
          throw new Error('Invalid evaluation response');
        }

        return { evaluation: resp.evaluation, source: resp.source };
      } catch (err: any) {
        console.warn('[AIProviderService] evaluateAnswer server error, using local rubric:', err.message);
        this.serverAvailable = false;
      }
    }

    // Local fallback using comprehensive category-specific rubric engine
    const evaluation = await aiEvaluatorService.evaluateAnswer(
      params.question,
      params.answerText,
      params.timeSpentSeconds,
      undefined,
      params.language
    );
    return { evaluation, source: 'local_rubric' };
  }

  // Generate a follow-up question based on the candidate's answer
  async generateFollowUp(params: GenerateFollowUpParams): Promise<{ followUp: Question; source: string } | null> {
    if (this.serverAvailable !== false) {
      try {
        const resp = await apiFetch<{ followUp: Question; provider: string }>('/generate-followup', {
          method: 'POST',
          body: JSON.stringify(params)
        });
        this.serverAvailable = true;

        if (resp.followUp?.question) {
          return { followUp: resp.followUp, source: resp.provider };
        }
      } catch (err: any) {
        console.warn('[AIProviderService] generateFollowUp error:', err.message);
      }
    }

    // Predefined follow-up
    return {
      followUp: {
        id: `followup_local_${Date.now()}`,
        category: params.category,
        difficulty: params.difficulty,
        question: `Can you provide a specific real-world example from your experience or studies that illustrates your previous answer?`,
        contextHint: 'Draw from a project, assignment, or situation you have personally encountered.',
        expectedKeywords: ['example', 'project', 'specific', 'result', 'learned'],
        modelAnswer: 'A concrete example with context, your action, and a measurable outcome demonstrates practical understanding.',
        source: 'predefined' as const,
        isFollowUp: true,
        parentQuestionId: params.originalQuestionId,
        testCases: [],
        rubricCriteria: [
          { criterion: 'Specificity', weight: 60, description: 'Concrete, personal example with clear details.' },
          { criterion: 'Outcome', weight: 40, description: 'Clear result or lesson learned.' }
        ]
      },
      source: 'predefined'
    };
  }

  // Generate final report summary
  async generateReport(params: GenerateReportParams): Promise<FeedbackSummary> {
    if (this.serverAvailable !== false) {
      try {
        const resp = await apiFetch<{ summary: FeedbackSummary; source: string }>('/generate-report', {
          method: 'POST',
          body: JSON.stringify(params)
        });
        this.serverAvailable = true;
        if (resp.summary) {
          return {
            ...resp.summary,
            source: resp.source || resp.summary.source || 'ai_generated'
          };
        }
      } catch (err: any) {
        console.warn('[AIProviderService] generateReport error, using local:', err.message);
      }
    }

    // Local comprehensive fallback
    return aiEvaluatorService.generateSessionSummary(params.session, params.responses);
  }

  // Reset server availability (for retry after error)
  resetServerStatus(): void {
    this.serverAvailable = null;
    this.statusCache = null;
    this.statusCacheTime = 0;
  }
}

export const aiProviderService = new AIProviderService();
