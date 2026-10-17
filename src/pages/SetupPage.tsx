import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Cpu, 
  Code2, 
  Users, 
  User,
  BrainCircuit, 
  MessageSquareQuote, 
  Layers, 
  Mic, 
  Keyboard, 
  Clock, 
  Volume2, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  Check, 
  CheckCircle,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Camera,
  Loader2,
  FileText
} from 'lucide-react';
import { 
  InterviewType, 
  ExperienceLevel, 
  QuestionDifficulty, 
  InterviewMode 
} from '../types/interview';
import { TARGET_ROLES, INTERVIEW_CATEGORIES } from '../data/questionBank';
import { 
  SUPPORTED_LANGUAGES, 
  getLanguageConfig, 
  checkVoiceSupport, 
  checkSTTSupport 
} from '../config/languages';
import { useInterview } from '../context/InterviewContext';
import { useSettings } from '../context/SettingsContext';
import { sttService } from '../services/speechRecognition';
import { ttsService } from '../services/speechSynthesis';
import { storageService } from '../services/storage';
import { ResumeUploadAndAnalysis } from '../components/resume/ResumeUploadAndAnalysis';
import { validateSetupPreferences } from '../services/interviewValidation';

interface SetupPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialType?: InterviewType;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onNavigate, initialType }) => {
  const { 
    startInterview, 
    resumeData, 
    setResumeData, 
    jobDescriptionText, 
    setJobDescriptionText, 
    jobMatchAnalysis, 
    setJobMatchAnalysis, 
    interviewFocus, 
    setInterviewFocus,
    clearActiveSetup
  } = useInterview();
  const { settings, updateSettings } = useSettings();

  // Fresh setup: All preferences initialized as UNSELECTED per Requirement 4 & 7
  const [candidateName, setCandidateName] = useState<string>('');
  const [selectedType, setSelectedType] = useState<InterviewType | null>(initialType || null);
  const [targetRole, setTargetRole] = useState<string>('');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [isCustomRole, setIsCustomRole] = useState<boolean>(false);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [interviewMode, setInterviewMode] = useState<InterviewMode | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Proctored mode is permanently required - no toggle
  const proctoredMode = true;

  // Reset any stale session context on initial mount of a new setup
  useEffect(() => {
    clearActiveSetup();
    // Do not load stale resume from disk
    setResumeData(null);
  }, []);

  // Voice & Language capability states
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(settings.voiceURI || '');
  const [testingVoice, setTestingVoice] = useState<boolean>(false);

  // Validation & Mic check states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micTesting, setMicTesting] = useState<boolean>(false);
  const [micTranscript, setMicTranscript] = useState<string>('');

  // Load voices on mount
  useEffect(() => {
    ttsService.loadVoices().then(v => setAvailableVoices(v));
  }, []);

  const currentLangConfig = selectedLanguage ? getLanguageConfig(selectedLanguage) : null;
  const voiceCheck = selectedLanguage ? checkVoiceSupport(selectedLanguage, availableVoices) : { supported: false, matchingVoices: [], message: '' };

  const handleRoleSelection = (role: string) => {
    if (errorMessage) setErrorMessage(null);
    if (role === 'custom') {
      setIsCustomRole(true);
      setTargetRole(customRoleInput || '');
    } else {
      setIsCustomRole(false);
      setTargetRole(role);
    }
  };

  const testMicrophone = () => {
    if (!currentLangConfig) return;
    if (micTesting) {
      sttService.stop();
      setMicTesting(false);
      return;
    }

    setMicTesting(true);
    setMicTranscript(`Listening in ${currentLangConfig.name}... Speak a test phrase.`);

    sttService.start(
      {
        onStart: () => setMicTesting(true),
        onFinal: (text) => {
          setMicTranscript(`✓ Captured: "${text}"`);
          setMicTesting(false);
          sttService.stop();
        },
        onError: (err) => {
          setMicTranscript(`✕ ${err}`);
          setMicTesting(false);
        },
        onEnd: () => {
          setMicTesting(false);
        }
      },
      currentLangConfig.sttLocale
    );
  };

