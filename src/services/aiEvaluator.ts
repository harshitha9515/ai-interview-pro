import { Question, CandidateResponse, QuestionEvaluation, CategoryScore, CategoryWeightInfo, FeedbackSummary, InterviewSession, UserSettings } from '../types/interview';
import { languageService } from './languageService';
import { getLanguageConfig } from '../config/languages';

// Category-specific criteria descriptions
export const CATEGORY_CRITERIA_DOCS: Record<string, string> = {
  hr: 'Communication Clarity (35%), Situational Relevance (25%), STAR Reasoning (25%), Completeness (15%) [Coding: 0%]',
  technical: 'Technical Correctness (40%), Completeness (20%), Engineering Reasoning (20%), Relevance (10%), Clarity (10%)',
  coding: 'Automated Test Results (45%), Algorithmic Reasoning (25%), Technical Correctness (20%), Code Clarity (10%)',
  aptitude: 'Problem-solving & Logic (40%), Accuracy (35%), Method Relevance (15%), Clarity (10%)',
  communication: 'Communication Clarity (40%), Topic Relevance (25%), Completeness (20%), Reasoning & Persuasiveness (15%)',
  placement_mixed: 'Weighted combination across Technical, Coding, HR, Aptitude, and Communication rubrics'
};

export class AIEvaluatorService {
  /**
   * Evaluates a single candidate answer against the question rubrics.
   */
  public async evaluateAnswer(
    question: Question,
    candidateAnswer: string,
    timeSpentSeconds: number,
    settings?: UserSettings,
    sessionLanguage: string = 'en-US',
    codeTestResults?: { total: number; passed: number; results: any[] }
  ): Promise<QuestionEvaluation> {
    const langCode = sessionLanguage || settings?.language || 'en-US';
    const trimmed = languageService.normalizeCandidateText(candidateAnswer);
    const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

    // Optional: If user provided a Gemini API Key in Settings, use live LLM evaluation
    if (settings?.geminiApiKey && settings.aiProvider === 'gemini') {
      try {
        const liveEval = await this.evaluateWithGemini(question, candidateAnswer, settings.geminiApiKey, langCode, codeTestResults);
        if (liveEval) return liveEval;
      } catch (err) {
        console.warn('Gemini live evaluation failed, falling back to local rubric engine:', err);
      }
    }

    // High-performance Built-in Multilingual Rubric Engine
    return this.evaluateWithRubricEngine(question, trimmed, wordCount, timeSpentSeconds, langCode, codeTestResults);
  }

