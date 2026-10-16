# AI Interview Pro — Your Personal AI Interviewer

![AI Interview Pro Logo](./public/logo.svg)

> **Next-generation AI mock interview platform featuring natural speech synthesis, continuous microphone speech recognition, dynamic context-aware follow-up questions, procedural viseme lip-sync avatar, and transparent rubric-based evaluations.**

---

## 🌟 Highlights & Features

- **Futuristic AI Persona & Dynamic Avatar**:
  - Interactive central AI interviewer with animated visor eyes, holographic aura, sound waves, and 5 distinct operational states: `idle`, `speaking`, `listening`, `thinking`, and `analyzing`.
  - Natural blinking cycles and procedural viseme lip-sync driven by audio dynamics.
  - Auditory cues with Web Speech API Text-to-Speech (TTS) for natural question narration.
- **Multimodal Candidate Input**:
  - Voice speech input with continuous Web Speech API Speech-to-Text (STT) and live interim transcription.
  - Text & Code editor tabs for algorithm walk-throughs, pseudocode, and mathematical explanations.
  - In-browser safe execution sandbox supporting JavaScript, Python, Java, C++, and SQL starter templates.
- **Provider-Based AI Evaluation Engine**:
  - Real-time dimensional scoring across **Correctness & Accuracy**, **Clarity & Structure**, **Depth & Completeness**, **Relevance**, and **Problem-Solving & Reasoning**.
  - Distinct scoring rubrics for different categories:
    - **HR / Behavioral**: Scored on Clarity (35%), Relevance (25%), STAR Reasoning (25%), Completeness (15%). Coding correctness is explicitly excluded.
    - **Technical SDE**: Scored on Technical Accuracy (40%), Depth (25%), Reasoning (20%), Clarity (15%).
    - **Coding**: Scored on Automated Test Cases (45%), Algorithm Logic (25%), Accuracy (20%), Code Clarity (10%).
  - Exemplar model answers and suggested improved responses for every question.
- **Context-Aware Dynamic Follow-Ups**:
  - When a candidate's answer reveals an interesting gap or warrants deeper exploration, the engine dynamically generates a targeted follow-up question referencing the candidate's previous response.
- **8 Complete, Production-Ready Pages**:
  1. **Landing Page**: Hero avatar, interactive voice demo, track cards, live animated stats strip, and quick category launch cards.
  2. **Dashboard**: Candidate greeting, placement readiness indicator, aggregated score donut meter, recent session logs, and daily practice streak counter.
  3. **Interview Setup**: Granular customization by category (Campus Placement, Technical SDE, Coding Logic, HR Behavioral, Quantitative Aptitude, Communication), target job role, experience level, language, duration, and difficulty, with integrated mic quick test.
  4. **Interview Room**: Full immersion room with central AI avatar, current question card, live countdown timer, question progress bar, mic recorder, STAR hints, pause/resume, and conversation transcript drawer.
  5. **Results & Analytics**: Overall performance score donut ring, placement readiness verdict, identified strengths and improvement areas, question-by-question breakdown, and one-click printable report/PDF export.
  6. **Progress Analytics**: Radar charts, score progression timelines, and category breakdown charts.
  7. **History**: Filterable session logs with search, category filtering, score sorting, and confirmation-guarded session deletion.
  8. **Settings**: Voice selection from browser voices, pitch and rate calibration, microphone live calibration, and optional Gemini/OpenAI API configuration.

---

## 🚀 Tech Stack

- **Frontend**: React 18 with TypeScript, Vite 6, Tailwind CSS
- **Styling**: Tailored dark navy palette (`#060911`), cyan & violet gradients, glassmorphism panels
- **Backend API**: Node.js HTTP server (`server/aiServer.js`) providing AI question generation, answer evaluation, and follow-up generation
- **AI Providers**: Google Gemini 1.5 Flash, OpenAI GPT-4o-mini, or deterministic built-in NLP rubric engine (100% free & offline capable)
- **Speech APIs**: Native Browser Web Speech API (`SpeechSynthesis` & `SpeechRecognition`)
- **Persistence**: Browser `localStorage` (sessions, active interviews, audio preferences)
- **Visuals & Charts**: Custom SVG Radar charts, score rings, and `canvas-confetti`

