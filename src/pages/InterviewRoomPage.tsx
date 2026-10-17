import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Pause, 
  Play, 
  RotateCcw, 
  SkipForward, 
  XSquare, 
  Clock, 
  Sparkles, 
  MessageSquare, 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight,
  Code2,
  FileText,
  Star,
  Globe,
  GitBranch,
  Loader2,
  Wifi,
  WifiOff,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { useSettings } from '../context/SettingsContext';
import { AIAvatar } from '../components/avatar/AIAvatar';
import { sttService } from '../services/speechRecognition';
import { ttsService } from '../services/speechSynthesis';
import { soundService } from '../services/soundEffects';
import { SUPPORTED_LANGUAGES, getLanguageConfig, checkVoiceSupport } from '../config/languages';
import { useToast } from '../context/ToastContext';
import { useProctoringMonitor } from '../services/useProctoringMonitor';
import { DEFAULT_VIOLATION_POLICY } from '../types/proctoring';
import { ProctoringRulesScreen } from '../components/proctoring/ProctoringRulesScreen';
import { DeviceCheckScreen } from '../components/proctoring/DeviceCheckScreen';
import { ProctorMonitorPanel } from '../components/proctoring/ProctorMonitorPanel';
import { ProctoringWarningOverlay } from '../components/proctoring/ProctoringWarningOverlay';
import { storageService } from '../services/storage';

interface InterviewRoomPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const InterviewRoomPage: React.FC<InterviewRoomPageProps> = ({ onNavigate }) => {
  const {
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
    submitAnswer,
    skipQuestion,
    repeatCurrentQuestion,
    togglePause,
    startInterview,
    endInterview,
    setSessionLanguage,
    refreshAIStatus
  } = useInterview();

  const { settings } = useSettings();