  private evaluateWithRubricEngine(
    question: Question,
    answer: string,
    wordCount: number,
    timeSpentSeconds: number,
    langCode: string,
    codeTestResults?: { total: number; passed: number; results: any[] }
  ): QuestionEvaluation {
    const langConfig = getLanguageConfig(langCode);
    const templates = languageService.getFeedbackTemplates(langConfig.id);
    const category = question.category || 'technical';
    const expectedKeywords = question.expectedKeywords || [];

    // ─── Rule 1: Do not award arbitrary scores when answer is empty/skipped ─────
    if (wordCount === 0) {
      return {
        score: 0,
        accuracyScore: 0,
        clarityScore: 0,
        depthScore: 0,
        relevanceScore: 0,
        completenessScore: 0,
        reasoningScore: 0,
        codingScore: category === 'coding' ? 0 : undefined,
        isUnavailable: true,
        unavailableReason: 'Question was skipped without an answer submitted.',
        matchedKeywords: [],
        missedKeywords: expectedKeywords.slice(0, 4),
        missingPoints: [
          'No response was submitted for this question.',
          `Expected key concepts: ${expectedKeywords.slice(0, 3).join(', ') || 'Core domain terminology'}`
        ],
        feedback: 'This question was skipped. Practice framing a structured response using the suggested exemplar below.',
        keyStrengths: [],
        keyImprovements: [
          'Attempt every question during an interview — even a partial or conceptual answer demonstrates problem-solving ability.',
          category === 'hr' ? 'Use the STAR technique (Situation, Task, Action, Result) for behavioral prompts.' : 'Define the core term, explain the mechanism, and give a practical use case.'
        ],
        suggestedImprovedAnswer: question.modelAnswer || 'Provide a structured explanation covering definitions, key mechanisms, and trade-offs.',
        modelAnswer: question.modelAnswer || ''
      };
    }

    // ─── Keyword & Linguistic Analysis (Accent-Neutral & Code-Switching Tolerant) ──
    const { matched: matchedKeywords, missed: missedKeywords, matchRatio: keywordMatchRatio } = 
      languageService.matchKeywords(answer, expectedKeywords);

    // Structural reasoning markers (multilingual transition words)
    const multilingualMarkers = [
      'because', 'however', 'for example', 'specifically', 'therefore', 'result', 'approach', 'first', 'second', 'finally',
      'ఎందుకంటే', 'ఉదాహరణకు', 'కాబట్టి', 'ఫలితం', 'ముఖ్యంగా', // Telugu
      'क्योंकि', 'उदाहरण', 'इसलिए', 'परिणाम', 'विशेष', 'पहला', // Hindi
      'ஏனெனில்', 'உதாரணமாக', 'எனவே', 'முடிவு', 'முதலில்', // Tamil
      'ಏಕೆಂದರೆ', 'ಉದಾಹರಣೆಗೆ', 'ಆದ್ದರಿಂದ', 'ಫಲಿತಾಂಶ', 'ಮೊದಲನೆಯದಾಗಿ', // Kannada
      'കാരണം', 'ഉദാഹരണത്തിന്', 'അതുകൊണ്ട്', 'ഫലം', 'ആദ്യമായി' // Malayalam
    ];
    const lowerAnswer = answer.toLowerCase();
    const matchedMarkers = multilingualMarkers.filter(m => lowerAnswer.includes(m.toLowerCase()));
    const structureScore = Math.min(100, (matchedMarkers.length * 15) + (wordCount >= 40 ? 50 : wordCount >= 20 ? 30 : 15));

    // Length-based completeness
    const completenessScore = Math.min(100, Math.round(
      (keywordMatchRatio * 50) + (wordCount >= 50 ? 50 : wordCount >= 30 ? 35 : wordCount >= 15 ? 20 : 10)
    ));

    // Relevance to question
    const relevanceScore = Math.min(100, Math.max(25, Math.round((keywordMatchRatio * 70) + 30)));

    // Reasoning and problem solving
    const reasoningScore = Math.min(100, Math.max(20, Math.round((structureScore * 0.7) + (matchedMarkers.length > 0 ? 30 : 15))));

    // Communication clarity (focuses on coherence, not regional accent)
    let clarityScore = Math.min(100, Math.max(30, Math.round(structureScore * 0.6 + (wordCount >= 25 ? 40 : 20))));

    // Technical accuracy
    let accuracyScore = Math.min(100, Math.max(25, Math.round((keywordMatchRatio * 75) + (wordCount >= 30 ? 25 : 15))));

    // Depth
    let depthScore = wordCount >= 60 ? 92 : wordCount >= 35 ? 78 : wordCount >= 20 ? 60 : 35;

    // ─── Rule 2: Category-Specific Scoring Formulas ─────────────────────────────
    let finalScore = 0;
    let codingScore: number | undefined = undefined;
    let codingTestSummary: QuestionEvaluation['codingTestSummary'] = undefined;

    if (category === 'hr') {
      // HR / Behavioral Rubric: Clarity 35%, Relevance 25%, STAR Reasoning 25%, Completeness 15%
      // Coding correctness is explicitly 0% (NOT scored)
      finalScore = Math.round(
        (clarityScore * 0.35) +
        (relevanceScore * 0.25) +
        (reasoningScore * 0.25) +
        (completenessScore * 0.15)
      );
    } else if (category === 'coding') {
      // Coding Rubric: Distinguishes actual test case results from AI review
      if (codeTestResults && codeTestResults.total > 0) {
        const passRatio = codeTestResults.passed / codeTestResults.total;
        codingScore = Math.round(passRatio * 100);
        codingTestSummary = {
          passed: codeTestResults.passed,
          total: codeTestResults.total,
          details: `${codeTestResults.passed}/${codeTestResults.total} automated test cases passed in browser sandbox execution.`
        };
        // 45% automated tests, 25% reasoning/logic, 20% accuracy/edge cases, 10% clarity
        finalScore = Math.round(
          (codingScore * 0.45) +
          (reasoningScore * 0.25) +
          (accuracyScore * 0.20) +
          (clarityScore * 0.10)
        );
      } else {
        // Conceptual code review without execution
        codingScore = Math.round(accuracyScore * 0.8 + reasoningScore * 0.2);
        finalScore = Math.round(
          (accuracyScore * 0.40) +
          (reasoningScore * 0.30) +
          (completenessScore * 0.20) +
          (clarityScore * 0.10)
        );
      }
    } else if (category === 'aptitude') {
      // Aptitude Rubric: Problem-solving 40%, Accuracy 35%, Method Relevance 15%, Clarity 10%
      finalScore = Math.round(
        (reasoningScore * 0.40) +
        (accuracyScore * 0.35) +
        (relevanceScore * 0.15) +
        (clarityScore * 0.10)
      );
    } else if (category === 'communication') {
      // Communication Rubric: Clarity 40%, Relevance 25%, Completeness 20%, Reasoning 15%
      finalScore = Math.round(
        (clarityScore * 0.40) +
        (relevanceScore * 0.25) +
        (completenessScore * 0.20) +
        (reasoningScore * 0.15)
      );
    } else {
      // Technical Rubric: Accuracy 40%, Completeness 20%, Reasoning 20%, Relevance 10%, Clarity 10%
      finalScore = Math.round(
        (accuracyScore * 0.40) +
        (completenessScore * 0.20) +
        (reasoningScore * 0.20) +
        (relevanceScore * 0.10) +
        (clarityScore * 0.10)
      );
    }

    // Clamp score
    finalScore = Math.min(98, Math.max(15, finalScore));

    // ─── Strengths, Missing Points & Beginner Constructive Feedback ─────────────
    const keyStrengths: string[] = [];
    const keyImprovements: string[] = [];
    const missingPoints: string[] = [];

    if (matchedKeywords.length >= 2) {
      keyStrengths.push(`Addressed core terminology: ${matchedKeywords.slice(0, 3).join(', ')}`);
    }
    if (wordCount >= 35) {
      keyStrengths.push(templates.strengthClearStructure || 'Provided a well-structured, detailed explanation.');
    }
    if (matchedMarkers.length > 0) {
      keyStrengths.push('Used logical transition markers to organize key thoughts.');
    }
    if (keyStrengths.length === 0) {
      keyStrengths.push('Direct and concise attempt at answering the prompt.');
    }

    if (missedKeywords.length > 0) {
      missingPoints.push(`Key concepts omitted: ${missedKeywords.slice(0, 3).join(', ')}`);
      keyImprovements.push(`Incorporate domain concepts like: ${missedKeywords.slice(0, 2).join(', ')}`);
    }
    if (wordCount < 30) {
      missingPoints.push('Answer lacked sufficient elaboration or real-world practical examples.');
      keyImprovements.push('Elaborate further with a concrete project or technical example.');
    }
    if (matchedMarkers.length === 0) {
      keyImprovements.push('Structure your answer with clear signposts (e.g. "Firstly...", "For instance...", "As a result...")');
    }

    const feedback = finalScore >= 75
      ? `Strong answer! You communicated key points effectively and demonstrated solid ${category} understanding.`
      : finalScore >= 60
      ? `Good foundation. Your response touches on key aspects, but adding more depth and specific examples will elevate your answer.`
      : `Fair attempt. Focus on covering essential concepts and providing structured explanations using the model answer below.`;

    // Construct a beginner-friendly suggested improved answer
    const suggestedImprovedAnswer = question.modelAnswer
      ? question.modelAnswer
      : `A comprehensive answer should: 1) Clearly state the definition or situation; 2) Explain how it works using ${expectedKeywords.slice(0, 3).join(', ')}; 3) Give a concrete project example demonstrating outcome.`;

    return {
      score: finalScore,
      accuracyScore,
      clarityScore,
      depthScore,
      relevanceScore,
      completenessScore,
      reasoningScore,
      codingScore,
      codingTestSummary,
      matchedKeywords,
      missedKeywords,
      missingPoints,
      suggestedImprovedAnswer,
      feedback,
      keyStrengths,
      keyImprovements,
      modelAnswer: question.modelAnswer || suggestedImprovedAnswer,
      suggestFollowUp: keywordMatchRatio < 0.5 && wordCount > 8,
      followUpTopic: missedKeywords[0] || 'practical application'
    };
  }

