/**
 * Automated Test Suite for Resume Upload, JD Matching,
 * Personalized Question Generation, and Final Recommendations.
 * All candidate profiles are fictional.
 */

import http from 'http';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} — ${details}`);
  }
}

function requestJSON(path, method = 'GET', payload = null) {
  return new Promise((resolve, reject) => {
    const data = payload ? JSON.stringify(payload) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
        },
        timeout: 15000
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
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 AI INTERVIEW PRO — RESUME & EVALUATION QA TESTS');
  console.log('======================================================\n');

  // Test 1: AI Server Status
  try {
    const statusRes = await requestJSON('/api/ai-status');
    assert(statusRes.status === 200, 'Server status responds with 200');
    assert(typeof statusRes.data?.provider === 'string', 'Server indicates AI provider');
  } catch (err) {
    assert(false, 'Server is running', err.message);
    console.error('Make sure backend is running: node server/aiServer.js');
    process.exit(1);
  }

  // Test 2: Upload Resume (Fictional Candidate: Jordan Lee)
  const fictionalResumeText = `
Jordan Lee
jordan.lee.developer@example.com
+1 (555) 234-5678
San Francisco, CA

EDUCATION
Bachelor of Technology in Computer Science
Global State University, 2021 - 2025

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript, SQL
Frameworks & Libraries: React, Node.js, Express, Tailwind CSS
Tools: Git, Docker, PostgreSQL, REST APIs

PROJECTS
Medical Report Analyzer
Developed a full-stack clinical document parser utilizing React and Python FastAPI.
Implemented OCR data extraction pipeline and tokenized medical entity classification.
Integrated PostgreSQL database with encrypted patient record caching.

Real-Time Collaborative Code Editor
Built a browser-based shared editor with WebSockets, Node.js, and Redis pub/sub.
Handled concurrent keystroke reconciliation and operational transformations.

EXPERIENCE
Software Engineering Intern at CloudPulse Labs
Developed REST endpoints in Node.js and automated unit testing pipelines with Jest.
Improved database query execution speeds by 28% through indexing.
`;

  const base64Resume = Buffer.from(fictionalResumeText).toString('base64');

  let extractedResume = null;
  try {
    const uploadRes = await requestJSON('/api/upload-resume', 'POST', {
      fileBase64: base64Resume,
      fileName: 'Jordan_Lee_Resume.txt',
      fileSize: fictionalResumeText.length,
      mimeType: 'text/plain'
    });

    assert(uploadRes.status === 200, 'Resume Upload Endpoint returns 200');
    assert(uploadRes.data?.resumeData?.candidateName?.includes('Jordan'), 'Candidate Name extracted correctly', uploadRes.data?.resumeData?.candidateName);
    assert(uploadRes.data?.resumeData?.technicalSkills?.includes('Python'), 'Skills extracted contains Python');
    assert(uploadRes.data?.resumeData?.technicalSkills?.includes('React'), 'Skills extracted contains React');
    assert(uploadRes.data?.resumeData?.projects?.length >= 1, 'Projects identified from resume', String(uploadRes.data?.resumeData?.projects?.length));

    extractedResume = uploadRes.data?.resumeData;
  } catch (err) {
    assert(false, 'Upload Resume endpoint failed', err.message);
  }

  // Test 3: Upload Validation — Unsupported Format
  try {
    const badRes = await requestJSON('/api/upload-resume', 'POST', {
      fileBase64: Buffer.from('xyz').toString('base64'),
      fileName: 'malicious.exe',
      fileSize: 3,
      mimeType: 'application/x-msdownload'
    });
    assert(badRes.status === 400, 'Rejects unsupported file formats with 400', String(badRes.status));
  } catch (err) {
    assert(false, 'File validation test threw unexpected error', err.message);
  }

  // Test 4: Job Description Alignment Analysis
  const sampleJD = `
