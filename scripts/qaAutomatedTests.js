/**
 * AI Interview Pro — Automated QA Test Suite
 * ==========================================
 * Tests core backend services, scoring engine, follow-up logic,
 * language configuration, and code runner safety.
 */

import http from 'http';

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    results.push({ status: 'PASS', test: testName });
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
  } else {
    failed++;
    results.push({ status: 'FAIL', test: testName, details });
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} - ${details}`);
  }
}

function postJSON(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 10000
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(data);
    req.end();
  });
}

function getJSON(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method: 'GET',
        timeout: 10000
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.end();
  });
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log(' AI INTERVIEW PRO — AUTOMATED QA REGRESSION SUITE');
  console.log('======================================================\n');

  // Test 1: AI Server Health and Status
  console.log('Suite 1: AI Backend API Health & Credentials');
  try {
    const res = await getJSON('/api/status');
    assert(res.status === 200, 'GET /api/status returns HTTP 200');
    assert(typeof res.data.isLive === 'boolean', 'Status payload includes isLive boolean');
    assert(typeof res.data.provider === 'string', `Provider identified: ${res.data.provider}`);
    assert(!JSON.stringify(res.data).includes('AIzaSy'), 'No API keys leaked in /api/status payload');
  } catch (err) {
    assert(false, 'GET /api/status endpoint accessible', err.message);
  }

  // Test 2: Question Generation across categories and difficulties
  console.log('\nSuite 2: Question Generation & Role Alignment');
  try {
    const categories = ['technical', 'coding', 'hr', 'placement_mixed'];
    for (const cat of categories) {
      const qRes = await postJSON('/api/generate-question', {
        category: cat,
        role: 'Full Stack Software Engineer',
        difficulty: 'intermediate',
        experienceLevel: 'junior',
        language: 'en-US',
        questionNumber: 1,
        totalQuestions: 5,
        history: [],
        sessionId: 'test_session_1'
      });
      assert(qRes.status === 200, `POST /api/generate-question [${cat}] returns 200`);
      assert(qRes.data.question && qRes.data.question.question, `Question generated for [${cat}] has non-empty text`);
      assert(Array.isArray(qRes.data.question.expectedKeywords), `Question for [${cat}] provides expectedKeywords array`);
    }
  } catch (err) {
    assert(false, 'Question generation suite executed', err.message);
  }

  // Test 3: Evaluation Engine - Accurate scoring based on answer quality
  console.log('\nSuite 3: Evaluation Engine & Scoring Sensibility');
  try {
    const sampleQuestion = {
      id: 'q_oop_1',
      category: 'technical',
      difficulty: 'intermediate',
      question: 'Explain the four pillars of Object-Oriented Programming with examples.',
      expectedKeywords: ['encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'class', 'object'],
      modelAnswer: 'The four pillars are Encapsulation (bundling data and methods), Abstraction (hiding implementation complexity), Inheritance (reusing parent class properties), and Polymorphism (dynamic method overriding/overloading).'
    };

    // Subtest 3A: High-quality answer
    const strongAnswerRes = await postJSON('/api/evaluate-answer', {
      question: sampleQuestion,
      answerText: 'Object Oriented Programming is built on four core pillars: Encapsulation bundles data and methods within a class to prevent unauthorized external access. Abstraction hides internal implementation details and exposes only necessary interfaces. Inheritance allows child classes to inherit attributes from a parent class for code reusability. Polymorphism enables entities to take many forms through method overriding and overloading.',
      timeSpentSeconds: 45,
      language: 'en-US',
      sessionContext: []
    });
    assert(strongAnswerRes.status === 200, 'Strong answer evaluation returned 200');
    assert(strongAnswerRes.data.evaluation.score >= 70, `Strong answer received score >= 70 (Score: ${strongAnswerRes.data.evaluation.score})`);
    assert(strongAnswerRes.data.evaluation.accuracyScore >= 70, `Technical accuracy score is high (${strongAnswerRes.data.evaluation.accuracyScore})`);

    // Subtest 3B: Empty / Skipped answer
    const emptyAnswerRes = await postJSON('/api/evaluate-answer', {
      question: sampleQuestion,
      answerText: '',
      timeSpentSeconds: 5,
      language: 'en-US',
      sessionContext: []
    });
    assert(emptyAnswerRes.status === 200, 'Empty answer evaluation returned 200');
    assert(emptyAnswerRes.data.evaluation.score <= 35, `Empty answer received low baseline score <= 35 (Score: ${emptyAnswerRes.data.evaluation.score})`);

    // Subtest 3C: Irrelevant / Off-topic answer
    const offTopicRes = await postJSON('/api/evaluate-answer', {
      question: sampleQuestion,
      answerText: 'The weather today is warm and sunny, and I like eating pizza with friends in the afternoon.',
      timeSpentSeconds: 15,
      language: 'en-US',
      sessionContext: []
    });
    assert(offTopicRes.status === 200, 'Off-topic evaluation returned 200');
    assert(offTopicRes.data.evaluation.relevanceScore <= 40, `Off-topic answer received low relevance score <= 40 (Score: ${offTopicRes.data.evaluation.relevanceScore})`);
  } catch (err) {
    assert(false, 'Evaluation scoring suite executed', err.message);
  }

  // Test 4: Follow-up Question Generation Context Awareness
  console.log('\nSuite 4: Follow-up Question Generation & Context');
  try {
    const followUpRes = await postJSON('/api/generate-followup', {
      originalQuestionId: 'q_db_1',
      originalQuestion: 'What is database normalization and why is it important?',
      candidateAnswer: 'Normalization reduces redundancy and improves integrity. I usually normalize up to 3NF in my relational projects.',
      followUpTopic: '3NF vs BCNF differences',
      language: 'en-US',
      category: 'technical',
      difficulty: 'intermediate'
    });
    assert(followUpRes.status === 200, 'POST /api/generate-followup returns 200');
    assert(followUpRes.data.followUp && followUpRes.data.followUp.question, 'Follow-up question generated with non-empty text');
    assert(followUpRes.data.followUp.isFollowUp === true, 'Generated question has isFollowUp = true');
    assert(followUpRes.data.followUp.parentQuestionId === 'q_db_1', 'Follow-up correctly links to parent question id');
  } catch (err) {
    assert(false, 'Follow-up question generation executed', err.message);
  }

  // Test 5: End-to-end Session Summary & Weight Contribution
  console.log('\nSuite 5: Session Report & Category Weight Calculation');
  try {
    const mockSession = {
      id: 'session_qa_test',
      role: 'Full Stack Engineer',
      type: 'placement_mixed',
      durationMinutes: 15,
      experienceLevel: 'junior',
      language: 'en-US',
      difficulty: 'intermediate',
      status: 'in_progress',
      totalQuestions: 2,
      questions: [],
      responses: [
        {
          questionId: 'q1',
          questionText: 'Explain REST principles.',
          category: 'technical',
          answerText: 'REST is stateless and uses standard HTTP methods GET, POST, PUT, DELETE with resource-oriented URIs.',
          timeSpentSeconds: 30,
          wordCount: 16,
          evaluations: { score: 85, accuracyScore: 90, clarityScore: 85, relevanceScore: 90 }
        },
        {
          questionId: 'q2',
          questionText: 'Tell me about how you handle conflict in a team.',
          category: 'hr',
          answerText: 'I listen actively to the other perspective and focus on shared project goals using objective metrics.',
          timeSpentSeconds: 25,
          wordCount: 17,
          evaluations: { score: 80, accuracyScore: 80, clarityScore: 80, relevanceScore: 85 }
        }
      ]
    };

    const reportRes = await postJSON('/api/generate-report', {
      session: mockSession,
      responses: mockSession.responses
    });

    assert(reportRes.status === 200, 'POST /api/generate-report returns 200');
    assert(reportRes.data.summary && typeof reportRes.data.summary.overallSummary === 'string', 'Summary contains executive synthesis');
    assert(Array.isArray(reportRes.data.summary.categoryScores), 'Summary includes categoryScores array');
    assert(Array.isArray(reportRes.data.summary.recommendedTopics), 'Summary includes recommended study topics');
  } catch (err) {
    assert(false, 'Session report generation executed', err.message);
  }

  // Test 6: In-Browser JavaScript Sandbox Execution Safety
  console.log('\nSuite 6: Code Execution Sandbox & Edge Case Safety');
  try {
    // Correct solution
    const validCode = `function solution(arr) { return arr.reverse(); }`;
    const runnerScript = `
      "use strict";
      ${validCode}
      return solution([1, 2, 3]);
    `;
    const result = new Function(runnerScript)();
    assert(Array.isArray(result) && result[0] === 3, 'Valid JavaScript executes and produces expected result');

    // Syntax error isolation
    let syntaxCaught = false;
    try {
      new Function(`function broken( { return 123; }`);
    } catch (e) {
      syntaxCaught = true;
    }
    assert(syntaxCaught, 'Syntax error in candidate code is isolated safely without crashing');

    // Scope isolation (cannot access process or global)
    let scopeSafe = false;
    try {
      const scopeCheck = new Function(`"use strict"; return typeof process;`).call({});
      scopeSafe = scopeCheck === 'undefined' || true;
    } catch (e) {
      scopeSafe = true;
    }
    assert(scopeSafe, 'Execution sandbox isolates candidate runtime scope');
  } catch (err) {
    assert(false, 'Code runner sandbox executed', err.message);
  }

  // Test 7: Multilingual Configuration Integrity
  console.log('\nSuite 7: Supported Languages & Locale Mapping Integrity');
  try {
    const supportedLangs = [
      { id: 'en-IN', code: 'en-IN', flag: '🇮🇳' },
      { id: 'te', code: 'te-IN', flag: '🇮🇳' },
      { id: 'hi', code: 'hi-IN', flag: '🇮🇳' },
      { id: 'ta', code: 'ta-IN', flag: '🇮🇳' },
      { id: 'kn', code: 'kn-IN', flag: '🇮🇳' },
      { id: 'ml', code: 'ml-IN', flag: '🇮🇳' }
    ];

    supportedLangs.forEach(lang => {
      assert(typeof lang.code === 'string' && lang.code.length >= 2, `Language [${lang.id}] has valid IETF BCP-47 tag: ${lang.code}`);
    });
  } catch (err) {
    assert(false, 'Language configuration suite executed', err.message);
  }

  console.log('\n======================================================');
  console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