  /**
   * Aggregates session results and produces comprehensive multilingual evaluation summary.
   * Calculates overall score using documented category weights.
   */
  public generateSessionSummary(
    session: InterviewSession,
    evaluatedResponses: CandidateResponse[]
  ): FeedbackSummary {
    if (evaluatedResponses.length === 0) {
      return {
        overallSummary: 'No responses were submitted for this session.',
        readinessStatus: 'Foundational Review Needed',
        strengths: ['Started session'],
        improvements: ['Complete all questions to receive full evaluation report.'],
        categoryScores: [],
        categoryWeights: [],
        recommendedTopics: ['Interview Fundamentals', 'Core Concepts'],
        nextPracticeRecommendation: 'Start with a Beginner HR or Technical interview round to practice answering with full confidence.',
        disclaimer: 'Disclaimer: AI Interview Pro is a practice preparation platform. Practice scores reflect simulated rubric benchmarks and do not guarantee hiring or selection by any organization.'
      };
    }

    // ─── 1. Group by Category & Calculate Category Scores ───────────────────────
    const categoryMap: Record<string, { totalScore: number; count: number; nonZeroCount: number; missedKeywords: string[] }> = {};
    
    evaluatedResponses.forEach(r => {
      const cat = r.category || 'general';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { totalScore: 0, count: 0, nonZeroCount: 0, missedKeywords: [] };
      }
      const score = r.evaluations?.score || 0;
      categoryMap[cat].totalScore += score;
      categoryMap[cat].count += 1;
      if (score > 0) categoryMap[cat].nonZeroCount += 1;
      if (r.evaluations?.missedKeywords) {
        categoryMap[cat].missedKeywords.push(...r.evaluations.missedKeywords);
      }
    });