Full Stack Developer Requirements:
We are looking for a software engineer skilled in React, Node.js, TypeScript, and AWS.
Experience with PostgreSQL database modeling and Docker containerization is required.
Knowledge of Kubernetes and GraphQL is a plus.
`;

  try {
    const jdRes = await requestJSON('/api/analyze-jd', 'POST', {
      resumeData: extractedResume,
      jobDescription: sampleJD,
      targetRole: 'Full Stack Developer'
    });

    assert(jdRes.status === 200, 'Analyze JD endpoint returns 200');
    assert(typeof jdRes.data?.analysis?.matchScorePercent === 'number', 'Calculates matchScorePercent');
    assert(jdRes.data?.analysis?.relevantSkillsFound?.length > 0, 'Finds overlapping relevant skills');
    assert(Array.isArray(jdRes.data?.analysis?.missingRequiredSkills), 'Categorizes skills not evident on resume');
    assert(Array.isArray(jdRes.data?.analysis?.roleSpecificPlan), 'Generates role-specific plan');
  } catch (err) {
    assert(false, 'Analyze JD endpoint failed', err.message);
  }

  // Test 5: Generate Question Grounded in Resume
  try {
    const qRes = await requestJSON('/api/generate-question', 'POST', {
      candidateName: 'Jordan Lee',
      category: 'technical',
      role: 'Full Stack Developer',
      difficulty: 'intermediate',
      experienceLevel: 'fresher',
      language: 'en-IN',
      questionNumber: 1,
      totalQuestions: 5,
      history: [],
      sessionId: 'test_session_123',
      resumeData: extractedResume,
      jobDescription: sampleJD,
      interviewFocus: 'project_deep_dive'
    });

    assert(qRes.status === 200, 'Generate Question returns 200');
    assert(typeof qRes.data?.question?.question === 'string', 'Question text is present');
    assert(qRes.data?.question?.question.length > 20, 'Question has substantial depth');
  } catch (err) {
    assert(false, 'Generate Question failed', err.message);
  }

  // Test 6: Evaluate Answer With Resume Context
  try {
    const evalRes = await requestJSON('/api/evaluate-answer', 'POST', {
      question: {
        id: 'q_test_1',
        category: 'technical',
        difficulty: 'intermediate',
        question: 'In your Medical Report Analyzer, how did you structure the OCR pipeline and handle data flow?',
        expectedKeywords: ['FastAPI', 'OCR', 'pipeline', 'PostgreSQL', 'encryption', 'React']
      },
      answerText: 'In the Medical Report Analyzer, we utilized FastAPI to receive uploaded clinical PDFs, processed them using OCR in memory, tokenized the extracted medical entities with regex and NLP libraries, and stored structured patient records in PostgreSQL with AES-256 encryption.',
      timeSpentSeconds: 45,
      language: 'en-IN',
      sessionContext: [],
      resumeData: extractedResume,
      jobDescription: sampleJD
    });

    assert(evalRes.status === 200, 'Evaluate Answer returns 200');
    assert(typeof evalRes.data?.evaluation?.score === 'number', 'Evaluation returns score', String(evalRes.data?.evaluation?.score));
    assert(evalRes.data?.evaluation?.score >= 50, 'Substantive answer scores well (>=50)', String(evalRes.data?.evaluation?.score));
    assert(Array.isArray(evalRes.data?.evaluation?.keyStrengths), 'Key strengths identified');
  } catch (err) {
    assert(false, 'Evaluate Answer failed', err.message);
  }

  // Test 7: Generate Final Candidate Recommendation & Evaluation (Feature 6)
  try {
    const recRes = await requestJSON('/api/generate-recommendation', 'POST', {
      session: {
        id: 'test_session_rec',
        candidateName: 'Jordan Lee',
        role: 'Full Stack Developer',
        overallScore: 82,
        difficulty: 'intermediate',
        language: 'en-IN',
        experienceLevel: 'fresher',
        totalQuestions: 3
      },
      responses: [
        {
          questionId: 'q1',
          questionText: 'Explain the architecture of your Medical Report Analyzer.',
          category: 'technical',
          answerText: 'We built a decoupled React frontend and FastAPI microservice backend connected to PostgreSQL.',
          evaluations: { score: 85, keyStrengths: ['Architecture clarity', 'FastAPI familiarity'] }
        },
        {
          questionId: 'q2',
          questionText: 'How do you handle database indexing and query optimization?',
          category: 'technical',
          answerText: 'I used B-tree indexes on foreign keys and analyzed EXPLAIN query plans to eliminate sequential table scans.',
          evaluations: { score: 80, keyStrengths: ['Database optimization knowledge'] }
        }
      ],
      resumeData: extractedResume,
      jobDescription: sampleJD
    });

    assert(recRes.status === 200, 'Final Recommendation returns 200');
    const rec = recRes.data?.recommendation;
    assert(['recommended', 'borderline', 'not_recommended', 'inconclusive'].includes(rec?.status), 'Status is valid enum: ' + rec?.status);
    assert(rec?.status === 'recommended', 'High scoring candidate is recommended', rec?.status);
    assert(typeof rec?.headline === 'string', 'Recommendation headline provided');
    assert(typeof rec?.explanation === 'string', 'Recommendation explanation provided');
    assert(Array.isArray(rec?.decisionFactors), 'Decision factors provided');
    assert(typeof rec?.fairnessNotice === 'string' && rec?.fairnessNotice.includes('Fairness'), 'Fairness & Anti-bias notice included');
  } catch (err) {
    assert(false, 'Final Recommendation failed', err.message);
  }

  console.log('\n------------------------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
