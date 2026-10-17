/**
 * AI Provider Service — Frontend Client
 * ======================================
 * Communicates with the backend AI server (/api/*).
 * Never holds or exposes API keys.
 * Falls back to local multilingual question bank if server is unreachable.
 */

import { 
  Question, 
  QuestionEvaluation, 
  InterviewSession, 
  FeedbackSummary, 
  CandidateResponse, 
  InterviewType, 
  QuestionDifficulty, 
  ExperienceLevel,
  ExtractedResumeData,
  JobMatchAnalysis,
  InterviewFocus,
  FinalCandidateRecommendation
} from '../types/interview';
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

const DEFAULT_TIMEOUT_MS = 25000;

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
  resumeData?: ExtractedResumeData | null;
  jobDescription?: string;
  interviewFocus?: InterviewFocus;
}

export interface EvaluateAnswerParams {
  question: Question;
  answerText: string;
  timeSpentSeconds: number;
  language: string;
  sessionContext: Array<{ q: string; a: string }>;
  resumeData?: ExtractedResumeData | null;
  jobDescription?: string;
}

export interface GenerateFollowUpParams {
  originalQuestionId: string;
  originalQuestion: string;
  candidateAnswer: string;
  followUpTopic: string;
  language: string;
  category: InterviewType;
  difficulty: QuestionDifficulty;
  resumeData?: ExtractedResumeData | null;
}

export interface GenerateReportParams {
  session: InterviewSession;
  responses: CandidateResponse[];
  resumeData?: ExtractedResumeData | null;
  jobDescription?: string;
}

export interface UploadResumeParams {
  fileBase64: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
}

export interface AnalyzeJDParams {
  resumeData?: ExtractedResumeData | null;
  jobDescription: string;
  targetRole?: string;
}

export interface FinalRecommendationParams {
  session: InterviewSession;
  responses: CandidateResponse[];
  resumeData?: ExtractedResumeData | null;
  jobDescription?: string;
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
    excludeSignatures,
    resumeData: params.resumeData,
    jobDescription: params.jobDescription,
    interviewFocus: params.interviewFocus
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
  if (!answerText || !answerText.trim() || wordCount === 0) {
    return {
      score: 0,
      accuracyScore: 0,
      clarityScore: 0,
      depthScore: 0,
      relevanceScore: 0,
      completenessScore: 0,
      reasoningScore: 0,
      matchedKeywords: [],
      missedKeywords: (question.expectedKeywords || []).slice(0, 5),
      feedback: 'No answer was submitted for this question. A score of 0 marks was recorded.',
      keyStrengths: [],
      keyImprovements: [
        'Attempt every question during an interview — even a partial or conceptual answer demonstrates problem-solving ability.',
        'Address the core concepts requested in the question prompt.'
      ],
      modelAnswer: question.modelAnswer || '',
      suggestFollowUp: false
    };
  }

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

  // Upload and parse resume
  async uploadResume(params: UploadResumeParams): Promise<{ resumeData: ExtractedResumeData; warnings?: string[]; source: string }> {
    try {
      const resp = await apiFetch<{ resumeData: ExtractedResumeData; warnings?: string[]; source: string }>('/upload-resume', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      this.serverAvailable = true;
      if (resp.resumeData) {
        return {
          resumeData: resp.resumeData,
          warnings: resp.warnings || [],
          source: resp.source || 'server'
        };
      }
      throw new Error('Invalid resume parsing response from server.');
    } catch (err: any) {
      console.warn('[AIProviderService] uploadResume server error:', err.message);
      // If server returned an HTTP error (e.g. 400 Bad Request, file format, size), surface that exact message
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('503')) {
        throw err;
      }
      this.serverAvailable = false;
      throw new Error('AI backend server is not reachable to parse this resume document. Please start the server using npm run server.');
    }
  }

  // Analyze Job Description against Resume
  async analyzeJobDescription(params: AnalyzeJDParams): Promise<{ analysis: JobMatchAnalysis; source: string }> {
    if (this.serverAvailable !== false) {
      try {
        const resp = await apiFetch<{ analysis: JobMatchAnalysis; source: string }>('/analyze-jd', {
          method: 'POST',
          body: JSON.stringify(params)
        });
        this.serverAvailable = true;
        if (resp.analysis) {
          return {
            analysis: resp.analysis,
            source: resp.source || 'ai_generated'
          };
        }
      } catch (err: any) {
        console.warn('[AIProviderService] analyzeJobDescription server error, using deterministic matching:', err.message);
      }
    }

    // Client-side deterministic fallback
    const resumeSkills = params.resumeData?.technicalSkills || [];
    const lowerJD = (params.jobDescription || '').toLowerCase();
    
    // Scan common tech keywords in JD
    const commonKeywords = [
      'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'SQL',
      'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'Git', 'REST API',
      'GraphQL', 'CI/CD', 'Microservices', 'HTML', 'CSS', 'Tailwind', 'Redux'
    ];

    const jdRequired = commonKeywords.filter(k => lowerJD.includes(k.toLowerCase()));
    const relevantFound = jdRequired.filter(k => 
      resumeSkills.some(rs => rs.toLowerCase() === k.toLowerCase())
    );
    const missing = jdRequired.filter(k => 
      !resumeSkills.some(rs => rs.toLowerCase() === k.toLowerCase())
    );

    const matchPercent = jdRequired.length > 0 
      ? Math.round((relevantFound.length / jdRequired.length) * 100) 
      : 80;

    return {
      analysis: {
        targetJobTitle: params.targetRole || 'Target Role',
        relevantSkillsFound: relevantFound.length > 0 ? relevantFound : resumeSkills.slice(0, 4),
        missingRequiredSkills: missing,
        interviewFocusTopics: missing.length > 0 ? missing.slice(0, 3) : ['System Architecture', 'Core Competencies', 'Problem Solving'],
        matchScorePercent: matchPercent,
        summary: `Resume aligns well with ${relevantFound.length} of ${jdRequired.length || 'key'} required skills identified in the job description.`,
        roleSpecificPlan: [
          'Verify foundational programming & data structure concepts',
          `Evaluate practical application in ${relevantFound.slice(0, 2).join(' and ') || 'primary stack'}`,
          `Explore exposure to ${missing.slice(0, 2).join(' or ') || 'advanced domain concepts'}`
        ]
      },
      source: 'deterministic'
    };
  }