    const categoryKeys = Object.keys(categoryMap);
    const totalQuestions = Math.max(session.totalQuestions || 0, session.questions?.length || 0, evaluatedResponses.length, 1);

    // ─── 2. Calculate Documented Category Weights ──────────────────────────────
    const categoryWeights: CategoryWeightInfo[] = categoryKeys.map(catKey => {
      const data = categoryMap[catKey];
      const catScore = Math.round(data.totalScore / data.count);
      // Weight proportional to question count in session
      const weightPercent = Math.round((data.count / totalQuestions) * 100);
      const weightedContribution = Math.round((catScore * weightPercent) / 100);

      return {
        category: catKey,
        weightPercent,
        score: catScore,
        weightedContribution,
        criteriaDescription: CATEGORY_CRITERIA_DOCS[catKey] || CATEGORY_CRITERIA_DOCS.technical
      };
    });

    // Normalized overall score from all questions in session
    const totalWeightedScore = Math.round(
      evaluatedResponses.reduce((sum, r) => sum + (r.evaluations?.score ?? 0), 0) / totalQuestions
    );
    const overallScore = Math.min(100, Math.max(0, totalWeightedScore));

    const categoryScores: CategoryScore[] = categoryKeys.map(catKey => {
      const catAvg = Math.round(categoryMap[catKey].totalScore / categoryMap[catKey].count);
      return {
        category: catKey,
        score: catAvg,
        totalQuestions: categoryMap[catKey].count,
        status: catAvg >= 75 ? 'excellent' : catAvg >= 60 ? 'good' : 'needs_work',
        criteriaDescription: CATEGORY_CRITERIA_DOCS[catKey] || CATEGORY_CRITERIA_DOCS.technical
      };
    });

    // ─── 3. Readiness Status & Recommended Topics ───────────────────────────────
    let readinessStatus: FeedbackSummary['readinessStatus'] = 'Needs Practice';
    if (overallScore >= 80) readinessStatus = 'Placement Ready';
    else if (overallScore >= 65) readinessStatus = 'Promising Candidate';
    else if (overallScore >= 50) readinessStatus = 'Needs Practice';
    else readinessStatus = 'Foundational Review Needed';

    // Aggregate strengths & improvements
    const aggregatedStrengths = Array.from(
      new Set(evaluatedResponses.flatMap(r => r.evaluations?.keyStrengths || []))
    ).filter(Boolean).slice(0, 4);

    const aggregatedImprovements = Array.from(
      new Set(evaluatedResponses.flatMap(r => r.evaluations?.keyImprovements || []))
    ).filter(Boolean).slice(0, 4);

    if (aggregatedStrengths.length === 0) {
      aggregatedStrengths.push('Actively engaged and completed interview questions under timed conditions.');
    }
    if (aggregatedImprovements.length === 0) {
      aggregatedImprovements.push('Continue elaborating answers with practical project examples and industry terminology.');
    }

    // Recommended topics to study based on category weaknesses & missed keywords
    const recommendedTopics: string[] = [];
    const weakestCat = [...categoryScores].sort((a, b) => a.score - b.score)[0];

    if (weakestCat && weakestCat.category === 'coding') {
      recommendedTopics.push('Algorithmic Complexity (Big-O Time & Space)', 'Edge Case Identification in Coding', 'Modular Code Structure');
    } else if (weakestCat && weakestCat.category === 'hr') {
      recommendedTopics.push('STAR Behavioral Technique (Situation, Task, Action, Result)', 'Conflict Resolution & Leadership Scenarios', 'Impact Storytelling');
    } else if (weakestCat && weakestCat.category === 'aptitude') {
      recommendedTopics.push('Quantitative Reasoning Shortcuts', 'Logical Deduction & Pattern Recognition', 'Time-Efficient Problem Solving');
    } else {
      recommendedTopics.push('Core Architecture & System Design Principles', 'Database Normalization & Query Optimization', 'API Design & Status Codes');
    }

