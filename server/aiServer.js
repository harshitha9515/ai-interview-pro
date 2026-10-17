/**
 * AI Interview Pro — Backend AI Service
 * =====================================
 * Dedicated Node.js server that:
 *   - Reads AI credentials from .env (never sent to browser)
 *   - Generates interview questions via Gemini / OpenAI or falls back to curated bank
 *   - Evaluates candidate answers with rich rubrics
 *   - Generates context-aware follow-up questions
 *
 * Start: node server/aiServer.js
 * Port: process.env.PORT (default 3001)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { extractTextFromDocument, heuristicParseResumeText, MAX_FILE_SIZE_BYTES } from './resumeParser.js';

// ─── Load .env (without dotenv dependency) ────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
  return env;
}

const envVars = loadEnv(envPath);
const AI_PROVIDER = (envVars.AI_PROVIDER || process.env.AI_PROVIDER || 'gemini').toLowerCase();
const GEMINI_API_KEY = envVars.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = envVars.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const OPENAI_API_KEY = envVars.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = envVars.OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
const PORT = parseInt(process.env.PORT || envVars.PORT || '3001', 10);
const HOST = process.env.HOST || envVars.HOST || '0.0.0.0';

// ─── Effective AI mode ────────────────────────────────────────────────────────
function getEffectiveProvider() {
  if (AI_PROVIDER === 'gemini' && GEMINI_API_KEY) return 'gemini';
  if (AI_PROVIDER === 'openai' && OPENAI_API_KEY) return 'openai';
  return 'fallback';
}

// ─── Curated Question Bank (fallback) ─────────────────────────────────────────
// Rich set of questions covering all categories. Labeled as 'predefined'.
const CURATED_QUESTIONS = {
  hr: {
    fresher: [
      { q: 'Tell me about yourself, your background, and what motivates you to join this role.', keywords: ['education', 'skills', 'motivation', 'goal', 'project'], model: 'Introduce yourself using the Past-Present-Future structure: your educational background, current skills/projects, and future goals aligned with the role.' },
      { q: 'What are your key strengths and one area you actively work to improve?', keywords: ['strength', 'improvement', 'self-aware', 'growth', 'feedback'], model: 'Mention 2-3 concrete strengths with examples, and one genuine improvement area with the steps you are taking to address it.' },
      { q: 'Describe a time you worked in a team. What was your role and how did you handle disagreements?', keywords: ['team', 'collaboration', 'conflict', 'resolution', 'communication'], model: 'Use the STAR method. Emphasize listening, data-driven discussion, and a constructive outcome.' },
      { q: 'Where do you see yourself in three years, and how does this role help you get there?', keywords: ['career goals', 'growth', 'learning', 'role alignment', 'plan'], model: 'Align your 3-year vision with the skills and opportunities this role offers. Be specific and realistic.' },
      { q: 'Tell me about a challenging academic project and how you overcame obstacles.', keywords: ['challenge', 'problem-solving', 'perseverance', 'teamwork', 'outcome'], model: 'Describe the challenge clearly, your approach, what you learned, and the measurable outcome.' }
    ],
    experienced: [
      { q: 'Walk me through your career journey and the key decisions that shaped your path.', keywords: ['experience', 'decisions', 'growth', 'impact', 'leadership'], model: 'Highlight pivotal decisions, what you learned from each, and how they led to your current expertise.' },
      { q: 'Describe a situation where you had to lead a team through a difficult project. What was your approach?', keywords: ['leadership', 'team', 'challenge', 'strategy', 'outcome'], model: 'Explain your leadership style, how you motivated the team, managed obstacles, and the business impact.' }
    ]
  },
  technical: {
    beginner: [
      { q: 'What is the difference between a stack and a queue? Give a real-world example of each.', keywords: ['stack', 'queue', 'LIFO', 'FIFO', 'push', 'pop', 'enqueue', 'dequeue'], model: 'Stack (LIFO): browser history, undo operations. Queue (FIFO): print spooler, task scheduling. Explain the key operations.' },
      { q: 'Explain Object-Oriented Programming and its four pillars with examples.', keywords: ['OOP', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'class', 'object'], model: 'Encapsulation hides data, Abstraction hides complexity, Inheritance reuses code, Polymorphism allows one interface many implementations.' },
      { q: 'What is normalization in databases? Explain 1NF, 2NF, and 3NF.', keywords: ['normalization', '1NF', '2NF', '3NF', 'redundancy', 'functional dependency', 'primary key'], model: '1NF: atomic values. 2NF: no partial dependencies. 3NF: no transitive dependencies. Goal: reduce data redundancy.' },
      { q: 'What is the difference between process and thread? What is a deadlock?', keywords: ['process', 'thread', 'deadlock', 'synchronization', 'mutex', 'concurrency'], model: 'Process = independent program with its own memory. Thread = lightweight unit within a process sharing memory. Deadlock = circular wait for resources.' }
    ],
    intermediate: [
      { q: 'Explain the time and space complexity of common sorting algorithms. Which would you use for a nearly-sorted array?', keywords: ['Big O', 'merge sort', 'quick sort', 'insertion sort', 'time complexity', 'space complexity', 'O(n log n)'], model: 'For nearly-sorted: Insertion Sort (O(n) best case). Merge Sort: O(n log n) stable. Quick Sort: O(n log n) avg but O(n²) worst. Explain trade-offs.' },
      { q: 'What are REST API design principles? How do you handle authentication and versioning?', keywords: ['REST', 'stateless', 'HTTP methods', 'JWT', 'OAuth', 'versioning', 'idempotent', 'status codes'], model: 'REST: stateless, uniform interface, client-server. Auth: JWT/OAuth2. Versioning: URL path (/v1/) or header. Use correct HTTP status codes.' },
      { q: 'Describe the differences between SQL joins: INNER, LEFT, RIGHT, FULL OUTER. When would you use each?', keywords: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'matching rows', 'NULL'], model: 'INNER: only matching rows. LEFT: all left + matching right (NULLs for non-matches). RIGHT: opposite. FULL OUTER: all rows from both tables.' },
      { q: 'How does a hash map work internally? What is a collision and how is it resolved?', keywords: ['hash map', 'hash function', 'collision', 'chaining', 'open addressing', 'load factor', 'O(1)'], model: 'Hash function maps key to bucket index. Collision resolution: chaining (linked list) or open addressing (probing). Load factor triggers rehashing.' }
    ],
    advanced: [
      { q: 'Design a URL shortener system like bit.ly. Walk through the architecture, database design, and scalability considerations.', keywords: ['system design', 'base62 encoding', 'database', 'cache', 'load balancer', 'horizontal scaling', 'CDN', 'TTL'], model: 'API gateway → App server (base62 encoding) → Redis cache → NoSQL/SQL DB. Handle redirects via 301/302. Cache hot URLs. Use consistent hashing for scaling.' },
      { q: 'Explain the CAP theorem and how it applies to distributed database choices.', keywords: ['CAP theorem', 'consistency', 'availability', 'partition tolerance', 'eventual consistency', 'strong consistency'], model: 'CAP: a distributed system can guarantee only 2 of 3. CP: consistent + partition tolerant (MongoDB). AP: available + partition tolerant (Cassandra, DynamoDB).' }
    ]
  },
  coding: {
    beginner: [
      { q: 'Write a function to find all duplicate elements in an array of integers. Analyze the time and space complexity.', keywords: ['duplicate', 'hash set', 'O(n)', 'array', 'space complexity', 'time complexity'], model: 'Use a HashSet to track seen elements. O(n) time, O(n) space. Alternative: sort first O(n log n) time, O(1) space.', testCases: [{ input: '[1,2,3,2,4,1]', expectedOutput: '[1,2]' }, { input: '[5,5,5]', expectedOutput: '[5]' }, { input: '[1,2,3]', expectedOutput: '[]' }] },
      { q: 'Implement a function to check if a string is a palindrome, ignoring case and non-alphanumeric characters.', keywords: ['palindrome', 'two pointer', 'string manipulation', 'reverse', 'alphanumeric'], model: 'Use two pointers from both ends, skip non-alphanumeric, compare lowercase. O(n) time, O(1) space.', testCases: [{ input: '"racecar"', expectedOutput: 'true' }, { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true' }, { input: '"hello"', expectedOutput: 'false' }] }
    ],
    intermediate: [
      { q: 'Given an integer array, find two numbers that sum to a target value. Return their indices. Optimize for O(n) time complexity.', keywords: ['two sum', 'hash map', 'O(n)', 'complement', 'indices'], model: 'Hash map approach: for each element x, check if (target - x) exists in the map. O(n) time, O(n) space.', testCases: [{ input: 'nums=[2,7,11,15], target=9', expectedOutput: '[0,1]' }, { input: 'nums=[3,2,4], target=6', expectedOutput: '[1,2]' }] },
      { q: 'Implement a function to merge two sorted linked lists into one sorted linked list.', keywords: ['linked list', 'merge', 'sorted', 'recursion', 'iterative', 'pointer'], model: 'Iterative: use a dummy head and compare node values. Recursion: base cases for null lists, then compare heads recursively.', testCases: [{ input: 'l1=[1,2,4], l2=[1,3,4]', expectedOutput: '[1,1,2,3,4,4]' }, { input: 'l1=[], l2=[0]', expectedOutput: '[0]' }] }
    ],
    advanced: [
      { q: 'Find the longest substring without repeating characters and return its length. Aim for O(n) solution.', keywords: ['sliding window', 'hash map', 'two pointer', 'substring', 'O(n)', 'repeating'], model: 'Sliding window with a HashSet or HashMap tracking character positions. Shrink window left when duplicate found. O(n) time.', testCases: [{ input: '"abcabcbb"', expectedOutput: '3' }, { input: '"bbbbb"', expectedOutput: '1' }, { input: '"pwwkew"', expectedOutput: '3' }] }
    ]
  },
  aptitude: {
    beginner: [
      { q: 'A train travels 120 km in 2 hours. What is its speed in km/h? If it continues at the same speed, how far will it travel in 5 hours?', keywords: ['speed', 'distance', 'time', 'formula', '60 km/h', '300 km'], model: 'Speed = Distance / Time = 120/2 = 60 km/h. Distance in 5 hours = 60 × 5 = 300 km.' },
      { q: 'What comes next in the series: 2, 6, 12, 20, 30, ___?', keywords: ['pattern', 'series', 'difference', '42', 'arithmetic'], model: 'Differences: 4, 6, 8, 10, 12 → next difference is 12. Answer: 30 + 12 = 42. Pattern: n(n+1).' },
      { q: 'If all roses are flowers and some flowers fade quickly, can we conclude that some roses fade quickly?', keywords: ['logical reasoning', 'syllogism', 'cannot conclude', 'deductive reasoning'], model: 'Cannot conclude. Some flowers fade quickly, but those might not be roses. This is a classic syllogism fallacy.' }
    ],
    intermediate: [
      { q: 'A shopkeeper marks an item 40% above cost price and offers a 20% discount. What is the profit or loss percentage?', keywords: ['profit', 'loss', 'markup', 'discount', '12%', 'cost price'], model: 'If CP = 100, MP = 140. Discount 20% on MP → SP = 140 × 0.8 = 112. Profit = 12%. Formula: Profit% = (MP × (1 - d%) / CP - 1) × 100.' }
    ]
  },
  communication: [
    { q: 'Describe a complex technical concept to someone with no technical background. Choose any concept you find interesting.', keywords: ['analogy', 'clear', 'simple language', 'structure', 'audience-aware', 'engaging'], model: 'Use a relatable analogy, build from basics, avoid jargon, check for understanding. Evaluate clarity, structure, and accessibility.' },
    { q: 'You need to present bad news to a client — your team missed a deadline. How would you structure that conversation?', keywords: ['empathy', 'honest', 'solution-focused', 'apology', 'action plan', 'follow-up'], model: 'Acknowledge the issue immediately, take responsibility, explain briefly without excuses, present a concrete action plan, and commit to follow-up.' },
    { q: 'Walk me through how you would onboard a new junior developer to your team and codebase.', keywords: ['documentation', 'mentorship', 'pair programming', 'gradual', 'check-ins', 'feedback'], model: 'Structured onboarding: docs → guided setup → pair programming on small tasks → increasing autonomy → regular check-ins.' }
  ],
  placement_mixed: [] // built dynamically from other categories
};

// Populate placement_mixed
CURATED_QUESTIONS.placement_mixed = [
  ...CURATED_QUESTIONS.hr.fresher.slice(0, 2),
  ...CURATED_QUESTIONS.technical.intermediate.slice(0, 2),
  ...CURATED_QUESTIONS.coding.intermediate.slice(0, 1),
  ...CURATED_QUESTIONS.aptitude.beginner.slice(0, 1),
  ...CURATED_QUESTIONS.communication.slice(0, 1)
];

// ─── Helper: pick from curated bank ──────────────────────────────────────────
function pickCuratedQuestion(category, difficulty, role, excludeIds = []) {
  let pool = [];
  const catData = CURATED_QUESTIONS[category];
  if (!catData) pool = CURATED_QUESTIONS.placement_mixed;
  else if (Array.isArray(catData)) pool = catData;
  else {
    // difficulty-stratified
    pool = catData[difficulty] || catData.intermediate || catData.beginner || Object.values(catData).flat();
  }
  // Filter already used
  const available = pool.filter((_, i) => !excludeIds.includes(String(i)));
  const item = available[Math.floor(Math.random() * available.length)] || pool[0];
  if (!item) return null;
  return {
    id: `curated_${category}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    category,
    difficulty,
    question: item.q,
    contextHint: '',
    expectedKeywords: item.keywords || [],
    modelAnswer: item.model || '',
    source: 'predefined',
    testCases: item.testCases || [],
    rubricCriteria: [
      { criterion: 'Relevance', weight: 30, description: 'Answer addresses the core question.' },
      { criterion: 'Correctness', weight: 40, description: 'Technical accuracy of the answer.' },
      { criterion: 'Clarity', weight: 30, description: 'Clear explanation and structure.' }
    ]
  };
}

// ─── Gemini API call ──────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty Gemini response');
  // Strip markdown code fences if present
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

// ─── OpenAI API call ──────────────────────────────────────────────────────────
async function callOpenAI(prompt) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert AI placement interviewer. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI API ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  const rawText = data.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty OpenAI response');
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

async function callAI(prompt) {
  const provider = getEffectiveProvider();
  if (provider === 'gemini') return callGemini(prompt);
  if (provider === 'openai') return callOpenAI(prompt);
  throw new Error('No AI provider configured');
}

// ─── Route handlers ───────────────────────────────────────────────────────────

// GET /api/ai-status
function handleStatus(req, res) {
  const provider = getEffectiveProvider();
  sendJSON(res, 200, {
    provider,
    isLive: provider !== 'fallback',
    model: provider === 'gemini' ? GEMINI_MODEL : provider === 'openai' ? OPENAI_MODEL : null,
    message: provider === 'fallback'
      ? 'No AI provider configured. Using curated question bank (Predefined Questions).'
      : `Connected to ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} (${provider === 'gemini' ? GEMINI_MODEL : OPENAI_MODEL}).`
  });
}

// POST /api/generate-question
async function handleGenerateQuestion(req, res, body) {
  const {
    candidateName = 'Candidate',
    category = 'placement_mixed',
    role = 'Software Engineer',
    difficulty = 'intermediate',
    experienceLevel = 'fresher',
    language = 'en-US',
    questionNumber = 1,
    totalQuestions = 10,
    history = [],
    sessionId = '',
    resumeData = null,
    jobDescription = '',
    interviewFocus = 'balanced'
  } = body;

  const provider = getEffectiveProvider();

  if (provider !== 'fallback') {
    try {
      const previousQs = history.map(h => `Q${h.num}: "${h.question}"`).join('\n');
      const langInstruction = language.startsWith('te') ? 'Respond with the question in Telugu script. Technical terms (like React, Docker, Python) may remain in standard Latin script.' :
                              language.startsWith('hi') ? 'Respond with the question in Hindi. Technical terms may remain in standard Latin script.' :
                              language.startsWith('ta') ? 'Respond with the question in Tamil. Technical terms may remain in standard Latin script.' :
                              language.startsWith('kn') ? 'Respond with the question in Kannada. Technical terms may remain in standard Latin script.' :
                              language.startsWith('ml') ? 'Respond with the question in Malayalam. Technical terms may remain in standard Latin script.' :
                              'Respond in English.';

      // Construct resume and JD context
      let resumeContext = '';
      if (resumeData) {
        const projectsText = (resumeData.projects || []).map(p => 
          `- Project: "${p.title}" | Tech: ${p.technologies?.join(', ')} | Role: ${p.roleOrContribution || 'Contributor'} | Summary: ${p.description}`
        ).join('\n');
        const skillsText = (resumeData.technicalSkills || []).concat(resumeData.toolsAndTechnologies || []).join(', ');
        const expText = (resumeData.experience || []).map(e => `${e.role} at ${e.company} (${e.duration || ''})`).join('; ');
        const eduText = (resumeData.education || []).map(ed => `${ed.degree} from ${ed.institution}`).join('; ');

        resumeContext = `
CANDIDATE'S RESUME CONTEXT (EVALUATE AND VERIFY THESE CLAIMS):
- Candidate Skills: ${skillsText || 'None listed'}
- Listed Projects:
${projectsText || 'None listed'}
- Experience/Internships: ${expText || 'None listed'}
- Education: ${eduText || 'None listed'}
- Certifications: ${(resumeData.certifications || []).join(', ') || 'None'}

INTERVIEW FOCUS: "${interviewFocus}" (Prioritize questions matching this mode, such as deep-diving into a listed project's architecture, design decisions, data flow, failure modes, trade-offs, or testing strategies).
`;
      }

      let jdContext = '';
      if (jobDescription && jobDescription.trim()) {
        jdContext = `
TARGET JOB DESCRIPTION REQUIREMENTS:
${jobDescription.slice(0, 1500)}
Compare the candidate's stated experience against these requirements and verify real-world competence.
`;
      }

      const categoryGuidance = {
        hr: `HR/Behavioral: motivation, teamwork, STAR-method behavioral scenarios, career goals, situational conflict resolution for a ${experienceLevel} ${role}`,
        technical: `Technical depth: core concepts, system design, architectural trade-offs, and practical day-to-day engineering specifically for ${role} at ${experienceLevel} level`,
        coding: `Coding: algorithmic challenge with 2-3 test cases relevant to problem-solving in ${role}. Include a clear problem statement the candidate must implement.`,
        aptitude: `Aptitude: quantitative, logical reasoning, or architectural estimation question for ${role}`,
        communication: `Communication: open-ended scenario requiring structured verbal explanation and clarity for a ${role}`,
        placement_mixed: `Balanced interview round for a ${role} — question ${questionNumber} of ${totalQuestions}`
      };

      const prompt = `You are a distinguished senior hiring manager conducting an interactive interview for a ${role} position.

Candidate Name: ${candidateName}
Target Role: ${role}
Experience Level: ${experienceLevel}
Session: Question ${questionNumber} of ${totalQuestions}
Category: ${category} — ${categoryGuidance[category] || category}
Difficulty: ${difficulty}
Interview language: ${language}
${langInstruction}
${resumeContext}
${jdContext}

Previously asked questions (STRICT RULE: Do NOT repeat or rephrase any of these):
${previousQs || 'None yet.'}

MANDATORY INTERVIEWING RULES:
1. Address the candidate directly by name ("${candidateName}").
2. When resume data is available:
   - Ask for a clear explanation of their actual project architecture, data flow, their individual contribution, testing approaches, and technical trade-offs.
   - Explore why specific technologies were chosen over alternatives.
   - Test whether the candidate genuinely understands the skills they listed on their resume.
   - NEVER treat resume claims as proven facts; frame questions requesting the candidate to demonstrate and explain their experience.
3. If resume data is limited or generic, ask role-tailored practical engineering scenarios for a ${experienceLevel} ${role}.
4. Under no circumstances repeat any previously asked question.
5. Generate ONE fresh, unique, and challenging question.

Respond ONLY with this exact JSON structure:
{
  "question": "The full question text addressing ${candidateName}",
  "contextHint": "A brief tip or approach hint for the candidate (optional, shown only after answer)",
  "expectedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "modelAnswer": "A comprehensive model answer demonstrating ideal response",
  "difficulty": "${difficulty}",
  "testCases": [
    { "input": "...", "expectedOutput": "..." }
  ]
}

Note: testCases is only required for coding questions. For other types, use an empty array [].`;

      const aiData = await callAI(prompt);
      let formattedQ = aiData.question;
      if (!formattedQ.toLowerCase().includes(candidateName.toLowerCase())) {
        formattedQ = `${candidateName}, ${formattedQ}`;
      }

      const question = {
        id: `ai_${sessionId}_q${questionNumber}_${Date.now()}`,
        category,
        difficulty: aiData.difficulty || difficulty,
        question: formattedQ,
        contextHint: aiData.contextHint || '',
        expectedKeywords: aiData.expectedKeywords || [],
        modelAnswer: aiData.modelAnswer || '',
        source: 'ai_generated',
        isFollowUp: false,
        testCases: aiData.testCases || [],
        rubricCriteria: [
          { criterion: 'Relevance', weight: 25, description: 'Answer addresses the core question.' },
          { criterion: 'Correctness', weight: 35, description: 'Technical accuracy and factual correctness.' },
          { criterion: 'Completeness', weight: 20, description: 'Covers main aspects without major gaps.' },
          { criterion: 'Reasoning', weight: 20, description: 'Quality of explanation and logical reasoning.' }
        ]
      };
      sendJSON(res, 200, { question, provider: 'ai_generated' });
      return;
    } catch (err) {
      console.error('[AI] Generate question error, using fallback:', err.message);
    }
  }

  // Fallback: curated question bank tailored with candidate name and role
  const usedIds = history.map((_, i) => String(i));
  const question = pickCuratedQuestion(category, difficulty, role, usedIds);
  if (!question) {
    sendError(res, 500, 'No questions available');
    return;
  }
  if (!question.question.toLowerCase().includes(candidateName.toLowerCase())) {
    question.question = `${candidateName}, ${question.question}`;
  }
  sendJSON(res, 200, { question, provider: 'predefined' });
}

// POST /api/evaluate-answer
async function handleEvaluateAnswer(req, res, body) {
  const {
    question,
    answerText,
    timeSpentSeconds = 60,
    language = 'en-US',
    sessionContext = []
  } = body;

  if (!question || typeof answerText !== 'string') {
    sendError(res, 400, 'question and answerText (string) are required');
    return;
  }

  const provider = getEffectiveProvider();
  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;

  // Very short or empty answer — deterministic baseline evaluation
  if (wordCount < 4) {
    sendJSON(res, 200, {
      evaluation: {
        score: Math.max(10, Math.min(25, wordCount * 5)),
        accuracyScore: wordCount === 0 ? 10 : 20,
        clarityScore: wordCount === 0 ? 10 : 25,
        depthScore: wordCount === 0 ? 10 : 15,
        relevanceScore: wordCount === 0 ? 10 : 25,
        completenessScore: wordCount === 0 ? 10 : 15,
        reasoningScore: wordCount === 0 ? 10 : 15,
        matchedKeywords: [],
        missedKeywords: (question.expectedKeywords || []).slice(0, 4),
        feedback: wordCount === 0
          ? 'Question was skipped or no answer was submitted. Baseline score assigned.'
          : 'Your answer was too brief. Please provide a more detailed explanation.',
        keyStrengths: wordCount === 0 ? [] : ['Attempted response'],
        keyImprovements: [
          'Elaborate your answer with specific examples and technical details.',
          'Address the core concepts mentioned in the question prompt.'
        ],
        modelAnswer: question.modelAnswer || '',
        suggestFollowUp: false,
        followUpTopic: ''
      },
      source: 'deterministic'
    });
    return;
  }

  if (provider !== 'fallback') {
    try {
      const prevAnswers = (sessionContext || []).slice(-3).map(h =>
        `Q: "${h.q}" → Candidate: "${h.a.substring(0, 120)}${h.a.length > 120 ? '...' : ''}"`
      ).join('\n');

      const langInstruction = language.startsWith('en') ? 'Provide feedback in English.' :
        `Provide feedback in the interview language (language code: ${language}). Technical keywords may remain in English.`;

      const prompt = `You are an expert AI placement interviewer and evaluator.
${langInstruction}

Interview Question: "${question.question}"
Category: ${question.category}
Difficulty: ${question.difficulty}
Expected Key Concepts: ${(question.expectedKeywords || []).join(', ')}
Model Answer Reference: "${question.modelAnswer || 'N/A'}"

${prevAnswers ? `Recent interview context:\n${prevAnswers}\n` : ''}

Candidate's Answer (${wordCount} words, ${timeSpentSeconds}s): "${answerText}"

Evaluate this answer across all dimensions. Be fair, constructive, and specific.

Respond ONLY with this exact JSON:
{
  "score": number (0-100, overall weighted score),
  "accuracyScore": number (0-100, technical correctness),
  "clarityScore": number (0-100, how clear and structured),
  "depthScore": number (0-100, depth and elaboration),
  "relevanceScore": number (0-100, how on-topic),
  "completenessScore": number (0-100, coverage of key aspects),
  "reasoningScore": number (0-100, logical reasoning quality),
  "matchedKeywords": ["keyword1", "keyword2"],
  "missedKeywords": ["missing1", "missing2"],
  "feedback": "2-3 sentence constructive feedback",
  "keyStrengths": ["strength 1", "strength 2"],
  "keyImprovements": ["improvement 1", "improvement 2"],
  "modelAnswer": "Brief ideal answer highlight",
  "suggestFollowUp": boolean (true if answer reveals a gap worth exploring),
  "followUpTopic": "Brief topic for follow-up if suggestFollowUp is true"
}`;

      const aiData = await callAI(prompt);
      sendJSON(res, 200, {
        evaluation: {
          score: clamp(aiData.score || 65),
          accuracyScore: clamp(aiData.accuracyScore || 65),
          clarityScore: clamp(aiData.clarityScore || 65),
          depthScore: clamp(aiData.depthScore || 65),
          relevanceScore: clamp(aiData.relevanceScore || 65),
          completenessScore: clamp(aiData.completenessScore || 65),
          reasoningScore: clamp(aiData.reasoningScore || 65),
          matchedKeywords: aiData.matchedKeywords || [],
          missedKeywords: aiData.missedKeywords || [],
          feedback: aiData.feedback || 'Good attempt.',
          keyStrengths: aiData.keyStrengths || ['Attempted the question'],
          keyImprovements: aiData.keyImprovements || ['Provide more depth'],
          modelAnswer: aiData.modelAnswer || question.modelAnswer || '',
          suggestFollowUp: !!aiData.suggestFollowUp,
          followUpTopic: aiData.followUpTopic || ''
        },
        source: 'ai_evaluated'
      });
      return;
    } catch (err) {
      console.error('[AI] Evaluate error, using rubric fallback:', err.message);
    }
  }

  // Rubric fallback evaluation
  const evaluation = rubricEvaluate(question, answerText, wordCount, timeSpentSeconds);
  sendJSON(res, 200, { evaluation, source: 'rubric' });
}

// POST /api/generate-followup
async function handleGenerateFollowup(req, res, body) {
  const {
    originalQuestion,
    candidateAnswer,
    followUpTopic,
    language = 'en-US',
    category = 'technical',
    difficulty = 'intermediate'
  } = body;

  const provider = getEffectiveProvider();

  if (provider !== 'fallback') {
    try {
      const langInstruction = language.startsWith('en') ? 'Respond in English.' :
        `Respond in the interview language (language code: ${language}).`;

      const prompt = `You are an expert AI placement interviewer.
${langInstruction}

The candidate just answered this question:
Original Q: "${originalQuestion}"
Candidate's Answer: "${candidateAnswer}"
Follow-up Topic: "${followUpTopic || 'deeper understanding'}"

Generate ONE targeted follow-up question that:
1. Probes deeper into a gap or an interesting point from the candidate's answer
2. Is appropriately challenging for ${difficulty} difficulty
3. Feels natural and conversational

Respond ONLY with this exact JSON:
{
  "question": "The follow-up question text",
  "contextHint": "Brief hint for the candidate",
  "expectedKeywords": ["keyword1", "keyword2", "keyword3"],
  "modelAnswer": "Ideal answer for this follow-up"
}`;

      const aiData = await callAI(prompt);
      const followUp = {
        id: `followup_${Date.now()}`,
        category,
        difficulty,
        question: aiData.question,
        contextHint: aiData.contextHint || '',
        expectedKeywords: aiData.expectedKeywords || [],
        modelAnswer: aiData.modelAnswer || '',
        source: 'ai_generated',
        isFollowUp: true,
        parentQuestionId: body.originalQuestionId || null,
        testCases: [],
        rubricCriteria: [
          { criterion: 'Depth', weight: 50, description: 'Demonstrates deeper understanding.' },
          { criterion: 'Clarity', weight: 50, description: 'Clear and precise explanation.' }
        ]
      };
      sendJSON(res, 200, { followUp, provider: 'ai_generated' });
      return;
    } catch (err) {
      console.error('[AI] Follow-up error:', err.message);
    }
  }

  // Fallback follow-up
  const followUp = {
    id: `followup_${Date.now()}`,
    category,
    difficulty,
    question: `Can you elaborate further on your previous answer and provide a specific real-world example?`,
    contextHint: 'Use a concrete scenario from your experience or studies.',
    expectedKeywords: ['example', 'specific', 'scenario', 'real-world', 'implementation'],
    modelAnswer: 'A strong follow-up should provide concrete evidence with measurable outcomes.',
    source: 'predefined',
    isFollowUp: true,
    parentQuestionId: body.originalQuestionId || null,
    testCases: [],
    rubricCriteria: [
      { criterion: 'Depth', weight: 50, description: 'Demonstrates deeper understanding.' },
      { criterion: 'Clarity', weight: 50, description: 'Clear and precise explanation.' }
    ]
  };
  sendJSON(res, 200, { followUp, provider: 'predefined' });
}

// POST /api/generate-report
async function handleGenerateReport(req, res, body) {
  const { session, responses } = body;
  if (!session || !responses) { sendError(res, 400, 'session and responses required'); return; }

  const provider = getEffectiveProvider();

  if (provider !== 'fallback' && responses.length > 0) {
    try {
      const qaList = responses.map((r, i) =>
        `Q${i+1} [${r.category}]: "${r.questionText}"\nAnswer: "${r.answerText.substring(0, 200)}"\nScore: ${r.evaluations?.score || 0}/100`
      ).join('\n\n');

      const prompt = `You are an expert AI placement interviewer writing a final evaluation report.

Candidate: ${session.role} (${session.experienceLevel})
Interview Type: ${session.type}
Overall Average Score: ${Math.round(responses.reduce((a, r) => a + (r.evaluations?.score || 0), 0) / responses.length)}/100

Q&A Summary:
${qaList}

Write a comprehensive, honest, and encouraging placement readiness report.

Respond ONLY with this exact JSON:
{
  "overallSummary": "3-4 sentence honest assessment of candidate's readiness",
  "readinessStatus": "Placement Ready" | "Promising Candidate" | "Needs Practice" | "Foundational Review Needed",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "categoryInsights": "2-3 sentences about performance patterns across question categories",
  "nextSteps": ["actionable step 1", "actionable step 2", "actionable step 3"]
}`;

      const aiData = await callAI(prompt);
      sendJSON(res, 200, {
        summary: {
          overallSummary: aiData.overallSummary || 'Interview completed.',
          readinessStatus: aiData.readinessStatus || 'Needs Practice',
          strengths: aiData.strengths || [],
          improvements: aiData.improvements || [],
          categoryInsights: aiData.categoryInsights || '',
          nextSteps: aiData.nextSteps || [],
          categoryScores: buildCategoryScores(responses)
        },
        source: 'ai_generated'
      });
      return;
    } catch (err) {
      console.error('[AI] Report generation error:', err.message);
    }
  }

  // Fallback report
  const totalQuestions = responses.length;
  const categoryScores = buildCategoryScores(responses);
  const categoryWeights = categoryScores.map(cs => {
    const weightPercent = Math.round((cs.totalQuestions / Math.max(totalQuestions, 1)) * 100);
    const weightedContribution = Math.round((cs.score * weightPercent) / 100);
    return {
      category: cs.category,
      weightPercent,
      score: cs.score,
      weightedContribution,
      criteriaDescription: cs.criteriaDescription || 'Evaluated against category benchmarks'
    };
  });

  const totalWeightedScore = categoryWeights.reduce((acc, cw) => acc + cw.weightedContribution, 0);
  const avgScore = totalQuestions > 0 ? Math.min(100, Math.max(0, totalWeightedScore)) : 0;
  const status = avgScore >= 80 ? 'Placement Ready' : avgScore >= 65 ? 'Promising Candidate' : avgScore >= 50 ? 'Needs Practice' : 'Foundational Review Needed';

  const weakest = [...categoryScores].sort((a, b) => a.score - b.score)[0];
  const recommendedTopics = weakest?.category === 'coding'
    ? ['Algorithmic Complexity (Big-O)', 'Edge Case Handling', 'Data Structure Implementation']
    : weakest?.category === 'hr'
    ? ['STAR Behavioral Storytelling', 'Conflict Management Scenarios', 'Impact & Leadership Metrics']
    : weakest?.category === 'aptitude'
    ? ['Quantitative Problem Shortcuts', 'Logical Deduction Patterns', 'Speed Calculation Techniques']
    : ['System Design Core Principles', 'Database Query Optimization', 'API Status Codes & Architecture'];

  const nextPracticeRecommendation = avgScore >= 80
    ? `Strong performance! Challenge yourself with an Advanced interview round or timed placement mixed practice.`
    : avgScore >= 65
    ? `Good foundation! Target your next 15-minute practice session specifically on ${weakest?.category || 'technical'} questions to push your score above 80%.`
    : `Practice speaking your answers aloud using the model exemplars and focus on explaining core concepts clearly in your next session.`;

  sendJSON(res, 200, {
    summary: {
      overallSummary: avgScore >= 70
        ? `Strong performance across ${totalQuestions} questions with an overall weighted score of ${avgScore}/100.`
        : `Solid attempt with an overall weighted score of ${avgScore}/100. Targeted practice on weak areas will significantly improve your interview readiness.`,
      readinessStatus: status,
      strengths: Array.from(new Set(responses.flatMap(r => r.evaluations?.keyStrengths || []))).filter(Boolean).slice(0, 4),
      improvements: Array.from(new Set(responses.flatMap(r => r.evaluations?.keyImprovements || []))).filter(Boolean).slice(0, 4),
      categoryScores,
      categoryWeights,
      recommendedTopics,
      nextPracticeRecommendation,
      disclaimer: 'Disclaimer: AI Interview Pro is an educational practice and self-improvement tool. Practice interview scores reflect preparation metrics under simulated conditions and do not guarantee employment, selection, or specific hiring outcomes with any organization.',
      source: 'rubric'
    },
    source: 'rubric'
  });
}

// ─── Rubric-based evaluation fallback with category-specific criteria ───────
function rubricEvaluate(question, answer, wordCount, timeSpentSeconds) {
  const category = question.category || 'technical';
  const keywords = question.expectedKeywords || [];
  const lowerAnswer = answer.toLowerCase();
  const matched = keywords.filter(k => lowerAnswer.includes(k.toLowerCase()));
  const missed = keywords.filter(k => !lowerAnswer.includes(k.toLowerCase()));
  const keywordRatio = keywords.length > 0 ? matched.length / keywords.length : 0.5;

  const structureMarkers = ['because', 'for example', 'however', 'therefore', 'first', 'second', 'finally', 'in addition', 'specifically'];
  const structureCount = structureMarkers.filter(m => lowerAnswer.includes(m)).length;

  const accuracyScore = clamp(Math.round(keywordRatio * 70 + (wordCount > 30 ? 25 : 10)));
  const clarityScore = clamp(Math.round(Math.min(90, structureCount * 15 + 30 + (wordCount > 40 ? 15 : 0))));
  const depthScore = wordCount >= 60 ? 88 : wordCount >= 35 ? 72 : wordCount >= 20 ? 58 : 38;
  const relevanceScore = clamp(Math.round(keywordRatio * 80 + 20));
  const completenessScore = clamp(Math.round((matched.length / Math.max(keywords.length, 1)) * 85 + 15));
  const reasoningScore = clamp(Math.round(structureCount * 12 + (wordCount > 50 ? 40 : 20)));

  let score = 0;
  if (category === 'hr') {
    // HR: Clarity 35%, Relevance 25%, Reasoning 25%, Completeness 15% (Coding: 0%)
    score = clamp(Math.round(clarityScore * 0.35 + relevanceScore * 0.25 + reasoningScore * 0.25 + completenessScore * 0.15));
  } else if (category === 'coding') {
    // Coding: Reasoning 35%, Accuracy 35%, Completeness 20%, Clarity 10%
    score = clamp(Math.round(reasoningScore * 0.35 + accuracyScore * 0.35 + completenessScore * 0.20 + clarityScore * 0.10));
  } else if (category === 'aptitude') {
    // Aptitude: Reasoning 40%, Accuracy 35%, Relevance 15%, Clarity 10%
    score = clamp(Math.round(reasoningScore * 0.40 + accuracyScore * 0.35 + relevanceScore * 0.15 + clarityScore * 0.10));
  } else if (category === 'communication') {
    // Communication: Clarity 40%, Relevance 25%, Completeness 20%, Reasoning 15%
    score = clamp(Math.round(clarityScore * 0.40 + relevanceScore * 0.25 + completenessScore * 0.20 + reasoningScore * 0.15));
  } else {
    // Technical: Accuracy 40%, Completeness 20%, Reasoning 20%, Relevance 10%, Clarity 10%
    score = clamp(Math.round(accuracyScore * 0.40 + completenessScore * 0.20 + reasoningScore * 0.20 + relevanceScore * 0.10 + clarityScore * 0.10));
  }

  const missingPoints = missed.length > 0 ? [`Omitted key domain concepts: ${missed.slice(0, 3).join(', ')}`] : [];
  if (wordCount < 30) missingPoints.push('Response lacked elaboration and practical example scenarios.');

  return {
    score, accuracyScore, clarityScore, depthScore, relevanceScore, completenessScore, reasoningScore,
    matchedKeywords: matched,
    missedKeywords: missed.slice(0, 5),
    missingPoints,
    suggestedImprovedAnswer: question.modelAnswer || 'Structure your response clearly with definitions, mechanism explanation, and practical use case.',
    feedback: score >= 70 ? 'Good answer! You covered the key concepts well.' : 'Your answer shows understanding but could benefit from more depth and specific examples.',
    keyStrengths: matched.length >= 2 ? [`Covered key concepts: ${matched.slice(0, 2).join(', ')}`] : ['Attempted the question'],
    keyImprovements: missed.length > 0 ? [`Include these concepts: ${missed.slice(0, 2).join(', ')}`] : ['Provide more real-world examples'],
    modelAnswer: question.modelAnswer || '',
    suggestFollowUp: keywordRatio < 0.5 && wordCount > 10
  };
}

const CATEGORY_DOCS = {
  hr: 'Communication Clarity (35%), Situational Relevance (25%), STAR Reasoning (25%), Completeness (15%)',
  technical: 'Technical Correctness (40%), Completeness (20%), Engineering Reasoning (20%), Relevance (10%), Clarity (10%)',
  coding: 'Automated Test Results (45%), Algorithmic Reasoning (25%), Technical Correctness (20%), Code Clarity (10%)',
  aptitude: 'Problem-solving & Logic (40%), Accuracy (35%), Method Relevance (15%), Clarity (10%)',
  communication: 'Communication Clarity (40%), Topic Relevance (25%), Completeness (20%), Reasoning (15%)'
};

function buildCategoryScores(responses) {
  const map = {};
  responses.forEach(r => {
    const cat = r.category || 'general';
    if (!map[cat]) map[cat] = { total: 0, count: 0 };
    map[cat].total += r.evaluations?.score || 0;
    map[cat].count++;
  });
  return Object.keys(map).map(cat => ({
    category: cat,
    score: Math.round(map[cat].total / map[cat].count),
    totalQuestions: map[cat].count,
    status: map[cat].total / map[cat].count >= 75 ? 'excellent' : map[cat].total / map[cat].count >= 60 ? 'good' : 'needs_work',
    criteriaDescription: CATEGORY_DOCS[cat] || 'Standard rubric evaluation'
  }));
}

function clamp(n) { return Math.min(100, Math.max(0, Math.round(n))); }

// ─── HTTP utilities ───────────────────────────────────────────────────────────
function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJSON(res, status, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// ─── POST /api/upload-resume (Feature 1) ─────────────────────────────────────
async function handleUploadResume(req, res, body) {
  const { fileBase64, fileName, mimeType, fileSize } = body;
  if (!fileBase64 || !fileName) {
    sendError(res, 400, 'fileBase64 and fileName are required');
    return;
  }

  try {
    const { text, isScanned, warnings } = await extractTextFromDocument(fileBase64, fileName, mimeType);

    // Baseline heuristic parse
    const parsed = heuristicParseResumeText(text, fileName);

    const provider = getEffectiveProvider();
    let finalParsed = parsed;

    // AI-enhanced extraction if available
    if (provider !== 'fallback' && text.length >= 50) {
      try {
        const prompt = `You are an expert AI talent acquisition specialist analyzing an uploaded candidate resume.
Extract structured information accurately from the resume text below.
STRICT RULES:
1. DO NOT invent missing information or hallucinate facts not present in the text.
2. If a section is missing from the resume, leave the array empty or string blank.
3. Distinguish technical skills from soft skills and tools.

Resume Text:
"""
${text.slice(0, 7000)}
"""

Respond ONLY with this exact JSON structure:
{
  "candidateName": "Full name or Candidate",
  "email": "candidate email or empty",
  "phone": "candidate phone or empty",
  "location": "location/city or empty",
  "linkedinUrl": "url or empty",
  "githubUrl": "url or empty",
  "summary": "2-3 sentence executive professional summary of their stated background",
  "education": [
    { "institution": "...", "degree": "...", "fieldOfStudy": "...", "year": "...", "scoreOrGrade": "..." }
  ],
  "technicalSkills": ["skill1", "skill2"],
  "softSkills": ["skill1", "skill2"],
  "projects": [
    { "title": "Project Name", "description": "Overview of project", "technologies": ["tech1", "tech2"], "roleOrContribution": "..." }
  ],
  "experience": [
    { "company": "Company Name", "role": "Title", "duration": "...", "description": "...", "technologies": ["..."] }
  ],
  "certifications": ["cert1"],
  "toolsAndTechnologies": ["Git", "Docker", "..."],
  "achievements": ["achievement1"]
}`;

        const aiResult = await callAI(prompt);
        if (aiResult && (aiResult.candidateName || (aiResult.technicalSkills && aiResult.technicalSkills.length > 0))) {
          finalParsed = {
            candidateName: aiResult.candidateName || parsed.candidateName,
            email: aiResult.email || parsed.email,
            phone: aiResult.phone || parsed.phone,
            location: aiResult.location || parsed.location,
            linkedinUrl: aiResult.linkedinUrl || parsed.linkedinUrl,
            githubUrl: aiResult.githubUrl || parsed.githubUrl,
            summary: aiResult.summary || parsed.summary,
            education: Array.isArray(aiResult.education) && aiResult.education.length > 0 ? aiResult.education : parsed.education,
            technicalSkills: Array.isArray(aiResult.technicalSkills) && aiResult.technicalSkills.length > 0 ? aiResult.technicalSkills : parsed.technicalSkills,
            softSkills: Array.isArray(aiResult.softSkills) && aiResult.softSkills.length > 0 ? aiResult.softSkills : parsed.softSkills,
            projects: Array.isArray(aiResult.projects) && aiResult.projects.length > 0 ? aiResult.projects : parsed.projects,
            experience: Array.isArray(aiResult.experience) && aiResult.experience.length > 0 ? aiResult.experience : parsed.experience,
            certifications: Array.isArray(aiResult.certifications) ? aiResult.certifications : parsed.certifications,
            toolsAndTechnologies: Array.isArray(aiResult.toolsAndTechnologies) ? aiResult.toolsAndTechnologies : parsed.toolsAndTechnologies,
            achievements: Array.isArray(aiResult.achievements) ? aiResult.achievements : parsed.achievements
          };
        }
      } catch (aiErr) {
        console.warn('[AI Resume Extraction] AI enhancement skipped, using heuristic parse:', aiErr.message);
      }
    }

    const resumeDataObj = {
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fileName,
      fileSize: fileSize || Buffer.from(fileBase64, 'base64').length,
      extractedAt: new Date().toISOString(),
      rawTextPreview: text.slice(0, 600),
      candidateName: finalParsed.candidateName || 'Candidate',
      email: finalParsed.email || '',
      phone: finalParsed.phone || '',
      location: finalParsed.location || '',
      linkedinUrl: finalParsed.linkedinUrl || '',
      githubUrl: finalParsed.githubUrl || '',
      summary: finalParsed.summary || '',
      education: finalParsed.education || [],
      technicalSkills: finalParsed.technicalSkills || [],
      softSkills: finalParsed.softSkills || [],
      projects: finalParsed.projects || [],
      experience: finalParsed.experience || [],
      certifications: finalParsed.certifications || [],
      toolsAndTechnologies: finalParsed.toolsAndTechnologies || [],
      achievements: finalParsed.achievements || [],
      isScannedOrNoText: isScanned,
      warnings
    };

    sendJSON(res, 200, {
      success: true,
      resumeData: resumeDataObj,
      data: resumeDataObj,
      warnings
    });
  } catch (err) {
    console.error('[Upload Resume] Error:', err.message);
    sendError(res, 400, err.message || 'Failed to process resume file.');
  }
}

// ─── POST /api/analyze-jd (Feature 3) ─────────────────────────────────────────
async function handleAnalyzeJD(req, res, body) {
  const { resumeData, jobDescription, targetRole } = body;
  if (!jobDescription || typeof jobDescription !== 'string' || !jobDescription.trim()) {
    sendError(res, 400, 'jobDescription text is required');
    return;
  }

  const jdText = jobDescription.trim();
  const candidateSkills = (resumeData?.technicalSkills || []).concat(resumeData?.toolsAndTechnologies || []);
  const candidateProjects = (resumeData?.projects || []).map(p => `${p.title}: ${p.technologies?.join(', ')}`);

  const provider = getEffectiveProvider();

  if (provider !== 'fallback') {
    try {
      const prompt = `You are a senior technical hiring manager analyzing a candidate's resume against a target Job Description (JD).
Role Target: ${targetRole || 'Software Engineer'}

Candidate's Stated Skills on Resume:
${candidateSkills.join(', ') || 'None listed explicitly'}

Candidate's Projects:
${candidateProjects.join('\n') || 'None listed'}

Job Description:
"""
${jdText.slice(0, 4000)}
"""

CRITICAL FAIRNESS RULE:
- Clearly distinguish between a skill that is "missing from the resume" and a candidate's inability. DO NOT infer inability merely because a skill wasn't mentioned on the resume.

Respond ONLY with this exact JSON:
{
  "targetJobTitle": "${targetRole || 'Target Role'}",
  "relevantSkillsFound": ["skills present on resume matching JD"],
  "missingRequiredSkills": ["skills mentioned in JD that are not evident on the resume"],
  "interviewFocusTopics": ["topic 1", "topic 2", "topic 3", "topic 4"],
  "matchScorePercent": number (0-100, fair alignment score),
  "summary": "3-4 sentence objective analysis of how the candidate's stated background compares to role requirements",
  "roleSpecificPlan": [
    "Step 1: Inquire about ...",
    "Step 2: Deep dive into ...",
    "Step 3: Evaluate missing JD requirement ...",
    "Step 4: Behavioral assessment for team fit"
  ]
}`;

      const aiMatch = await callAI(prompt);
      sendJSON(res, 200, {
        matchAnalysis: {
          targetJobTitle: aiMatch.targetJobTitle || targetRole || 'Target Role',
          relevantSkillsFound: aiMatch.relevantSkillsFound || candidateSkills.slice(0, 5),
          missingRequiredSkills: aiMatch.missingRequiredSkills || [],
          interviewFocusTopics: aiMatch.interviewFocusTopics || ['Core Fundamentals', 'Project Architecture', 'Problem Solving'],
          matchScorePercent: clamp(aiMatch.matchScorePercent || 70),
          summary: aiMatch.summary || 'Resume provides a solid foundational match for the target role with areas identified for interview verification.',
          roleSpecificPlan: aiMatch.roleSpecificPlan || [
            'Explore technical architecture of listed projects',
            'Validate hands-on experience in core required tools',
            'Assess adaptability to missing JD skills'
          ]
        },
        source: 'ai_generated'
      });
      return;
    } catch (err) {
      console.warn('[AI JD Analysis] Error, falling back to deterministic match:', err.message);
    }
  }

  // Deterministic JD match fallback
  const commonTech = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'SQL',
    'PostgreSQL', 'Docker', 'AWS', 'Kubernetes', 'REST API', 'GraphQL', 'Git', 'Linux'
  ];
  const jdLower = jdText.toLowerCase();
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const jdRequired = commonTech.filter(t => new RegExp(`(^|[^a-zA-Z0-9+#])${escapeRegex(t)}($|[^a-zA-Z0-9+#])`, 'i').test(jdLower));
  const matchedSkills = candidateSkills.filter(s => jdRequired.some(j => j.toLowerCase() === s.toLowerCase()));
  const missingSkills = jdRequired.filter(j => !matchedSkills.some(m => m.toLowerCase() === j.toLowerCase()));
  const matchRatio = jdRequired.length > 0 ? matchedSkills.length / jdRequired.length : 0.7;
  const matchScore = clamp(Math.round(matchRatio * 60 + 35));

  const analysisData = {
    targetJobTitle: targetRole || 'Software Engineer',
    relevantSkillsFound: matchedSkills.length > 0 ? matchedSkills : candidateSkills.slice(0, 4),
    missingRequiredSkills: missingSkills,
    interviewFocusTopics: ['Project Architecture', 'Hands-on Technical Depth', 'System Problem Solving', 'Adaptability'],
    matchScorePercent: matchScore,
    summary: `The candidate demonstrates ${matchedSkills.length} matching skills mentioned in the job description. The interview will explore these projects and verify foundational readiness for ${targetRole || 'the role'}.`,
    roleSpecificPlan: [
      'Explore candidate project architecture and tech stack choices',
      'Inquire into problem-solving approaches under real constraints',
      'Verify conceptual understanding of skills not explicitly mentioned on resume'
    ]
  };

  sendJSON(res, 200, {
    matchAnalysis: analysisData,
    analysis: analysisData,
    source: 'deterministic'
  });
}

// ─── POST /api/generate-recommendation (Feature 6) ───────────────────────────
async function handleFinalRecommendation(req, res, body) {
  const { session, responses, resumeData, jobDescription } = body;
  if (!session || !responses) {
    sendError(res, 400, 'session and responses required');
    return;
  }

  const overallScore = typeof session.overallScore === 'number'
    ? session.overallScore
    : Math.round(responses.reduce((acc, r) => acc + (r.evaluations?.score || 0), 0) / Math.max(responses.length, 1));

  const passingThreshold = 75;
  const borderlineThreshold = 55;

  const getWordCount = (r) => typeof r.wordCount === 'number' ? r.wordCount : (r.answerText || '').trim().split(/\s+/).filter(Boolean).length;

  let defaultStatus = 'borderline';
  let defaultLabel = 'Borderline — Additional Assessment Recommended';
  if (responses.length === 0 || responses.every(r => getWordCount(r) < 3)) {
    defaultStatus = 'inconclusive';
    defaultLabel = 'Inconclusive — Insufficient Evidence to Evaluate';
  } else if (overallScore >= passingThreshold) {
    defaultStatus = 'recommended';
    defaultLabel = 'Recommended for Next Round';
  } else if (overallScore < borderlineThreshold) {
    defaultStatus = 'not_recommended';
    defaultLabel = 'Not Recommended for Next Round Based on Practice Assessment';
  }

  const provider = getEffectiveProvider();

  if (provider !== 'fallback' && responses.length > 0 && defaultStatus !== 'inconclusive') {
    try {
      const qaSummaries = responses.map((r, i) =>
        `Q${i+1} [${r.category}]: "${r.questionText}"\nCandidate Answer: "${r.answerText.substring(0, 180)}"\nScore: ${r.evaluations?.score || 0}/100\nFeedback: ${r.evaluations?.feedback || ''}`
      ).join('\n\n');

      const prompt = `You are a senior technical hiring panel lead finalizing an evidence-based candidate selection recommendation.
This is an educational practice assessment.
Candidate Name: ${session.candidateName || 'Candidate'}
Target Role: ${session.role} (${session.experienceLevel})
Overall Score: ${overallScore}/100 (Passing: ${passingThreshold}, Borderline: ${borderlineThreshold})

${resumeData ? `Resume Projects: ${(resumeData.projects || []).map(p => p.title).join(', ')}\nResume Skills: ${(resumeData.technicalSkills || []).join(', ')}` : ''}
${jobDescription ? `Job Description: ${jobDescription.slice(0, 600)}...` : ''}

Interview Performance:
${qaSummaries}

STRICT FAIRNESS & LEGAL REQUIREMENTS:
1. MUST NOT discriminate on personal traits, age, religion, gender, ethnicity, dialect, or accent.
2. DO NOT penalize missing skills on resume if candidate demonstrated competence in the interview.
3. Ground the recommendation SOLELY on demonstrated evidence from the answers.
4. Outcome MUST be strictly one of: "recommended", "borderline", "not_recommended", "inconclusive".

Respond ONLY with this exact JSON:
{
  "status": "${defaultStatus}",
  "statusLabel": "${defaultLabel}",
  "headline": "1-sentence executive summary headline",
  "explanation": "3-4 sentence comprehensive explanation citing specific questions and demonstrated competencies",
  "confidenceLevel": "High" | "Medium" | "Low",
  "demonstratedSkills": ["skill1", "skill2", "skill3"],
  "convincinglyExplainedProjects": ["project1", "project2"],
  "claimsNeedingClarification": ["claim/topic needing more proof"],
  "jobRelevantStrengths": ["strength 1", "strength 2"],
  "skillsRequiringPractice": ["skill needing revision"],
  "decisionFactors": [
    { "factor": "Factor Name", "impact": "positive" | "neutral" | "gap", "detail": "explanation..." }
  ]
}`;

      const aiRec = await callAI(prompt);
      sendJSON(res, 200, {
        recommendation: {
          status: aiRec.status || defaultStatus,
          statusLabel: aiRec.statusLabel || defaultLabel,
          headline: aiRec.headline || `${session.candidateName} achieved an overall score of ${overallScore}/100.`,
          explanation: aiRec.explanation || `The candidate answered ${responses.length} questions demonstrating practical familiarity with their stated skillset.`,
          confidenceLevel: aiRec.confidenceLevel || 'High',
          overallScore,
          passingThreshold,
          borderlineThreshold,
          demonstratedSkills: aiRec.demonstratedSkills || (resumeData?.technicalSkills || []).slice(0, 4),
          convincinglyExplainedProjects: aiRec.convincinglyExplainedProjects || (resumeData?.projects || []).slice(0, 2).map(p => p.title),
          claimsNeedingClarification: aiRec.claimsNeedingClarification || ['In-depth scalability metrics under enterprise load'],
          jobRelevantStrengths: aiRec.jobRelevantStrengths || ['Clear architectural communication', 'Demonstrated problem-solving structure'],
          skillsRequiringPractice: aiRec.skillsRequiringPractice || ['Algorithmic edge case handling and time complexity trade-offs'],
          decisionFactors: aiRec.decisionFactors || [
            { factor: 'Technical Knowledge', impact: overallScore >= 70 ? 'positive' : 'gap', detail: `Scored ${overallScore}% across core role competencies.` }
          ],
          fairnessNotice: 'Fairness Notice: AI Interview Pro is an advisory practice assessment tool. Recommendations are strictly educational and performance-driven. Hiring decisions should always be conducted by human professionals without bias.'
        },
        source: 'ai_generated'
      });
      return;
    } catch (err) {
      console.warn('[AI Recommendation] Error, falling back to deterministic recommendation:', err.message);
    }
  }

  // Deterministic recommendation fallback
  const allStrengths = Array.from(new Set(responses.flatMap(r => r.evaluations?.keyStrengths || []))).slice(0, 4);
  const allImprovements = Array.from(new Set(responses.flatMap(r => r.evaluations?.keyImprovements || []))).slice(0, 3);
  const demonstrated = (resumeData?.technicalSkills || []).slice(0, 4);

  sendJSON(res, 200, {
    recommendation: {
      status: defaultStatus,
      statusLabel: defaultLabel,
      headline: overallScore >= passingThreshold
        ? `${session.candidateName || 'Candidate'} demonstrated strong role competency scoring ${overallScore}/100.`
        : overallScore >= borderlineThreshold
        ? `${session.candidateName || 'Candidate'} demonstrated good foundational knowledge with targeted areas for improvement (${overallScore}/100).`
        : `${session.candidateName || 'Candidate'} scored ${overallScore}/100; further practice in core concepts is advised.`,
      explanation: `Based on ${responses.length} evaluated responses, the candidate achieved an overall weighted score of ${overallScore}/100 against a passing benchmark of ${passingThreshold}%. The assessment evaluated substantive clarity, technical accuracy, and structured reasoning.`,
      confidenceLevel: responses.length >= 4 ? 'High' : 'Medium',
      overallScore,
      passingThreshold,
      borderlineThreshold,
      demonstratedSkills: demonstrated.length > 0 ? demonstrated : ['Problem Solving', 'Communication', 'Technical Fundamentals'],
      convincinglyExplainedProjects: (resumeData?.projects || []).slice(0, 2).map(p => p.title),
      claimsNeedingClarification: ['Architectural trade-offs under production scaling'],
      jobRelevantStrengths: allStrengths.length > 0 ? allStrengths : ['Structured response delivery', 'Engagement with question prompts'],
      skillsRequiringPractice: allImprovements.length > 0 ? allImprovements : ['Deeper technical elaboration', 'Real-world scenario examples'],
      decisionFactors: [
        {
          factor: 'Overall Performance Benchmark',
          impact: overallScore >= passingThreshold ? 'positive' : overallScore >= borderlineThreshold ? 'neutral' : 'gap',
          detail: `Earned ${overallScore}/100 across evaluated rubrics.`
        },
        {
          factor: 'Interview Evidence',
          impact: responses.length >= 3 ? 'positive' : 'neutral',
          detail: `Attempted and submitted ${responses.length} questions.`
        }
      ],
      fairnessNotice: 'Fairness Notice: AI Interview Pro is an advisory practice assessment tool. Recommendations are strictly educational and performance-driven. Hiring decisions should always be conducted by human professionals without bias.'
    },
    source: 'deterministic'
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if ((pathname === '/api/ai-status' || pathname === '/api/status') && req.method === 'GET') {
      return handleStatus(req, res);
    }
    if (pathname === '/api/upload-resume' && req.method === 'POST') {
      const body = await readBody(req);
      return handleUploadResume(req, res, body);
    }
    if (pathname === '/api/analyze-jd' && req.method === 'POST') {
      const body = await readBody(req);
      return handleAnalyzeJD(req, res, body);
    }
    if (pathname === '/api/generate-recommendation' && req.method === 'POST') {
      const body = await readBody(req);
      return handleFinalRecommendation(req, res, body);
    }
    if (pathname === '/api/generate-question' && req.method === 'POST') {
      const body = await readBody(req);
      return handleGenerateQuestion(req, res, body);
    }
    if (pathname === '/api/evaluate-answer' && req.method === 'POST') {
      const body = await readBody(req);
      return handleEvaluateAnswer(req, res, body);
    }
    if (pathname === '/api/generate-followup' && req.method === 'POST') {
      const body = await readBody(req);
      return handleGenerateFollowup(req, res, body);
    }
    if (pathname === '/api/generate-report' && req.method === 'POST') {
      const body = await readBody(req);
      return handleGenerateReport(req, res, body);
    }
    sendError(res, 404, `Route not found: ${pathname}`);
  } catch (err) {
    console.error('[Server] Unhandled error:', err);
    sendError(res, 500, 'Internal server error');
  }
});

server.listen(PORT, HOST, () => {
  const provider = getEffectiveProvider();
  console.log(`\n🤖 AI Interview Pro — Backend AI Service`);
  console.log(`📡 Running on http://${HOST}:${PORT}`);
  console.log(`🧠 AI Provider: ${provider === 'fallback' ? '⚠️  FALLBACK (curated bank) — add API key to .env' : `✅ ${provider.toUpperCase()} (${provider === 'gemini' ? GEMINI_MODEL : OPENAI_MODEL})`}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /api/ai-status`);
  console.log(`  POST /api/upload-resume`);
  console.log(`  POST /api/analyze-jd`);
  console.log(`  POST /api/generate-recommendation`);
  console.log(`  POST /api/generate-question`);
  console.log(`  POST /api/evaluate-answer`);
  console.log(`  POST /api/generate-followup`);
  console.log(`  POST /api/generate-report\n`);
});

server.on('error', (err) => {
  console.error('[Server] Error:', err.message);
  process.exit(1);
});