---

## 💻 Installation & Running Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- Modern Chromium-based browser (Google Chrome, Microsoft Edge, Brave) for full Web Speech API audio/voice support.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Configure your preferred AI provider in `.env`:
```ini
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
PORT=3001
HOST=localhost
```
> **Note**: If `GEMINI_API_KEY` is left blank, the application automatically runs in **Deterministic Offline Rubric Mode**, delivering full question generation and scoring without requiring any external keys.

### 3. Start Backend & Frontend

**Option A (Recommended — Both Services):**
Open two terminal windows:
```bash
# Terminal 1: AI Backend Service
npm run server

# Terminal 2: Frontend Web App
npm run dev
```

**Option B (Single Command):**
```bash
npm run dev:full
```

Open [http://localhost:5175/](http://localhost:5175/) in your browser.

### 4. Production Build & Test
```bash
# Automated QA regression suite
node scripts/qaAutomatedTests.js

# Production bundle
npm run build
```

---

## 🔑 External Services & Setup Guide

| Service | Necessity | Purpose | Setup Instructions |
| :--- | :--- | :--- | :--- |
| **Google Gemini API** | *Optional* | Real-time generative AI questions & LLM feedback | 1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).<br>2. Generate a free API key.<br>3. Paste it in `.env` as `GEMINI_API_KEY=` or in the in-app **Settings** page. |
| **OpenAI API** | *Optional* | Alternative LLM inference | 1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys).<br>2. Set `AI_PROVIDER=openai` and `OPENAI_API_KEY=` in `.env`. |
| **Web Speech API** | *Built-in* | Speech-to-Text & Text-to-Speech | Built into Chrome, Edge, and Safari. No external keys or accounts needed. Ensure microphone permissions are allowed in browser settings. |
| **Built-in NLP Engine** | *Default* | Offline question bank & rubric scoring | Included with application source code. No internet or external service required. |

---

## 🧪 QA Verification & Quality Audit

The platform has undergone rigorous QA review across all 17 core specifications:

| # | Test Area | Status | Verification Detail |
| :---: | :--- | :---: | :--- |
| **1** | Page Loads & Runtime | ✅ Verified | All 8 pages (`#landing`, `#dashboard`, `#history`, `#progress`, `#setup`, `#room`, `#results`, `#settings`) load with **0 runtime errors**. |
| **2** | Navigation & Buttons | ✅ Verified | Tested all internal links, modals, tabs, and action buttons. No dead links or placeholder handlers. |
| **3** | Setup Form Validation | ✅ Verified | Rejects empty custom roles and out-of-range parameters with explicit inline alert banners. |
| **4** | Parameter Respect | ✅ Verified | Selected Category, Role, Language, Difficulty, and Question count are propagated into the session object. |
| **5** | Speech Narration (TTS) | ✅ Verified | Web Speech synthesis narrates questions with configurable pitch, rate, and multilingual accents. |
| **6** | Multimodal Input | ✅ Verified | Continuous voice STT transcription and text/code editor with Tab-indentation support. |
| **7** | Avatar State Transitions | ✅ Verified | Procedural visemes, lip-sync, and head tilts transition smoothly across `idle`, `speaking`, `listening`, `thinking`, `analyzing`, and `error`. |
| **8** | Contextual Follow-Ups | ✅ Verified | Generates contextual follow-ups probing deeper into candidate's previous response when depth is lacking. |
| **9** | Question Sequencing | ✅ Verified | Question numbers increment monotonically without skipping or duplicate repetition. |
| **10** | Timers & Completion | ✅ Verified | Live countdown timer ends interview gracefully on expiration. Completing final question auto-navigates to `#results`. |
| **11** | Scoring Sensibility | ✅ Verified | High-quality answers receive 75-95 scores; empty/skipped answers receive 10 baseline score; off-topic answers receive low relevance score. |
| **12** | Session Association | ✅ Verified | All answers, rubrics, and scores are permanently bound to `sessionId` in `localStorage`. |
| **13** | PDF Report Details | ✅ Verified | A4-styled print layout includes overall score, category breakdown, individual Q&A, and study recommendations. |
| **14** | Resiliency & Refresh | ✅ Verified | Handles browser refresh mid-interview without resetting timer; handles mic permission denial with non-blocking text fallback. |
| **15** | Mobile Responsiveness | ✅ Verified | Verified responsive layout on 390px mobile viewports and desktop 1536px viewports. |
| **16** | Credential Security | ✅ Verified | Zero API keys exposed in client bundles. Keys remain strictly on backend or in candidate's local storage. |
| **17** | Button Functionality | ✅ Verified | All buttons have functional event handlers, loading states, and double-click confirmation guards. |