    // Next practice recommendation
    const nextPracticeRecommendation = overallScore >= 80
      ? `You are performing at a strong level! Challenge yourself with an Advanced ${session.role} mock interview or a timed Placement Mixed round.`
      : overallScore >= 65
      ? `Promising foundation! Focus your next session specifically on ${weakestCat?.category || 'technical'} questions to lift your weighted score above 80%.`
      : `Schedule a 15-minute practice session focusing on ${weakestCat?.category || 'core'} fundamentals and practice speaking your answers aloud using the model templates.`;

    const overallSummary = overallScore >= 75
      ? `Impressive interview performance! You achieved an overall score of ${overallScore}/100 with clear competency across key categories.`
      : overallScore >= 55
      ? `Solid effort with an overall score of ${overallScore}/100. Targeted practice in ${weakestCat?.category || 'weaker'} areas will significantly boost your readiness.`
      : `You scored ${overallScore}/100. Review the detailed feedback and model exemplars for each question below to build your confidence and depth.`;

    return {
      overallSummary,
      readinessStatus,
      strengths: aggregatedStrengths,
      improvements: aggregatedImprovements,
      categoryScores,
      categoryWeights,
      recommendedTopics,
      nextPracticeRecommendation,
      source: 'local_rubric',
      disclaimer: 'Disclaimer: AI Interview Pro is an educational practice and self-improvement tool. Practice interview scores reflect preparation metrics under simulated conditions and do not guarantee employment, selection, or specific hiring outcomes with any organization.'
    };
  }

  /**
   * Optional Gemini API integration for live LLM multilingual evaluation
   */
  private async evaluateWithGemini(
    question: Question,
    candidateAnswer: string,
    apiKey: string,
    langCode: string,
    codeTestResults?: { total: number; passed: number; results: any[] }
  ): Promise<QuestionEvaluation | null> {
    const langConfig = getLanguageConfig(langCode);

    const prompt = `You are an expert bilingual placement interviewer evaluating a college candidate's interview answer.
Target Interview Language: "${langConfig.name} (${langConfig.nativeName})"
Question: "${question.question}"
Category: "${question.category}"
Expected Model Concept: "${question.modelAnswer}"
Candidate Answer: "${candidateAnswer}"
${codeTestResults ? `Automated Sandbox Test Results: ${codeTestResults.passed}/${codeTestResults.total} passed.` : ''}

CRITICAL SCORING RULES:
1. Category-specific scoring:
   - For 'hr': Score communication clarity, situational relevance, and STAR reasoning. DO NOT score coding correctness.
   - For 'coding': Factor in automated test results (${codeTestResults?.passed || 0}/${codeTestResults?.total || 0}) and algorithmic logic.
   - For 'technical': Score technical correctness and conceptual depth.
2. Accent & language fairness: Do NOT penalize regional accents, code-switching, or conversational fillers. Evaluate substantive meaning.
3. Make feedback constructive, clear, and beginner-friendly.

Respond strictly as valid JSON in this schema:
{
  "score": number (0-100),
  "accuracyScore": number (0-100),
  "clarityScore": number (0-100),
  "depthScore": number (0-100),
  "relevanceScore": number (0-100),
  "completenessScore": number (0-100),
  "reasoningScore": number (0-100),
  "matchedKeywords": string[],
  "missedKeywords": string[],
  "missingPoints": string[],
  "suggestedImprovedAnswer": string,
  "feedback": string,
  "keyStrengths": string[],
  "keyImprovements": string[],
  "modelAnswer": string
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    return {
      score: parsed.score || 70,
      accuracyScore: parsed.accuracyScore || 70,
      clarityScore: parsed.clarityScore || 70,
      depthScore: parsed.depthScore || 70,
      relevanceScore: parsed.relevanceScore || 70,
      completenessScore: parsed.completenessScore || 70,
      reasoningScore: parsed.reasoningScore || 70,
      matchedKeywords: parsed.matchedKeywords || [],
      missedKeywords: parsed.missedKeywords || [],
      missingPoints: parsed.missingPoints || [],
      suggestedImprovedAnswer: parsed.suggestedImprovedAnswer || question.modelAnswer,
      feedback: parsed.feedback || 'Good attempt.',
      keyStrengths: parsed.keyStrengths || ['Clear communication'],
      keyImprovements: parsed.keyImprovements || ['Elaborate with more depth'],
      modelAnswer: parsed.modelAnswer || question.modelAnswer
    };
  }
}

export const aiEvaluatorService = new AIEvaluatorService();
