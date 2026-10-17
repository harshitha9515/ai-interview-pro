import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  InterviewSession, 
  Question, 
  CandidateResponse, 
  InterviewType, 
  ExperienceLevel, 
  QuestionDifficulty, 
  InterviewMode, 
  AIStatus,
  ExtractedResumeData,
  JobMatchAnalysis,
  InterviewFocus,
  FinalCandidateRecommendation
} from '../types/interview';
import { getMultilingualQuestions } from '../data/multilingualQuestionBank';
import { storageService } from '../services/storage';
import { aiEvaluatorService } from '../services/aiEvaluator';
import { aiProviderService } from '../services/aiProviderService';
import { roleQuestionEngine } from '../services/roleQuestionEngine';
import { ttsService } from '../services/speechSynthesis';
import { soundService } from '../services/soundEffects';
import { useSettings } from './SettingsContext';

export interface StartInterviewParams {
  candidateName: string;
  type: InterviewType;
  role: string;
  experienceLevel: ExperienceLevel;
  language: string;
  difficulty: QuestionDifficulty;
  mode: InterviewMode;
  questionCount: number;
  durationMinutes: number;
  resumeData?: ExtractedResumeData | null;
  jobDescriptionText?: string;
  jobMatchAnalysis?: JobMatchAnalysis | null;
  interviewFocus?: InterviewFocus;
  isProctored?: boolean;
}

export interface AIProviderStatus {
  provider: string;
  isLive: boolean;
  model: string | null;
  message: string;
}