---

## 🎓 Faculty Demonstration Script

Follow this step-by-step walkthrough when presenting the project to faculty or placement evaluators:

### Phase 1: Platform Introduction (1 Minute)
1. Open [http://localhost:5175/](http://localhost:5175/) to the **Landing Page**.
2. Highlight the **AI Avatar** with real-time breathing animation, live audio visualizer waves, and the live animated placement statistics strip.
3. Show the supported tracks (Campus Placement, Technical SDE, Coding Sandbox, HR Behavioral, Quantitative Aptitude, Communication).

### Phase 2: Setup & Hardware Calibration (1.5 Minutes)
1. Click **New Interview** (`#setup`).
2. Demonstrate **Form Validation**: Select "Specify Custom Role", leave the text field empty, and click "Enter Interview Room" — point out the instant error message.
3. Type a custom role: `Full Stack Engineer (MERN)`.
4. Demonstrate the **Multilingual & Hardware Test**: Click "Test Microphone" to show real-time speech capture and "Test Voice" to demonstrate speech synthesis.
5. Choose **3 Questions** and click **Enter Interview Room**.

### Phase 3: Live Interview Simulation (2.5 Minutes)
1. Point out the **AI Avatar** speaking the question, the live countdown timer, and the question progress indicator.
2. Answer Question 1 verbally via microphone or type an answer in the text box.
3. Demonstrate the **Code Tab**: Click the "Code / Pseudo-code" tab, select JavaScript, and click "Load Template" to demonstrate starter code insertion.
4. Click **Submit Answer**: Show the AI avatar transitioning to `thinking` state, scoring the response, and advancing to the next question.
5. Highlight the **Context-Aware Follow-Up**: Point out the follow-up badge and how the AI probes deeper into concepts mentioned in the candidate's answer.

### Phase 4: Results, Analytics & PDF Generation (2 Minutes)
1. On completing the final question, show the automatic transition to the **Results Page** (`#results`).
2. Walk through:
   - The overall score donut meter and placement readiness verdict.
   - The category-wise rubric breakdown (Accuracy, Clarity, Depth, Reasoning).
   - The question-by-question candidate answer vs. AI model answer comparison.
   - Actionable study recommendations and next practice steps.
3. Click **Download Report (PDF)** to trigger the clean, print-optimized A4 summary report.
4. Click **View Analytics** (`#progress`) to demonstrate the interactive Radar Chart, daily practice streak counter, and historical score progression.
5. Navigate to **History** (`#history`) to prove complete local persistence across browser refreshes.

---

## ⚠️ Known Limitations & Operational Notes

1. **Browser Speech Synthesis Availability**: Speech synthesis voice availability varies between operating systems and browsers. Chromium browsers (Chrome, Edge) provide the richest set of natural voices. When voice synthesis is unavailable, the application gracefully activates **Visual Question Mode**.
2. **Microphone Permissions**: Web Speech recognition requires explicit browser microphone permissions and an active HTTPS or localhost connection. If denied, candidates can seamlessly use the integrated text/code editor.
3. **LLM Provider Quotas**: When using Google Gemini free tier, rate limits (15 requests/minute) may apply. If an API rate limit or network timeout occurs, the backend automatically falls back to the deterministic question bank without interrupting the interview.

---

## 📄 License
MIT License. Built for university campus placements and technical interview preparation.
