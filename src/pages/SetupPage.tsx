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
  ShieldCheck,
  Loader2 
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
    setInterviewFocus 
  } = useInterview();
  const { settings, updateSettings } = useSettings();

  // Form states loaded from persisted preferences
  const savedPrefs = storageService.getSetupPreferences();
  const [candidateName, setCandidateName] = useState<string>(savedPrefs.candidateName || '');
  const [selectedType, setSelectedType] = useState<InterviewType>(initialType || savedPrefs.type || 'placement_mixed');
  const [targetRole, setTargetRole] = useState<string>(savedPrefs.role || 'Campus Placement Fresher (All Disciplines)');
  const [customRoleInput, setCustomRoleInput] = useState<string>(savedPrefs.customRoleInput || '');
  const [isCustomRole, setIsCustomRole] = useState<boolean>(savedPrefs.isCustomRole || false);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(savedPrefs.experienceLevel || 'fresher');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(savedPrefs.language || settings.language || 'en-IN');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(savedPrefs.difficulty || 'intermediate');
  const [questionCount, setQuestionCount] = useState<number>(savedPrefs.questionCount || 5);
  const [interviewMode, setInterviewMode] = useState<InterviewMode>(savedPrefs.mode || 'voice');
  const [durationMinutes, setDurationMinutes] = useState<number>(savedPrefs.durationMinutes || 15);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Voice & Language capability states
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(settings.voiceURI || '');
  const [testingVoice, setTestingVoice] = useState<boolean>(false);

  // Validation & Mic check states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micTesting, setMicTesting] = useState<boolean>(false);
  const [micTranscript, setMicTranscript] = useState<string>('');
  const [micStatus, setMicStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load voices on mount
  useEffect(() => {
    ttsService.loadVoices().then(v => setAvailableVoices(v));
  }, []);

  const currentLangConfig = getLanguageConfig(selectedLanguage);
  const voiceCheck = checkVoiceSupport(selectedLanguage, availableVoices);
  const sttCheck = checkSTTSupport(selectedLanguage);

  const handleRoleSelection = (role: string) => {
    if (role === 'custom') {
      setIsCustomRole(true);
      setTargetRole(customRoleInput || '');
    } else {
      setIsCustomRole(false);
      setTargetRole(role);
    }
  };

  const testMicrophone = () => {
    if (micTesting) {
      sttService.stop();
      setMicTesting(false);
      return;
    }

    setMicTesting(true);
    setMicTranscript(`Listening in ${currentLangConfig.name}... Speak a phrase (e.g. "${currentLangConfig.sampleText.slice(0, 35)}...")`);
    setMicStatus('idle');

    sttService.start(
      {
        onStart: () => setMicTesting(true),
        onFinal: (text) => {
          setMicTranscript(`✓ Captured: "${text}"`);
          setMicStatus('success');
          setMicTesting(false);
          sttService.stop();
        },
        onError: (err) => {
          setMicTranscript(`✕ ${err}`);
          setMicStatus('error');
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
    if (isStarting) return; // Prevent duplicate submissions

    setErrorMessage(null);

    const trimmedName = candidateName.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter your full name before beginning the interview. The interviewer requires your name to conduct the session.');
      return;
    }
    if (trimmedName.length < 2) {
      setErrorMessage('Please enter a valid candidate name (at least 2 characters).');
      return;
    }

    const effectiveRole = isCustomRole ? customRoleInput.trim() : targetRole.trim();
    if (!effectiveRole) {
      setErrorMessage('Please specify your target job role or select one from the list.');
      return;
    }

    if (questionCount < 1 || questionCount > 20) {
      setErrorMessage('Question count must be between 1 and 20.');
      return;
    }

    if (durationMinutes < 5 || durationMinutes > 60) {
      setErrorMessage('Duration must be between 5 and 60 minutes.');
      return;
    }

    // Persist setup preferences
    storageService.saveSetupPreferences({
      candidateName: trimmedName,
      type: selectedType,
      role: effectiveRole,
      isCustomRole,
      customRoleInput,
      experienceLevel,
      language: selectedLanguage,
      difficulty,
      questionCount,
      mode: interviewMode,
      durationMinutes
    });

    if (selectedLanguage !== settings.language) {
      updateSettings({ language: selectedLanguage });
    }

    setIsStarting(true);
    try {
      const sessionId = startInterview({
        candidateName: trimmedName,
        type: selectedType,
        role: effectiveRole,
        experienceLevel,
        language: selectedLanguage,
        difficulty,
        mode: interviewMode,
        questionCount,
        durationMinutes,
        resumeData,
        jobDescriptionText,
        jobMatchAnalysis,
        interviewFocus
      });

      onNavigate('room', { sessionId });
    } catch (err: any) {
      setIsStarting(false);
      setErrorMessage(`Failed to start interview: ${err.message || 'Unknown error'}`);
    }
  };

  const experienceOptions: { id: ExperienceLevel; label: string; desc: string }[] = [
    { id: 'fresher', label: 'College / Fresher', desc: '0 - 1 year of experience' },
    { id: 'junior', label: 'Junior Engineer', desc: '1 - 2 years in industry' },
    { id: 'mid', label: 'Mid-Level', desc: '3 - 5 years professional' },
    { id: 'senior', label: 'Senior / Lead', desc: '5+ years architecture' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
          Interview Configuration
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Setup Your AI Mock Interview
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Tailor the simulation parameters to match your upcoming placement drive or campus assessment.
        </p>
      </div>

      <form onSubmit={handleStart} className="space-y-8">
        
        {/* Dedicated Resume Upload & Analysis Section (Feature 1, 2, 3) */}
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-950/20 shadow-xl shadow-cyan-950/20">
          <ResumeUploadAndAnalysis
            resumeData={resumeData}
            onResumeChange={setResumeData}
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
        </div>

        {/* Step 1: Mandatory Candidate Identification */}
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/40 bg-gradient-to-br from-cyan-950/20 via-slate-900/70 to-transparent space-y-4 shadow-xl shadow-cyan-950/20">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">1</span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Candidate Full Name</span>
                <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800/50 uppercase tracking-wider">
                  Required
                </span>
              </h2>
            </div>
            {candidateName.trim().length >= 2 && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-800/50">
                <Check className="w-3.5 h-3.5" />
                <span>Interviewer will address you as {candidateName.trim()}</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Please enter your name manually. The interviewer will address you directly by your name in every question asked during the interview.
          </p>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              id="candidate-name-input"
              type="text"
              value={candidateName}
              onChange={(e) => {
                setCandidateName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. Alex Johnson (Enter your full name)"
              required
              className={`w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-900/90 border text-white text-sm font-semibold focus:outline-none transition-all placeholder:text-slate-500 ${
                !candidateName.trim() && errorMessage
                  ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
              }`}
            />
          </div>
        </div>

        {/* Step 2: Select Track / Category */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">2</span>
            <h2 className="text-base font-bold text-white">Select Interview Category</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {INTERVIEW_CATEGORIES.map(cat => {
              const isSelected = selectedType === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedType(cat.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400 shadow-md shadow-cyan-500/10'
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

        {/* Step 2: Target Role & Experience */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 font-bold text-xs flex items-center justify-center">2</span>
            <h2 className="text-base font-bold text-white">Target Role & Experience</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Target Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                {TARGET_ROLES.map(role => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => handleRoleSelection(role)}
                    className={`px-3 py-2.5 rounded-xl text-left text-xs font-medium border transition-all ${
                      !isCustomRole && targetRole === role
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Custom Role Option */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleRoleSelection('custom')}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border mb-2 ${
                    isCustomRole ? 'bg-cyan-950 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
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
                    }}
                    placeholder="e.g. AI Research Intern, Site Reliability Engineer, Cyber Security Analyst"
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Experience Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {experienceOptions.map(opt => {
                  const isSelected = experienceLevel === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setExperienceLevel(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-violet-400 text-violet-200'
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

        {/* Step 3: Difficulty, Duration, Questions & Mode */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">3</span>
            <h2 className="text-base font-bold text-white">Interview Mechanics</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Mode selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Interview Input Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInterviewMode('voice')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    interviewMode === 'voice'
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Mic className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Voice & Speech</span>
                  <span className="text-[10px] text-slate-400">Microphone speech input</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInterviewMode('text')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    interviewMode === 'text'
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Keyboard className="w-5 h-5 text-violet-400" />
                  <span className="text-xs font-bold text-white">Text / Code Only</span>
                  <span className="text-[10px] text-slate-400">Type responses directly</span>
                </button>
              </div>
            </div>

            {/* Question Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Question Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as QuestionDifficulty[]).map(d => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-3 px-2 rounded-xl border text-center capitalize text-xs font-bold transition-all ${
                      difficulty === d
                        ? 'bg-slate-800 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 8, 10].map(count => (
                  <button
                    type="button"
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`py-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                      questionCount === count
                        ? 'bg-slate-800 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Session Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map(mins => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                      durationMinutes === mins
                        ? 'bg-slate-800 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            {/* Multilingual Interview Language Selection */}
            <div className="sm:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Target Interview Language
                </label>
                <span className="text-[11px] text-cyan-400 font-medium">
                  {currentLangConfig.name} ({currentLangConfig.nativeName})
                </span>
              </div>

              {/* 6 Supported Language Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SUPPORTED_LANGUAGES.map(lang => {
                  const isSelected = currentLangConfig.id === lang.id;
                  return (
                    <button
                      type="button"
                      key={lang.id}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        // Auto-assign first matching voice for new language if available
                        const matching = checkVoiceSupport(lang.code, availableVoices);
                        if (matching.supported && matching.preferredVoice) {
                          setSelectedVoiceURI(matching.preferredVoice.voiceURI);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/10'
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

              {/* Language Voice & STT Capability Card */}
              <div className="p-3.5 rounded-2xl bg-navy-950/90 border border-slate-800 space-y-3">
                
                {/* Voice Status & Selection */}
                {voiceCheck.supported ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Native Voice Available ({voiceCheck.matchingVoices.length} voice{voiceCheck.matchingVoices.length > 1 ? 's' : ''})</span>
                      </span>
                      <button
                        type="button"
                        onClick={testVoice}
                        className={`text-xs px-3 py-1 rounded-lg font-semibold border flex items-center gap-1.5 transition-all ${
                          testingVoice
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{testingVoice ? 'Playing...' : 'Test Voice Audio'}</span>
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
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-xs text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold">Text & Visual Mode: </span>
                        <span>{voiceCheck.message}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                      Questions will be presented in authentic {currentLangConfig.nativeName} ({currentLangConfig.name}) script on screen. You can answer using microphone voice recognition or typing.
                    </p>
                  </div>
                )}

                {/* Multilingual evaluation reminder */}
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Fair Evaluation:</strong> Evaluated for semantic meaning and technical depth. Mixed English technical terms and regional accents are fully credited without penalty.
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* Quick Microphone Check Widget */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-navy-950/80 p-4 rounded-xl border border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Microphone Quick Test</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Verify your browser speech recognition before entering the interview room.
                </p>
              </div>

              <button
                type="button"
                onClick={testMicrophone}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                  micTesting 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/25'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{micTesting ? 'Stop Speaking' : 'Test Microphone'}</span>
              </button>
            </div>

            {micTranscript && (
              <div className="mt-2 text-xs p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                {micTranscript}
              </div>
            )}
          </div>

        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Start Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isStarting}
            className={`px-8 py-4 rounded-xl font-bold text-sm transition-all flex items-center gap-2 group ${
              isStarting
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-400/40'
            }`}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Initializing Interview Room...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Enter Interview Room</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