interface InterviewContextType {
  currentSession: InterviewSession | null;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  currentlySpokenText: string;
  aiStatus: AIStatus;
  setAiStatus: (status: AIStatus) => void;
  isPaused: boolean;
  timeRemainingSeconds: number;
  isSubmittingAnswer: boolean;
  isLoadingQuestion: boolean;
  aiProviderStatus: AIProviderStatus | null;
  resumeData: ExtractedResumeData | null;
  setResumeData: (data: ExtractedResumeData | null) => void;
  jobDescriptionText: string;
  setJobDescriptionText: (text: string) => void;
  jobMatchAnalysis: JobMatchAnalysis | null;
  setJobMatchAnalysis: (analysis: JobMatchAnalysis | null) => void;
  interviewFocus: InterviewFocus;
  setInterviewFocus: (focus: InterviewFocus) => void;
  startInterview: (params: StartInterviewParams) => string;
  submitAnswer: (answerText: string) => Promise<void>;
  skipQuestion: () => Promise<void>;
  nextQuestion: () => void;
  previousQuestion: () => void;
  repeatCurrentQuestion: () => void;
  togglePause: () => void;
  endInterview: () => Promise<string>;
  restartInterviewWithSession: (session: InterviewSession) => string;
  setSessionLanguage: (lang: string) => void;
  refreshAIStatus: () => Promise<void>;
  clearActiveSetup: () => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const initialActive = storageService.getActiveSession();
  const savedActiveIndex = storageService.getActiveSessionIndex();

  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(() => initialActive);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    if (initialActive && initialActive.questions && initialActive.questions.length > 0) {
      if (savedActiveIndex >= 0 && savedActiveIndex < initialActive.questions.length) {
        return savedActiveIndex;
      }
      return Math.min(initialActive.responses?.length || 0, initialActive.questions.length - 1);
    }
    return 0;
  });
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(() => {
    if (initialActive && initialActive.createdAt && initialActive.status === 'in_progress') {
      const elapsed = Math.floor((Date.now() - new Date(initialActive.createdAt).getTime()) / 1000);
      const total = (initialActive.durationMinutes || 15) * 60;
      return Math.max(10, total - elapsed);
    }
    return (initialActive?.durationMinutes || 15) * 60;
  });
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState<boolean>(false);
  const [aiProviderStatus, setAiProviderStatus] = useState<AIProviderStatus | null>(null);

  // Resume & Job Description state hooks
  const [resumeData, setResumeData] = useState<ExtractedResumeData | null>(() => {
    return initialActive?.resumeData || null;
  });
  const [jobDescriptionText, setJobDescriptionText] = useState<string>(() => {
    return initialActive?.jobDescriptionText || '';
  });
  const [jobMatchAnalysis, setJobMatchAnalysis] = useState<JobMatchAnalysis | null>(() => {
    return initialActive?.jobMatchAnalysis || null;
  });
  const [interviewFocus, setInterviewFocus] = useState<InterviewFocus>(() => {
    return initialActive?.interviewFocus || 'balanced';
  });
  
  const questionStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);
  // Track AI-generated question history for deduplication
  const questionHistoryRef = useRef<Array<{ num: number; question: string; category: string }>>([]);

  const currentQuestion: Question | null = 
    currentSession && currentSession.questions.length > currentQuestionIndex 
      ? currentSession.questions[currentQuestionIndex] 
      : null;

  // ─── Sync active session and active index to storage ───────────────────────
  useEffect(() => {
    storageService.saveActiveSession(currentSession);
  }, [currentSession]);

  useEffect(() => {
    storageService.saveActiveSessionIndex(currentQuestionIndex);
  }, [currentQuestionIndex]);

  // ─── Fetch AI provider status on mount ─────────────────────────────────────
  useEffect(() => {
    fetchAIStatus();
  }, []);

  const fetchAIStatus = async () => {
    try {
      const status = await aiProviderService.getStatus();
      setAiProviderStatus(status);
    } catch {
      setAiProviderStatus({
        provider: 'fallback',
        isLive: false,
        model: null,
        message: 'AI server not reachable. Using curated question bank.'
      });
    }
  };

  const refreshAIStatus = async () => {
    aiProviderService.resetServerStatus();
    await fetchAIStatus();
  };

  // ─── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentSession && currentSession.status === 'in_progress' && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            endInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentSession?.status, isPaused]);

  // ─── Sync sound effects ─────────────────────────────────────────────────────
  useEffect(() => {
    soundService.setEnabled(settings.enableSoundEffects);
  }, [settings.enableSoundEffects]);

  const [currentlySpokenText, setCurrentlySpokenText] = useState<string>('');

  // ─── Auto-speak question when question changes ──────────────────────────────
  const lastSpokenQuestionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      currentQuestion &&
      currentSession?.status === 'in_progress' &&
      settings.autoSpeakQuestions &&
      !isPaused
    ) {
      // For proctored sessions, do not speak Question 1 while candidate is on the rules or device check screen
      if (currentSession?.isProctored && currentQuestionIndex === 0 && lastSpokenQuestionIdRef.current === null) {
        return;
      }

      if (lastSpokenQuestionIdRef.current !== currentQuestion.id) {
        lastSpokenQuestionIdRef.current = currentQuestion.id;
        soundService.play('question_start');
        speakQuestion(currentQuestion.question);
      }
    }
  }, [currentQuestion?.id, currentSession?.status, currentSession?.isProctored, currentQuestionIndex, isPaused, settings.autoSpeakQuestions]);

  const speakQuestion = (text: string) => {
    if (!text || !text.trim()) return;
    setAiStatus('speaking');
    setCurrentlySpokenText(text);
    const targetLang = currentSession?.language || settings.language || 'en-US';

    ttsService.speak(
      text,
      {
        voiceURI: settings.voiceURI,
        pitch: settings.voicePitch,
        rate: settings.voiceRate,
        lang: targetLang
      },
      {
        onStart: () => {
          setAiStatus('speaking');
          setCurrentlySpokenText(text);
        },
        onChunk: (chunkText) => {
          setCurrentlySpokenText(chunkText);
        },
        onEnd: () => {
          setAiStatus('listening');
          setCurrentlySpokenText('');
        },
        onError: () => {
          setAiStatus('listening');
          setCurrentlySpokenText('');
        }
      }
    );
  };

  // ─── Generate next question dynamically via AI ──────────────────────────────
  const generateNextQuestion = async (
    session: InterviewSession,
    questionNumber: number
  ): Promise<Question> => {
    setIsLoadingQuestion(true);
    setAiStatus('thinking');
    try {
      const result = await aiProviderService.generateQuestion({
        candidateName: session.candidateName,
        category: session.type,
        role: session.role,
        difficulty: session.difficulty,
        experienceLevel: session.experienceLevel,
        language: session.language,
        questionNumber,
        totalQuestions: session.totalQuestions,
        history: questionHistoryRef.current,
        sessionId: session.id,
        resumeData: session.resumeData,
        jobDescription: session.jobDescriptionText,
        interviewFocus: session.interviewFocus
      });

      // Track history for deduplication
      questionHistoryRef.current.push({
        num: questionNumber,
        question: result.question.question.substring(0, 150),
        category: result.question.category
      });

      return result.question;
    } finally {
      setIsLoadingQuestion(false);
      setAiStatus(prev => (prev === 'thinking' ? 'idle' : prev));
    }
  };

  // ─── Start Interview ────────────────────────────────────────────────────────
  const startInterview = (params: StartInterviewParams): string => {
    ttsService.cancel();
    questionHistoryRef.current = [];

    const candidateName = params.candidateName?.trim() || 'Candidate';
    const effectiveResumeData = params.resumeData !== undefined ? params.resumeData : resumeData;
    if (!effectiveResumeData) {
      throw new Error('A valid resume must be uploaded before starting the interview.');
    }
    const effectiveJD = params.jobDescriptionText !== undefined ? params.jobDescriptionText : jobDescriptionText;
    const effectiveJobMatch = params.jobMatchAnalysis !== undefined ? params.jobMatchAnalysis : jobMatchAnalysis;
    const effectiveFocus = params.interviewFocus || interviewFocus;

    // Generate initial questions strictly grounded in candidate's resume, role, and experience without repetition
    const seededQuestions = roleQuestionEngine.generateSessionQuestions({
      candidateName,
      role: params.role,
      experienceLevel: params.experienceLevel,
      category: params.type,
      difficulty: params.difficulty,
      questionCount: params.questionCount,
      resumeData: effectiveResumeData,
      jobDescription: effectiveJD,
      interviewFocus: effectiveFocus
    });

    const sessionId = `session_${Date.now()}`;
    const newSession: InterviewSession = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      candidateName,
      userName: candidateName,
      role: params.role,
      type: params.type,
      experienceLevel: params.experienceLevel,
      language: params.language,
      difficulty: params.difficulty,
      mode: params.mode,
      durationMinutes: params.durationMinutes,
      totalQuestions: params.questionCount,
      status: 'in_progress',
      questions: seededQuestions,
      responses: [],
      resumeData: effectiveResumeData || undefined,
      jobDescriptionText: effectiveJD || undefined,
      jobMatchAnalysis: effectiveJobMatch || undefined,
      interviewFocus: effectiveFocus,
      isProctored: true // Mandatory Proctored Placement Mode
    };

    setCurrentSession(newSession);
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(params.durationMinutes * 60);
    setIsPaused(false);
    questionStartTimeRef.current = Date.now();

    storageService.saveSession(newSession);
    storageService.saveActiveSession(newSession);

    // Try to replace question #1 with AI-generated version in background if AI provider is active
    generateNextQuestion(newSession, 1).then(aiQuestion => {
      setCurrentSession(prev => {
        if (!prev || prev.id !== sessionId) return prev;
        const updatedQs = [...prev.questions];
        updatedQs[0] = aiQuestion;
        // Track in history
        questionHistoryRef.current[0] = {
          num: 1,
          question: aiQuestion.question.substring(0, 150),
          category: aiQuestion.category
        };
        const updated = { ...prev, questions: updatedQs };
        storageService.saveSession(updated);
        storageService.saveActiveSession(updated);
        return updated;
      });
    }).catch(err => {
      console.warn('[InterviewContext] AI question for Q1 skipped, keeping role-tailored question:', err.message);
    });

    return sessionId;
  };

  // ─── Restart Interview ──────────────────────────────────────────────────────
  const restartInterviewWithSession = (pastSession: InterviewSession): string => {
    ttsService.cancel();
    questionHistoryRef.current = [];
    const newId = `session_${Date.now()}`;
    const candidateName = pastSession.candidateName || pastSession.userName || 'Candidate';

    // Generate fresh, non-repeating questions for the restarted session grounded in resume
    const freshQuestions = roleQuestionEngine.generateSessionQuestions({
      candidateName,
      role: pastSession.role,
      experienceLevel: pastSession.experienceLevel,
      category: pastSession.type,
      difficulty: pastSession.difficulty,
      questionCount: pastSession.totalQuestions || 5,
      resumeData: pastSession.resumeData,
      jobDescription: pastSession.jobDescriptionText,
      interviewFocus: pastSession.interviewFocus
    });

    const restarted: InterviewSession = {
      ...pastSession,
      id: newId,
      candidateName,
      userName: candidateName,
      createdAt: new Date().toISOString(),
      completedAt: undefined,
      overallScore: undefined,
      status: 'in_progress',
      questions: freshQuestions,
      responses: [],
      feedbackSummary: undefined
    };

    setCurrentSession(restarted);
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(restarted.durationMinutes * 60);
    setIsPaused(false);
    questionStartTimeRef.current = Date.now();

    storageService.saveSession(restarted);
    storageService.saveActiveSession(restarted);

    return newId;
  };

  const repeatCurrentQuestion = () => {
    if (currentQuestion) {
      lastSpokenQuestionIdRef.current = currentQuestion.id;
      soundService.play('question_start');
      speakQuestion(currentQuestion.question);
    }
  };

  const togglePause = () => {
    setIsPaused(prev => {
      const next = !prev;
      if (next) {
        ttsService.pause();
        setAiStatus('idle');
      } else {
        ttsService.resume();
      }
      return next;
    });
  };

  // ─── Submit Answer ──────────────────────────────────────────────────────────
  const submitAnswer = async (answerText: string): Promise<void> => {
    if (!currentQuestion || !currentSession) return;

    setIsSubmittingAnswer(true);
    setAiStatus('thinking');
    ttsService.cancel();
    soundService.play('answer_submitted');

    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

    // Build session context (last 3 Q&A pairs for follow-up awareness)
    const sessionContext = currentSession.responses.slice(-3).map(r => ({
      q: r.questionText,
      a: r.answerText
    }));

    // Evaluate via AI provider service (server or local fallback)
    let evaluation;
    try {
      const evalResult = await aiProviderService.evaluateAnswer({
        question: currentQuestion,
        answerText,
        timeSpentSeconds,
        language: currentSession.language,
        sessionContext,
        resumeData: currentSession.resumeData,
        jobDescription: currentSession.jobDescriptionText
      });
      evaluation = evalResult.evaluation;
    } catch (err) {
      console.warn('[InterviewContext] Evaluation failed, using local rubric:', err);
      evaluation = await aiEvaluatorService.evaluateAnswer(
        currentQuestion,
        answerText,
        timeSpentSeconds,
        settings,
        currentSession.language
      );
    }

    const newResponse: CandidateResponse = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      category: currentQuestion.category,
      answerText: answerText.trim(),
      timeSpentSeconds,
      wordCount,
      evaluations: evaluation
    };

    // Play score-based sound cue
    if (evaluation.score >= 80) {
      soundService.play('achievement');
    }

    // Update responses
    const updatedResponses = [...currentSession.responses];
    const existingIndex = updatedResponses.findIndex(r => r.questionId === currentQuestion.id);
    if (existingIndex >= 0) {
      updatedResponses[existingIndex] = newResponse;
    } else {
      updatedResponses.push(newResponse);
    }

    const isLastQuestion = currentQuestionIndex >= currentSession.questions.length - 1;

    // If AI suggests a follow-up and we haven't hit the limit, inject it
    let shouldInjectFollowUp = false;
    let followUpQuestion: Question | null = null;

    if (
      evaluation.suggestFollowUp &&
      !currentQuestion.isFollowUp && // Don't follow up on follow-ups
      !isLastQuestion &&
      wordCount > 8
    ) {
      try {
        const followUpResult = await aiProviderService.generateFollowUp({
          originalQuestionId: currentQuestion.id,
          originalQuestion: currentQuestion.question,
          candidateAnswer: answerText.substring(0, 400),
          followUpTopic: evaluation.followUpTopic || 'deeper understanding',
          language: currentSession.language,
          category: currentQuestion.category,
          difficulty: currentQuestion.difficulty,
          resumeData: currentSession.resumeData
        });
        if (followUpResult?.followUp) {
          followUpQuestion = followUpResult.followUp;
          shouldInjectFollowUp = true;
        }
      } catch (err) {
        console.warn('[InterviewContext] Follow-up generation failed:', err);
      }
    }

    // Build updated questions list (inject follow-up after current if applicable)
    let updatedQuestions = [...currentSession.questions];
    const nextIndex = currentQuestionIndex + 1;

    if (shouldInjectFollowUp && followUpQuestion) {
      // Insert the follow-up right after the current question
      updatedQuestions.splice(nextIndex, 0, followUpQuestion);
    } else if (!isLastQuestion) {
      // Pre-generate the NEXT AI question in background (non-blocking)
      const nextQNum = nextIndex + 1;
      const sessionSnapshot = { ...currentSession, responses: updatedResponses, questions: updatedQuestions };
      generateNextQuestion(sessionSnapshot, nextQNum).then(aiQ => {
        setCurrentSession(prev => {
          if (!prev) return prev;
          // Replace the seeded question at nextIndex with the AI-generated one
          if (nextIndex < prev.questions.length && !prev.questions[nextIndex].isFollowUp) {
            const qsCopy = [...prev.questions];
            qsCopy[nextIndex] = aiQ;
            const updated = { ...prev, questions: qsCopy };
            storageService.saveSession(updated);
            storageService.saveActiveSession(updated);
            return updated;
          }
          return prev;
        });
      }).catch(err => {
        console.warn('[InterviewContext] Background question pre-generation failed:', err.message);
      });
    }

    const updatedSession: InterviewSession = {
      ...currentSession,
      questions: updatedQuestions,
      responses: updatedResponses,
      totalQuestions: updatedQuestions.length
    };

    setCurrentSession(updatedSession);
    storageService.saveSession(updatedSession);
    storageService.saveActiveSession(updatedSession);

    setIsSubmittingAnswer(false);

    // Navigate to next question or end interview
    if (currentQuestionIndex < updatedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      questionStartTimeRef.current = Date.now();
      setAiStatus('idle');
    } else {
      await endInterview();
    }
  };

  const skipQuestion = async (): Promise<void> => {
    await submitAnswer('');
  };

  const nextQuestion = () => {
    if (currentSession && currentQuestionIndex < currentSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      questionStartTimeRef.current = Date.now();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      questionStartTimeRef.current = Date.now();
    }
  };

  // ─── End Interview ──────────────────────────────────────────────────────────
  const endInterview = async (): Promise<string> => {
    ttsService.cancel();
    setAiStatus('analyzing');

    if (!currentSession) return '';

    // Generate comprehensive evaluation report
    let summary: InterviewSession['feedbackSummary'];
    try {
      summary = await aiProviderService.generateReport({
        session: currentSession,
        responses: currentSession.responses,
        resumeData: currentSession.resumeData,
        jobDescription: currentSession.jobDescriptionText
      });
    } catch (err) {
      console.warn('[InterviewContext] Report generation error, using local evaluator:', err);
      summary = aiEvaluatorService.generateSessionSummary(currentSession, currentSession.responses);
    }

    // Overall score calculated based on all totalQuestions in session
    // Rule 6.3: Unanswered or skipped questions count as 0 towards the total possible marks
    const totalQCount = Math.max(currentSession.totalQuestions || 0, currentSession.questions.length, currentSession.responses.length, 1);
    const sumEarnedScores = currentSession.responses.reduce((acc, r) => acc + (r.evaluations?.score ?? 0), 0);
    let totalScore = Math.round(sumEarnedScores / totalQCount);
    totalScore = Math.min(100, Math.max(0, totalScore));

    // Generate Final Evidence-Based Recommendation
    let recommendation: FinalCandidateRecommendation | undefined;
    try {
      const recResult = await aiProviderService.generateFinalRecommendation({
        session: { ...currentSession, overallScore: totalScore },
        responses: currentSession.responses,
        resumeData: currentSession.resumeData,
        jobDescription: currentSession.jobDescriptionText
      });
      recommendation = recResult.recommendation;
    } catch (err) {
      console.warn('[InterviewContext] Final recommendation error:', err);
    }

    const finalSession: InterviewSession = {
      ...currentSession,
      completedAt: new Date().toISOString(),
      status: 'completed',
      overallScore: totalScore,
      feedbackSummary: summary,
      finalRecommendation: recommendation
    };

    setCurrentSession(finalSession);
    storageService.saveSession(finalSession);
    storageService.saveActiveSession(null);
    setAiStatus('idle');
    soundService.play('interview_complete');

    return finalSession.id;
  };

  // ─── Set Session Language ───────────────────────────────────────────────────
  const setSessionLanguage = (newLanguage: string) => {
    if (!currentSession) return;
    const updatedSession: InterviewSession = {
      ...currentSession,
      language: newLanguage
    };

    // Try to update current question with localized version
    const localizedPool = getMultilingualQuestions(newLanguage, currentSession.type);
    if (localizedPool.length > 0 && localizedPool[currentQuestionIndex]) {
      const updatedQuestions = [...currentSession.questions];
      updatedQuestions[currentQuestionIndex] = localizedPool[currentQuestionIndex];
      updatedSession.questions = updatedQuestions;
    }

    setCurrentSession(updatedSession);
    storageService.saveActiveSession(updatedSession);
    storageService.saveSession(updatedSession);
  };

  const clearActiveSetup = () => {
    setResumeData(null);
    setJobDescriptionText('');
    setJobMatchAnalysis(null);
    setInterviewFocus('balanced');
    setCurrentSession(null);
    setCurrentQuestionIndex(0);
    questionHistoryRef.current = [];
    storageService.clearActiveSession();
    storageService.clearSetupPreferences();
  };

  return (
    <InterviewContext.Provider value={{
      currentSession,
      currentQuestionIndex,
      currentQuestion,
      currentlySpokenText,
      aiStatus,
      setAiStatus,
      isPaused,
      timeRemainingSeconds,
      isSubmittingAnswer,
      isLoadingQuestion,
      aiProviderStatus,
      resumeData,
      setResumeData,
      jobDescriptionText,
      setJobDescriptionText,
      jobMatchAnalysis,
      setJobMatchAnalysis,
      interviewFocus,
      setInterviewFocus,
      startInterview,
      submitAnswer,
      skipQuestion,
      nextQuestion,
      previousQuestion,
      repeatCurrentQuestion,
      togglePause,
      endInterview,
      restartInterviewWithSession,
      setSessionLanguage,
      refreshAIStatus,
      clearActiveSetup
    }}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = (): InterviewContextType => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};