  const testVoice = () => {
    if (!currentLangConfig) return;
    if (testingVoice) {
      ttsService.cancel();
      setTestingVoice(false);
      return;
    }

    setTestingVoice(true);
    ttsService.speak(
      currentLangConfig.sampleText,
      {
        voiceURI: selectedVoiceURI,
        lang: currentLangConfig.code
      },
      {
        onStart: () => setTestingVoice(true),
        onEnd: () => setTestingVoice(false),
        onError: () => setTestingVoice(false)
      }
    );
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStarting) return;

    setErrorMessage(null);

    // Strict Centralized Validation
    const validation = validateSetupPreferences({
      resumeData,
      candidateName,
      category: selectedType,
      role: targetRole,
      isCustomRole,
      customRoleInput,
      experienceLevel,
      mode: interviewMode,
      difficulty,
      questionCount,
      durationMinutes,
      language: selectedLanguage
    });

    if (!validation.isValid) {
      setErrorMessage(validation.missingField || 'Please complete all required fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const trimmedName = candidateName.trim();
    const effectiveRole = isCustomRole ? customRoleInput.trim() : targetRole.trim();

    // Persist setup preferences
    storageService.saveSetupPreferences({
      candidateName: trimmedName,
      type: selectedType,
      role: effectiveRole,
      isCustomRole,
      customRoleInput,
      experienceLevel,
      language: selectedLanguage!,
      difficulty: difficulty!,
      questionCount: questionCount!,
      mode: interviewMode!,
      durationMinutes: durationMinutes!,
      proctoredMode: true
    });

    if (selectedLanguage && selectedLanguage !== settings.language) {
      updateSettings({ language: selectedLanguage });
    }

    setIsStarting(true);
    try {
      const sessionId = startInterview({
        candidateName: trimmedName,
        type: selectedType!,
        role: effectiveRole,
        experienceLevel: experienceLevel!,
        language: selectedLanguage!,
        difficulty: difficulty!,
        mode: interviewMode!,
        questionCount: questionCount!,
        durationMinutes: durationMinutes!,
        resumeData,
        jobDescriptionText,
        jobMatchAnalysis,
        interviewFocus,
        isProctored: true // Mandatory proctored mode
      });

      onNavigate('room', { sessionId, proctoredMode: 'true' });
    } catch (err: any) {
      setIsStarting(false);
      setErrorMessage(`Failed to start interview: ${err.message || 'Unknown error'}`);
    }
  };

  const experienceOptions: { id: ExperienceLevel; label: string; desc: string }[] = [
    { id: 'fresher', label: 'College / Fresher', desc: '0–1 year of experience' },
    { id: 'junior', label: 'Junior Engineer', desc: '1–2 years in industry' },
    { id: 'mid', label: 'Mid-Level', desc: '3–5 years professional experience' },
    { id: 'senior', label: 'Senior / Lead', desc: '5+ years architecture and leadership experience' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
          Interview Configuration & Proctoring Verification
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Setup Your AI Placement Interview
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          All configuration fields and your resume upload must be explicitly chosen to personalize your assessment.
        </p>
      </div>

      <form onSubmit={handleStart} className="space-y-8">

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-300 text-xs flex items-center gap-2.5 shadow-xl shadow-rose-950/50 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}
        
        {/* Step 1: Upload Resume & Candidate Profile */}
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-950/20 shadow-xl shadow-cyan-950/20 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">1</span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Upload Resume & Candidate Identity</span>
              <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800/50 uppercase tracking-wider">
                Required
              </span>
            </h2>
          </div>

          <ResumeUploadAndAnalysis
            resumeData={resumeData}
            onResumeChange={(data) => {
              setResumeData(data);
              if (data?.candidateName && (!candidateName || candidateName === 'Candidate')) {
                setCandidateName(data.candidateName);
              }
              if (errorMessage) setErrorMessage(null);
            }}
            jobDescriptionText={jobDescriptionText}
            onJobDescriptionChange={setJobDescriptionText}
            jobMatchAnalysis={jobMatchAnalysis}
            onJobMatchChange={setJobMatchAnalysis}
            interviewFocus={interviewFocus}
            onInterviewFocusChange={setInterviewFocus}
            onCandidateNameExtracted={(name) => {
              if (name && name !== 'Candidate') {
                setCandidateName(name);
              }
            }}
            targetRole={isCustomRole ? customRoleInput : targetRole}
          />

          {/* Candidate Name Input */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Candidate Full Name</span>
                <span className="text-rose-400">*</span>
              </label>
              {candidateName.trim().length >= 2 && (
                <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Interviewer will address you as {candidateName.trim()}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="candidate-name-input"
                type="text"
                value={candidateName}
                onChange={(e) => {
                  setCandidateName(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter your full candidate name (e.g., Alex Johnson)"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Select Interview Category */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">2</span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Select Interview Category</span>
                <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800/50 uppercase tracking-wider">
                  Required
                </span>
              </h2>
            </div>
            {!selectedType && (
              <span className="text-xs text-amber-400 font-medium">Select an option</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {INTERVIEW_CATEGORIES.map(cat => {
              const isSelected = selectedType === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedType(cat.id);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-950 text-slate-300">
                      {cat.badge}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <h3 className="font-bold text-xs text-white mb-1">{cat.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{cat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Target Role and Experience */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 font-bold text-xs flex items-center justify-center">3</span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Target Role and Experience</span>
              <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800/50 uppercase tracking-wider">
                Required
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Target Role
                </label>
                {!targetRole && (
                  <span className="text-xs text-amber-400 font-medium">Select an option</span>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                {TARGET_ROLES.map(role => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => handleRoleSelection(role)}
                    className={`px-3 py-2.5 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer ${
                      !isCustomRole && targetRole === role
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Specify Custom Role Option */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleRoleSelection('custom')}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border mb-2 cursor-pointer transition-all ${
                    isCustomRole 
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  + Specify Custom Role
                </button>
                {isCustomRole && (
                  <input
                    type="text"
                    value={customRoleInput}
                    onChange={(e) => {
                      setCustomRoleInput(e.target.value);
                      setTargetRole(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. AI Research Intern, Site Reliability Engineer, Cyber Security Analyst"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/50 text-white text-xs focus:outline-none focus:border-cyan-400"
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Experience Level
                </label>
                {!experienceLevel && (
                  <span className="text-xs text-amber-400 font-medium">Select an option</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {experienceOptions.map(opt => {
                  const isSelected = experienceLevel === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => {
                        setExperienceLevel(opt.id);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 border-violet-400 text-violet-200 ring-1 ring-violet-400'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold text-white">{opt.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Step 4: Configure Interview Mechanics */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">4</span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Configure Interview Mechanics</span>
              <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800/50 uppercase tracking-wider">
                Required
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Interview Input Mode */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Interview Input Mode
                </label>
                {!interviewMode && (
                  <span className="text-xs text-amber-400 font-medium">Select mode</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInterviewMode('voice');
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    interviewMode === 'voice'
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Mic className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Voice & Speech</span>
                  <span className="text-[10px] text-slate-400">Microphone-based spoken answers</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInterviewMode('text');
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    interviewMode === 'text'
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Keyboard className="w-5 h-5 text-violet-400" />
                  <span className="text-xs font-bold text-white">Text / Code Only</span>
                  <span className="text-[10px] text-slate-400">Type responses directly</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-500 mt-2">
                Note: In both modes, camera and microphone access are required for proctored identity and environment monitoring.
              </p>
            </div>

            {/* Question Difficulty */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Question Difficulty
                </label>
                {!difficulty && (
                  <span className="text-xs text-amber-400 font-medium">Select difficulty</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as QuestionDifficulty[]).map(d => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`py-3 px-2 rounded-xl border text-center capitalize text-xs font-bold transition-all cursor-pointer ${
                      difficulty === d
                        ? 'bg-slate-800 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Number of Questions
                </label>
                {!questionCount && (
                  <span className="text-xs text-amber-400 font-medium">Select count</span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 8, 10].map(count => (
                  <button
                    type="button"
                    key={count}
                    onClick={() => {
                      setQuestionCount(count);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`py-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      questionCount === count
                        ? 'bg-slate-800 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Session Duration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Session Duration
                </label>
                {!durationMinutes && (
                  <span className="text-xs text-amber-400 font-medium">Select duration</span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map(mins => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => {
                      setDurationMinutes(mins);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`py-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      durationMinutes === mins
                        ? 'bg-slate-800 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            {/* Target Interview Language */}
            <div className="sm:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Target Interview Language
                </label>
                {!selectedLanguage ? (
                  <span className="text-xs text-amber-400 font-medium">Select language</span>
                ) : (
                  <span className="text-[11px] text-cyan-400 font-medium">
                    {currentLangConfig?.name} ({currentLangConfig?.nativeName})
                  </span>
                )}
              </div>

              {/* 6 Supported Language Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SUPPORTED_LANGUAGES.map(lang => {
                  const isSelected = selectedLanguage === lang.code;
                  return (
                    <button
                      type="button"
                      key={lang.id}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        if (errorMessage) setErrorMessage(null);
                        const matching = checkVoiceSupport(lang.code, availableVoices);
                        if (matching.supported && matching.preferredVoice) {
                          setSelectedVoiceURI(matching.preferredVoice.voiceURI);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">{lang.flag}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </div>
                      <div className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                        {lang.nativeName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {lang.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Audio and Voice Test (visible once language is chosen) */}
              {selectedLanguage && currentLangConfig && (
                <div className="p-3.5 rounded-2xl bg-navy-950/90 border border-slate-800 space-y-3 mt-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>{currentLangConfig.name} Selected ({voiceCheck.matchingVoices.length} voice{voiceCheck.matchingVoices.length > 1 ? 's' : ''} available)</span>
                    </span>
                    <button
                      type="button"
                      onClick={testVoice}
                      className="text-xs px-3 py-1 rounded-lg font-semibold border flex items-center gap-1.5 bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25 transition-all cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{testingVoice ? 'Playing Sample...' : 'Test Speech Audio'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400 whitespace-nowrap">Voice:</label>
                    <select
                      value={selectedVoiceURI}
                      onChange={(e) => setSelectedVoiceURI(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    >
                      {voiceCheck.matchingVoices.map(v => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Step 5: Proctored Placement Mode: Required (Permanently Enabled, No Toggle) */}
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/40 bg-gradient-to-br from-emerald-950/25 via-slate-900/80 to-transparent space-y-4 shadow-xl shadow-emerald-950/20">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/90 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Proctored Placement Mode: Required
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold uppercase tracking-wider">
                    Mandatory
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Camera and microphone verification, interview rules acknowledgement, and browser activity monitoring are required before the interview starts.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/90 px-3 py-1.5 rounded-full border border-emerald-500/40 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Always Enforced
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
              <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-300">Tab-switch & visibility audit</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
              <Camera className="w-4 h-4 text-violet-400 shrink-0" />
              <span className="text-slate-300">Active video track verification</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
              <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">Active audio track verification</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3">
            <strong>Honest Browser Monitoring Disclosure:</strong> Browser monitoring observes page visibility, window blur, and fullscreen changes via standard HTML5 APIs. It does not monitor external operating-system applications or second devices. No raw audio or video is stored or transmitted.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            id="continue-to-device-check-btn"
            disabled={isStarting}
            className={`px-8 py-4 rounded-xl font-bold text-sm transition-all flex items-center gap-2 group cursor-pointer ${
              isStarting
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-400/40'
            }`}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Preparing Device Check...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Continue to Device Check</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