  // Local state for candidate input & language switcher
  const [candidateText, setCandidateText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState<boolean>(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [inputTab, setInputTab] = useState<'text' | 'code'>('text');
  const [selectedCodeLang, setSelectedCodeLang] = useState<string>('JavaScript');
  const [lastEvalScore, setLastEvalScore] = useState<number | null>(null);
  const [micErrorMsg, setMicErrorMsg] = useState<string | null>(null);
  const [pendingSkip, setPendingSkip] = useState<boolean>(false);
  const [confirmTemplatePending, setConfirmTemplatePending] = useState<boolean>(false);
  const { info: toastInfo, success: toastSuccess, error: toastError } = useToast();

  // ─── Proctoring Integration ──────────────────────────────────────────────
  const urlParams = useMemo(() => new URLSearchParams(window.location.hash.split('?')[1] || ''), []);
  const isProctoredMode = urlParams.get('proctoredMode') === 'true' || currentSession?.isProctored === true;

  const proctoring = useProctoringMonitor({
    sessionId: currentSession?.id || 'no-session',
    enabled: isProctoredMode,
    policy: DEFAULT_VIOLATION_POLICY,
    requestFullscreen: false,
    skipDeviceCheck: !isProctoredMode,
  });

  // Sync proctoring pause with interview pause
  useEffect(() => {
    if (!isProctoredMode) return;
    if (proctoring.proctoringState === 'paused' || proctoring.proctoringState === 'requires_review') {
      // Ensure interview timer is paused
      if (!isPaused) {
        togglePause();
      }
    }
  }, [proctoring.proctoringState, isProctoredMode]);

  // Cleanup camera on session end and persist final snapshot
  useEffect(() => {
    if (currentSession?.status === 'completed' && isProctoredMode) {
      proctoring.completeInterview();
      proctoring.stopAllTracks();
      storageService.saveProctoringSnapshot(currentSession.id, proctoring.getSnapshot());
    }
  }, [currentSession?.status, isProctoredMode]);

  // Persist latest proctoring snapshot whenever state, violations, or events change
  useEffect(() => {
    if (isProctoredMode && currentSession?.id) {
      storageService.saveProctoringSnapshot(currentSession.id, proctoring.getSnapshot());
    }
  }, [
    isProctoredMode,
    currentSession?.id,
    proctoring.proctoringState,
    proctoring.violations.tabHidden,
    proctoring.violations.windowBlur,
    proctoring.violations.fullscreenExited,
    proctoring.violations.cameraDisconnected,
    proctoring.violations.micDisconnected,
    proctoring.eventLog.length
  ]);

  // Set proctoring to in_progress when non-proctored, or when ready state triggers
  useEffect(() => {
    if (!isProctoredMode && currentSession?.status === 'in_progress') {
      proctoring.setProctoringState('in_progress');
    }
  }, [isProctoredMode, currentSession?.status]);

  // Automatically navigate to results when session status becomes 'completed'
  useEffect(() => {
    if (currentSession && currentSession.status === 'completed') {
      onNavigate('results', { sessionId: currentSession.id });
    }
  }, [currentSession?.status, currentSession?.id, onNavigate]);

  // Cancel any speech while candidate is on instructions or device check screen
  useEffect(() => {
    if (isProctoredMode && (proctoring.proctoringState === 'instructions' || proctoring.proctoringState === 'device_check')) {
      ttsService.cancel();
      setAiStatus('idle');
    }
  }, [isProctoredMode, proctoring.proctoringState, setAiStatus]);

  // Load voices for capability detection and unlock audio on room entry
  useEffect(() => {
    ttsService.unlockAudio();
    ttsService.loadVoices().then(voices => {
      setAvailableVoices(voices);
    });
  }, []);

  const sessionLangConfig = getLanguageConfig(currentSession?.language || settings.language || 'en-IN');
  const voiceCheck = checkVoiceSupport(sessionLangConfig.code, availableVoices);

  const CODE_TEMPLATES: Record<string, string> = {
    JavaScript: `// JavaScript Solution\nfunction solution(input) {\n  // 1. Validate inputs\n  if (!input) return null;\n\n  // 2. Algorithm implementation\n  \n  return true;\n}`,
    Python: `# Python Solution\ndef solution(data):\n    # 1. Edge cases\n    if not data:\n        return None\n        \n    # 2. Algorithm logic\n    return None`,
    Java: `// Java Solution\nclass Solution {\n    public int solve(int[] nums) {\n        // Implementation\n        return 0;\n    }\n}`,
    'C++': `// C++ Solution\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint solve() {\n    // Implementation\n    return 0;\n}`,
    SQL: `-- SQL Query\nSELECT \n  c.id, c.name, AVG(e.score) as avg_score\nFROM candidates c\nGROUP BY c.id, c.name\nORDER BY avg_score DESC;`
  };

  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Keyboard accessibility: Ctrl/Cmd + Enter submits the answer
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmittingAnswer && (candidateText.trim() || interimTranscript.trim())) {
        handleSubmit();
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      setCandidateText(newVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Clear inputs on question switch
  useEffect(() => {
    setCandidateText('');
    setInterimTranscript('');
    setShowHint(false);
    setLastEvalScore(null);
    if (isRecording) {
      stopRecording();
    }
  }, [currentQuestionIndex]);

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = timeRemainingSeconds < 120; // under 2 minutes

  // Start speech recognition using session's language
  const startRecording = () => {
    if (isPaused) return;
    soundService.play('mic_start');

    setIsRecording(true);
    setAiStatus('listening');

    sttService.start(
      {
        onStart: () => {
          setIsRecording(true);
          setAiStatus('listening');
        },
        onInterim: (interim) => {
          setInterimTranscript(interim);
        },
        onFinal: (finalText) => {
          setCandidateText(prev => {
            const separator = prev.trim() ? ' ' : '';
            return `${prev.trim()}${separator}${finalText}`;
          });
          setInterimTranscript('');
        },
        onError: (err) => {
          console.warn('Speech error:', err);
          setIsRecording(false);
          setAiStatus('error');
          const errorText = typeof err === 'string' && err.trim() ? err : 'Microphone unavailable or speech recognition failed.';
          setMicErrorMsg(errorText);
          toastError('Microphone Issue', `${errorText} You can type your answer directly.`);
        },
        onEnd: () => {
          setIsRecording(false);
          if (aiStatus === 'listening') {
            setAiStatus('idle');
          }
        }
      },
      sessionLangConfig.sttLocale
    );
  };

  const stopRecording = () => {
    sttService.stop();
    soundService.play('mic_stop');
    setIsRecording(false);
    setInterimTranscript('');
    if (aiStatus === 'listening') {
      setAiStatus('idle');
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = async () => {
    if (isProctoredMode && (proctoring.proctoringState === 'paused' || proctoring.proctoringState === 'requires_review')) {
      toastInfo('Interview Paused', 'Please resume the interview to submit your answer.');
      return;
    }
    if (isRecording) {
      stopRecording();
    }
    const fullAnswer = candidateText.trim() + (interimTranscript ? ` ${interimTranscript.trim()}` : '');
    await submitAnswer(fullAnswer);
    // Show the score of the just-submitted answer
    const lastResp = currentSession?.responses[currentSession.responses.length - 1];
    if (lastResp?.evaluations) {
      setLastEvalScore(lastResp.evaluations.score);
      setTimeout(() => setLastEvalScore(null), 4000);
    }
    setCandidateText('');
    setInterimTranscript('');
  };

  const handleSkip = async () => {
    if (!pendingSkip) {
      setPendingSkip(true);
      toastInfo('Skip this question?', 'Click Skip again to confirm. It will receive a foundational score.');
      setTimeout(() => setPendingSkip(false), 4000);
      return;
    }
    setPendingSkip(false);
    if (isRecording) stopRecording();
    await skipQuestion();
    setCandidateText('');
    setInterimTranscript('');
    toastSuccess('Question skipped', 'Moving to the next question.');
  };

  const handleConfirmEnd = async () => {
    if (isRecording) stopRecording();
    setShowEndConfirmModal(false);
    if (isProctoredMode && currentSession?.id) {
      proctoring.completeInterview();
      proctoring.stopAllTracks();
      storageService.saveProctoringSnapshot(currentSession.id, proctoring.getSnapshot());
    }
    const finishedId = await endInterview();
    onNavigate('results', { sessionId: finishedId });
  };

  if (!currentSession || !currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-cyan-400">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white">No Active Interview In Progress</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Please enter your candidate name and configure your target role and experience to begin your personalized AI mock interview.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('setup')}
            className="px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:from-cyan-400 hover:to-violet-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Setup Interview (Enter Name & Role)</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Proctored Mode: Rules Screen ─────────────────────────────────────────
  if (isProctoredMode && proctoring.proctoringState === 'instructions') {
    return (
      <ProctoringRulesScreen
        candidateName={currentSession?.candidateName || 'Candidate'}
        onConsent={() => {
          proctoring.setConsentGiven(true);
          proctoring.setProctoringState('device_check');
        }}
        onDecline={() => onNavigate('setup')}
      />
    );
  }

  // ─── Proctored Mode: Device Check Screen ──────────────────────────────────
  if (isProctoredMode && proctoring.proctoringState === 'device_check') {
    return (
      <DeviceCheckScreen
        deviceStatus={proctoring.deviceStatus}
        isFullscreen={proctoring.isFullscreen}
        cameraStream={proctoring.cameraStream}
        onRequestCamera={proctoring.requestCamera}
        onRequestMicrophone={proctoring.requestMicrophone}
        onEnterFullscreen={proctoring.enterFullscreen}
        onProceed={() => {
          proctoring.setProctoringState('in_progress');
          // Speak question 1 only after permissions are accepted and candidate enters room
          ttsService.unlockAudio();
          setTimeout(() => {
            repeatCurrentQuestion();
          }, 350);
        }}
        onBack={() => proctoring.setProctoringState('instructions')}
        cameraRequired={true}
      />
    );
  }

  const currentQNum = currentQuestionIndex + 1;
  const totalQCount = currentSession.questions.length;
  const progressPercent = Math.round((currentQNum / totalQCount) * 100);

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">

      {/* Proctoring Warning / Pause Overlay */}
      {isProctoredMode && (
        <ProctoringWarningOverlay
          state={proctoring.proctoringState}
          violations={proctoring.violations}
          onResume={() => {
            proctoring.resumeFromPause();
            if (isPaused) togglePause();
          }}
          reviewNote="Your interview timer is paused. All submitted answers are preserved."
        />
      )}

      {/* Post-Answer Score Flash Banner */}
      {lastEvalScore !== null && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all animate-in slide-in-from-right-4 duration-500 ${
          lastEvalScore >= 80
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-emerald-500/20'
            : lastEvalScore >= 60
            ? 'bg-cyan-950/90 border-cyan-500/50 text-cyan-300 shadow-cyan-500/20'
            : 'bg-amber-950/90 border-amber-500/50 text-amber-300 shadow-amber-500/20'
        }`}>
          <Star className="w-4 h-4" />
          <div>
            <p className="text-xs font-semibold opacity-80">Answer Evaluated</p>
            <p className="text-lg font-extrabold font-mono">{lastEvalScore}%</p>
          </div>
          <button onClick={() => setLastEvalScore(null)} className="ml-2 text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}
      
      {/* AI Provider Status Banner */}
      {aiProviderStatus && (
        <div className={`flex items-center justify-between gap-3 px-4 py-2 rounded-xl border mb-3 text-[11px] ${
          aiProviderStatus.isLive
            ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            {aiProviderStatus.isLive
              ? <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              : <WifiOff className="w-3.5 h-3.5 text-slate-500" />}
            <span>{aiProviderStatus.message}</span>
            {aiProviderStatus.isLive && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 font-mono border border-emerald-700/40">
                {aiProviderStatus.model}
              </span>
            )}
          </div>
          <button
            onClick={refreshAIStatus}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh AI connection"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Top Status & Controls Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4 mb-6">
        
        {/* Left: Role & Track */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
            Q{currentQNum}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">{currentSession.role}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 uppercase">
                {currentQuestion.category.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <span>Candidate:</span>
                <span className="text-white font-extrabold">{currentSession.candidateName || currentSession.userName || 'Candidate'}</span>
              </span>
              {currentSession.resumeData && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <FileText className="w-2.5 h-2.5" />
                  <span>Resume Driven</span>
                </span>
              )}
              {currentSession.interviewFocus && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 uppercase">
                  Focus: {currentSession.interviewFocus.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Question {currentQNum} of {totalQCount} • Experience: <span className="capitalize text-cyan-300 font-semibold">{currentSession.experienceLevel}</span> • Difficulty: <span className="capitalize text-slate-300">{currentQuestion.difficulty}</span>
            </p>
          </div>
        </div>

        {/* Center: Live Countdown Timer */}
        <div className="flex items-center gap-3 bg-navy-950/90 px-4 py-2 rounded-xl border border-slate-800">
          <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
          <span className={`font-mono text-sm font-bold ${isTimeCritical ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
            {formatTime(timeRemainingSeconds)}
          </span>
          {isPaused && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
              PAUSED
            </span>
          )}
        </div>

        {/* Multilingual Session Language Badge & In-Room Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-400 text-xs font-semibold text-slate-200 transition-all shadow-sm"
            title="Interview Language (Click to switch)"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-white">{sessionLangConfig.flag} {sessionLangConfig.nativeName}</span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">({sessionLangConfig.name})</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-navy-950 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-bold text-cyan-400 px-2.5 py-1 uppercase tracking-wider border-b border-slate-800 mb-1">
                Switch Language
              </div>
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  type="button"
                  key={lang.id}
                  onClick={() => {
                    setSessionLanguage(lang.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    sessionLangConfig.id === lang.id
                      ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{lang.flag}</span>
                    <span className="font-bold">{lang.nativeName}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Room Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isPaused 
                ? 'bg-amber-950 text-amber-300 border-amber-600' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isPaused ? 'Resume Interview' : 'Pause Interview'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-amber-300" /> : <Pause className="w-4 h-4" />}
            <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
            title="Toggle Transcript Drawer"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Transcript ({currentSession.responses.length})</span>
          </button>

          <button
            onClick={() => setShowEndConfirmModal(true)}
            className="p-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold flex items-center gap-1.5"
            title="Conclude Interview Early"
          >
            <XSquare className="w-4 h-4" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>

      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden mb-6 border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto">
        
        {/* Left: AI Interviewer Presence */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-slate-800 flex flex-col items-center justify-between min-h-[380px] relative overflow-hidden">
          
          <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Placement AI Agent</span>
            </span>
            <span className="font-mono text-[11px] text-cyan-300 bg-slate-900 px-2 py-0.5 rounded">
              {aiStatus.toUpperCase()}
            </span>
          </div>

          {/* Central Holographic Avatar */}
          <div className="py-4 my-auto w-full flex flex-col items-center">
            <AIAvatar 
              status={aiStatus} 
              size="lg" 
              showStatusBadge={true} 
              onRetry={() => {
                setAiStatus('idle');
                repeatCurrentQuestion();
              }}
            />

            {/* Proctor Monitor Panel (inside avatar column for compact layout) */}
            {isProctoredMode && (
              <div className="w-full mt-3">
                <ProctorMonitorPanel
                  proctoringState={proctoring.proctoringState}
                  deviceStatus={proctoring.deviceStatus}
                  isFullscreen={proctoring.isFullscreen}
                  violations={proctoring.violations}
                  activeWarnings={proctoring.activeWarnings}
                  currentQuestionNum={currentQNum}
                  totalQuestions={totalQCount}
                  timeRemainingSeconds={timeRemainingSeconds}
                  cameraStream={proctoring.cameraStream}
                  onDismissWarning={proctoring.dismissWarning}
                />
              </div>
            )}
            {/* Live Real-time Spoken Subtitles Caption */}
            {aiStatus === 'speaking' && (
              <div className="mt-3 w-full max-w-sm px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-center shadow-lg shadow-cyan-950/50 animate-fadeIn">
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Interviewer Speaking:</span>
                </div>
                <p className="text-xs text-white font-medium leading-relaxed italic">
                  "{currentlySpokenText || currentQuestion.question}"
                </p>
              </div>
            )}
            {!voiceCheck.supported && (
              <div className="mt-3 text-[10px] px-3 py-1 rounded-xl bg-amber-950/70 border border-amber-600/40 text-amber-300 flex items-center justify-center gap-1.5 max-w-xs text-center mx-auto">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Visual Mode: Spoken voice unavailable for {sessionLangConfig.nativeName}</span>
              </div>
            )}
          </div>

          {/* AI Audio & Repeat Controls */}
          <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={repeatCurrentQuestion}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/30 px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repeat Question</span>
            </button>

            {currentQuestion.contextHint && (
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-950/60 border border-amber-600/40 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Hint' : 'View STAR Hint'}</span>
              </button>
            )}
          </div>

        </div>

        {/* Right: Question Prompt & Candidate Input Area */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Current Question Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 relative space-y-3">
            
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Current Question</span>
              </span>
              <div className="flex items-center gap-2">
                {/* AI source badge */}
                {currentQuestion.isFollowUp && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-950/80 text-violet-300 border border-violet-500/40">
                    <GitBranch className="w-2.5 h-2.5" />
                    Follow-up
                  </span>
                )}
                {currentQuestion.source === 'ai_generated' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Generated ✨
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-700">
                    📚 Curated
                  </span>
                )}
                {currentSession.resumeData && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                    <FileText className="w-2.5 h-2.5" />
                    Resume Context
                  </span>
                )}
                {/* Rubric weights */}
                {currentQuestion.rubricCriteria && currentQuestion.rubricCriteria.length > 0 && (
                  <span className="text-[10px] text-slate-500 hidden md:inline">
                    {currentQuestion.rubricCriteria.map(c => `${c.criterion} (${c.weight}%)`).join(' • ')}
                  </span>
                )}
              </div>
            </div>

            {/* Question loading state */}
            {isLoadingQuestion && (
              <div className="flex items-center gap-2 text-xs text-cyan-300 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI is generating your next question...</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-xl w-fit">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interviewer addressing candidate <strong className="text-white underline decoration-cyan-400 underline-offset-2">{currentSession.candidateName || currentSession.userName || 'Candidate'}</strong>:</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentQuestion.question}
            </h2>

            {showHint && currentQuestion.contextHint && (
              <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-600/40 text-amber-200 text-xs leading-relaxed animate-fadeIn">
                <strong>Interviewer Tip:</strong> {currentQuestion.contextHint}
              </div>
            )}

          </div>

          {/* Candidate Response Workspace */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4 flex-1 flex flex-col justify-between">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInputTab('text')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    inputTab === 'text' ? 'bg-slate-800 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Verbal & Text Answer</span>
                </button>
                <button
                  onClick={() => setInputTab('code')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    inputTab === 'code' ? 'bg-slate-800 text-violet-300 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Code / Pseudo-code</span>
                </button>
              </div>

              {inputTab === 'code' && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCodeLang}
                    onChange={(e) => setSelectedCodeLang(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-cyan-300 focus:outline-none"
                  >
                    {['JavaScript', 'Python', 'Java', 'C++', 'SQL'].map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!candidateText.trim() || confirmTemplatePending) {
                        setCandidateText(CODE_TEMPLATES[selectedCodeLang] || '');
                        setConfirmTemplatePending(false);
                        toastSuccess('Template Loaded', `Loaded ${selectedCodeLang} starter template.`);
                      } else {
                        setConfirmTemplatePending(true);
                        toastInfo('Confirm Load Template', 'Click again to replace existing code with starter template.');
                        setTimeout(() => setConfirmTemplatePending(false), 4000);
                      }
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors border ${
                      confirmTemplatePending
                        ? 'bg-amber-600 text-white border-amber-400 animate-pulse'
                        : 'bg-violet-950/70 hover:bg-violet-900/80 text-violet-300 border border-violet-700/50'
                    }`}
                  >
                    {confirmTemplatePending ? 'Click to Overwrite' : 'Load Template'}
                  </button>
                </div>
              )}

              {isRecording && (
                <div className="flex items-center gap-2 text-xs text-cyan-300 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Transcribing live voice...</span>
                </div>
              )}
            </div>

            {/* Microphone Warning / Error Banner */}
            {micErrorMsg && (
              <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-600/40 text-amber-200 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{micErrorMsg} — You can still type or paste your response in the text box below.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMicErrorMsg(null)}
                  className="text-xs text-amber-400 hover:text-white px-2 py-0.5 rounded bg-amber-900/50 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Input Textarea with live transcription and Tab indentation */}
            <div className="relative flex-1">
              <textarea
                ref={textInputRef}
                value={candidateText}
                onChange={(e) => setCandidateText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isRecording
                    ? "Speak into your microphone now... Your words will appear here in real-time."
                    : inputTab === 'code'
                    ? `// ${selectedCodeLang} Solution Workspace\n// Press Tab to indent by 2 spaces...\n`
                    : sessionLangConfig.inputPlaceholder
                }
                rows={inputTab === 'code' ? 8 : 6}
                className={`w-full h-full min-h-[140px] glass-input rounded-2xl p-4 text-xs sm:text-sm leading-relaxed resize-none focus:outline-none ${
                  inputTab === 'code' ? 'font-mono text-emerald-300 bg-slate-950/90' : 'font-sans'
                }`}
              />

              {interimTranscript && (
                <div className="absolute bottom-3 left-4 right-4 bg-navy-950/90 border border-cyan-500/30 p-2.5 rounded-xl text-xs text-cyan-200 italic animate-pulse">
                  Interim: "{interimTranscript}"
                </div>
              )}
            </div>

            {/* Live Response Word Count & Rubric Concept Tracker */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-3">
                <span>
                  Words: <strong className="text-white">{candidateText.trim() ? candidateText.trim().split(/\s+/).length : 0}</strong>
                </span>
                <span>•</span>
                <span>
                  Est. Speaking Time: <strong className="text-cyan-300">
                    ~{Math.max(1, Math.round((candidateText.trim() ? candidateText.trim().split(/\s+/).length : 0) / 125 * 60))}s
                  </strong>
                </span>
              </div>

              {/* Rubric keywords matched live */}
              {currentQuestion?.expectedKeywords && currentQuestion.expectedKeywords.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Concepts:</span>
                  {currentQuestion.expectedKeywords.map(kw => {
                    const isMentioned = candidateText.toLowerCase().includes(kw.toLowerCase()) || 
                                        interimTranscript.toLowerCase().includes(kw.toLowerCase());
                    return (
                      <span
                        key={kw}
                        className={`px-2 py-0.5 rounded-full text-[10px] transition-all ${
                          isMentioned
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 font-semibold'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {isMentioned ? '✓ ' : ''}{kw}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              
              {/* Mic Toggle Button */}
              <button
                type="button"
                onClick={handleToggleRecord}
                disabled={isSubmittingAnswer || isPaused}
                className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                  isRecording
                    ? 'bg-rose-500/30 border border-rose-500/60 text-rose-300 animate-pulse shadow-lg shadow-rose-500/20'
                    : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 text-rose-400" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-cyan-400" />
                    <span>Record with Mic</span>
                  </>
                )}
              </button>

              {/* Skip and Submit Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSubmittingAnswer || isPaused}
                  className="px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Skip Question</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmittingAnswer || isPaused || (!candidateText.trim() && !interimTranscript.trim())}
                  className={`px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    (!candidateText.trim() && !interimTranscript.trim()) || isSubmittingAnswer
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      : 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/25'
                  }`}
                >
                  {isSubmittingAnswer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>AI Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <span>{currentQNum === totalQCount ? 'Submit & Finalize' : 'Submit Answer'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Transcript Drawer Modal */}
      {showTranscriptDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-navy-950 border-l border-slate-800 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Conversation Transcript</h3>
                </div>
                <button
                  onClick={() => setShowTranscriptDrawer(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {currentSession.responses.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">
                    No submitted answers yet. Once you submit a response, it will be logged here.
                  </p>
                ) : (
                  currentSession.responses.map((resp, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-cyan-300 leading-snug flex-1">
                          Q{i + 1}{resp.isFollowUp ? ' (Follow-up 🔗)' : ''}: {resp.questionText}
                        </p>
                        {resp.evaluations && (
                          <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            resp.evaluations.score >= 80 ? 'bg-emerald-950 text-emerald-300 border-emerald-600' :
                            resp.evaluations.score >= 60 ? 'bg-cyan-950 text-cyan-300 border-cyan-600' :
                            'bg-amber-950 text-amber-300 border-amber-600'
                          }`}>{resp.evaluations.score}%</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 bg-navy-950 p-2.5 rounded-lg border border-slate-800 italic leading-relaxed">
                        "{resp.answerText || '[Skipped]'}"
                      </p>
                      {resp.evaluations && (
                        <div className="space-y-1.5">
                          {/* Score dimensions */}
                          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                            {[
                              { label: 'Accuracy', val: resp.evaluations.accuracyScore },
                              { label: 'Clarity', val: resp.evaluations.clarityScore },
                              { label: 'Depth', val: resp.evaluations.depthScore },
                              ...(resp.evaluations.relevanceScore != null ? [{ label: 'Relevance', val: resp.evaluations.relevanceScore }] : []),
                              ...(resp.evaluations.reasoningScore != null ? [{ label: 'Reasoning', val: resp.evaluations.reasoningScore }] : [])
                            ].map(dim => (
                              <div key={dim.label} className="bg-slate-800/80 rounded-lg p-1.5">
                                <div className="text-slate-500 mb-1">{dim.label}</div>
                                <div className={`font-bold ${
                                  dim.val >= 75 ? 'text-emerald-400' : dim.val >= 55 ? 'text-cyan-400' : 'text-amber-400'
                                }`}>{dim.val ?? '--'}%</div>
                                <div className="w-full bg-slate-700 h-0.5 rounded-full mt-1">
                                  <div className={`h-full rounded-full ${
                                    dim.val >= 75 ? 'bg-emerald-400' : dim.val >= 55 ? 'bg-cyan-400' : 'bg-amber-400'
                                  }`} style={{ width: `${dim.val ?? 0}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Feedback snippet */}
                          {resp.evaluations.feedback && (
                            <p className="text-[10px] text-slate-400 leading-relaxed italic">
                              {resp.evaluations.feedback}
                            </p>
                          )}
                          {/* Matched keywords */}
                          {resp.evaluations.matchedKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {resp.evaluations.matchedKeywords.slice(0, 5).map(kw => (
                                <span key={kw} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/40">✓ {kw}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>{resp.timeSpentSeconds}s response time</span>
                            <span>{resp.wordCount} words</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setShowTranscriptDrawer(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 mt-6"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* End Session Confirmation Modal */}
      {showEndConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-700 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/40 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Conclude Interview Now?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You have answered {currentSession.responses.length} of {totalQCount} questions. If you end the interview now, your final performance report will be generated based on your completed answers.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowEndConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Continue Interview
              </button>
              <button
                onClick={handleConfirmEnd}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                Yes, Finalize & Score
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