  // Generate Final Candidate Recommendation & Evaluation Report
  async generateFinalRecommendation(params: FinalRecommendationParams): Promise<{ recommendation: FinalCandidateRecommendation; source: string }> {
    if (this.serverAvailable !== false) {
      try {
        const resp = await apiFetch<{ recommendation: FinalCandidateRecommendation; source: string }>('/generate-recommendation', {
          method: 'POST',
          body: JSON.stringify(params)
        });
        this.serverAvailable = true;
        if (resp.recommendation) {
          return {
            recommendation: resp.recommendation,
            source: resp.source || 'ai_generated'
          };
        }
      } catch (err: any) {
        console.warn('[AIProviderService] generateFinalRecommendation server error, using deterministic:', err.message);
      }
    }

    // Deterministic fallback
    const passingThreshold = 70;
    const borderlineThreshold = 50;
    const overallScore = params.session.overallScore ?? 75;
    const candidateName = params.session.candidateName || 'Candidate';
    const status: 'recommended' | 'borderline' | 'not_recommended' | 'inconclusive' =
      params.responses.length === 0
        ? 'inconclusive'
        : overallScore >= passingThreshold
        ? 'recommended'
        : overallScore >= borderlineThreshold
        ? 'borderline'
        : 'not_recommended';

    const statusLabel =
      status === 'recommended'
        ? 'Recommended for Next Round'
        : status === 'borderline'
        ? 'Borderline — Additional Assessment Recommended'
        : status === 'not_recommended'
        ? 'Not Recommended at This Time'
        : 'Inconclusive Assessment';

    const demonstrated = (params.resumeData?.technicalSkills || []).slice(0, 4);
    const projects = (params.resumeData?.projects || []).slice(0, 2).map(p => p.title);

    return {
      recommendation: {
        status,
        statusLabel,
        headline: status === 'recommended'
          ? `${candidateName} demonstrated solid role proficiency scoring ${overallScore}/100.`
          : status === 'borderline'
          ? `${candidateName} demonstrated foundational capability (${overallScore}/100) with key areas for further review.`
          : `${candidateName} scored ${overallScore}/100; additional targeted practice in core concepts is suggested.`,
        explanation: `Across ${params.responses.length} evaluated questions, the candidate demonstrated substantive understanding of their declared technical domain and practical problem-solving. Assessment adhered strictly to evidence demonstrated during this session.`,
        confidenceLevel: params.responses.length >= 4 ? 'High' : 'Medium',
        overallScore,
        passingThreshold,
        borderlineThreshold,
        demonstratedSkills: demonstrated.length > 0 ? demonstrated : ['Technical Fundamentals', 'Problem Solving', 'Structured Communication'],
        convincinglyExplainedProjects: projects.length > 0 ? projects : ['Primary Project Architecture'],
        claimsNeedingClarification: ['System scalability trade-offs and edge-case testing'],
        jobRelevantStrengths: ['Clear articulate explanations', 'Practical awareness of development workflows'],
        skillsRequiringPractice: ['Algorithmic complexity justification', 'Comprehensive edge case consideration'],
        decisionFactors: [
          {
            factor: 'Performance Benchmark',
            impact: overallScore >= passingThreshold ? 'positive' : overallScore >= borderlineThreshold ? 'neutral' : 'gap',
            detail: `Achieved ${overallScore}/100 against passing threshold of ${passingThreshold}%.`
          },
          {
            factor: 'Demonstrated Technical Breadth',
            impact: 'positive',
            detail: `Successfully completed ${params.responses.length} interview questions.`
          }
        ],
        fairnessNotice: 'Fairness Notice: AI Interview Pro is an advisory practice assessment tool. Recommendations are strictly educational and performance-driven. Hiring decisions should always be conducted by human professionals without bias.'
      },
      source: 'deterministic'
    };
  }

  // Reset server availability (for retry after error)
  resetServerStatus(): void {
    this.serverAvailable = null;
    this.statusCache = null;
    this.statusCacheTime = 0;
  }
}

export const aiProviderService = new AIProviderService();
