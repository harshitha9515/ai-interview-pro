import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  Mic, 
  Palette, 
  Sparkles, 
  Shield, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Radio, 
  KeyRound, 
  Trash2,
  Globe2
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { 
  SUPPORTED_LANGUAGES, 
  getLanguageConfig, 
  checkVoiceSupport, 
  checkSTTSupport 
} from '../config/languages';
import { ttsService } from '../services/speechSynthesis';
import { sttService } from '../services/speechRecognition';
import { storageService } from '../services/storage';
import { useToast } from '../context/ToastContext';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { settings, updateSettings, resetSettings, availableVoices } = useSettings();

  const [testSpeechPlaying, setTestSpeechPlaying] = useState<boolean>(false);
  const [micTesting, setMicTesting] = useState<boolean>(false);
  const [micTranscript, setMicTranscript] = useState<string>('');
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const currentLangConfig = getLanguageConfig(settings.language);
  const voiceCheck = checkVoiceSupport(settings.language, availableVoices);
  const sttCheck = checkSTTSupport(settings.language);

  const handleTestVoice = () => {
    if (testSpeechPlaying) {
      ttsService.cancel();
      setTestSpeechPlaying(false);
      return;
    }

    setTestSpeechPlaying(true);
    ttsService.speak(
      currentLangConfig.sampleText,
      {
        voiceURI: settings.voiceURI,
        pitch: settings.voicePitch,
        rate: settings.voiceRate,
        lang: currentLangConfig.code
      },
      {
        onStart: () => setTestSpeechPlaying(true),
        onEnd: () => setTestSpeechPlaying(false),
        onError: () => setTestSpeechPlaying(false)
      }
    );
  };

  const handleTestMic = () => {
    if (micTesting) {
      sttService.stop();
      setMicTesting(false);
      return;
    }

    setMicTesting(true);
    setMicTranscript(`Listening in ${currentLangConfig.name}... Speak a test phrase in ${currentLangConfig.nativeName}`);

    sttService.start(
      {
        onStart: () => setMicTesting(true),
        onFinal: (text) => {
          setMicTranscript(`✓ Captured: "${text}"`);
          setMicTesting(false);
          sttService.stop();
        },
        onError: (err) => {
          setMicTranscript(`✕ Error: ${err}`);
          setMicTesting(false);
        },
        onEnd: () => {
          setMicTesting(false);
        }
      },
      currentLangConfig.sttLocale
    );
  };

  const { success: toastSuccess, info: toastInfo } = useToast();
  const [confirmClearPending, setConfirmClearPending] = useState<boolean>(false);
  const [askedQuestionsCount, setAskedQuestionsCount] = useState<number>(() => storageService.getAskedQuestionsHistory().length);

  const handleSave = () => {
    setSaveToast(true);
    toastSuccess('Settings Saved', 'Your audio, voice, and AI preferences have been updated.');
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleResetQuestionsHistory = () => {
    storageService.clearAskedQuestionsHistory();
    setAskedQuestionsCount(0);
    toastSuccess('Question History Reset', 'Cross-session deduplication history has been reset. Fresh questions will be asked.');
  };

  const handleClearHistory = () => {
    if (confirmClearPending) {
      storageService.clearAllSessions();
      setConfirmClearPending(false);
      toastSuccess('History Cleared', 'All stored interview sessions have been removed.');
      setTimeout(() => onNavigate('dashboard'), 600);
    } else {
      setConfirmClearPending(true);
      toastInfo('Confirm Clear History', 'Click again to permanently erase all saved interviews.');
      setTimeout(() => setConfirmClearPending(false), 5000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <SettingsIcon className="w-4 h-4" />
            <span>Preferences & Integration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            System & Audio Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure speech synthesis voices, microphone sensitivity, language, and optional AI model integrations.
          </p>
        </div>

        {saveToast && (
          <div className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        
        {/* Voice Preferences */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-950 border border-violet-700/50 flex items-center justify-center text-violet-400">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">AI Voice & Speech Synthesis</h3>
                <p className="text-[11px] text-slate-400">Customize how the AI interviewer sounds during questions</p>
              </div>
            </div>

            <button
              onClick={handleTestVoice}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                testSpeechPlaying 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                  : 'bg-violet-500/20 text-violet-300 border border-violet-500/40 hover:bg-violet-500/30'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{testSpeechPlaying ? 'Stop Test' : 'Preview Voice'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Voice dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Installed Speech Synthesis Voice ({availableVoices.length} detected)
              </label>
              <select
                value={settings.voiceURI}
                onChange={(e) => updateSettings({ voiceURI: e.target.value })}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
              >
                <option value="">Browser Default AI Voice</option>
                {availableVoices.map(voice => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Default Language Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Target Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => {
                  const newLang = e.target.value;
                  const matching = checkVoiceSupport(newLang, availableVoices);
                  updateSettings({ 
                    language: newLang,
                    voiceURI: matching.preferredVoice?.voiceURI || ''
                  });
                }}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-medium"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.id} value={lang.code}>
                    {lang.flag} {lang.nativeName} — {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Capability Notice */}
            {!voiceCheck.supported && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Visual Question Prompt Mode</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {voiceCheck.message} You can still speak responses in {currentLangConfig.name} via microphone.
                  </p>
                </div>
              </div>
            )}

            {/* Voice Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Speech Rate</span>
                <span className="text-cyan-400 font-mono">{settings.voiceRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={settings.voiceRate}
                onChange={(e) => updateSettings({ voiceRate: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Voice Pitch Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Voice Pitch</span>
                <span className="text-violet-400 font-mono">{settings.voicePitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.25"
                step="0.05"
                value={settings.voicePitch}
                onChange={(e) => updateSettings({ voicePitch: parseFloat(e.target.value) })}
                className="w-full accent-violet-400"
              />
            </div>

          </div>

          {/* Auto speak questions checkbox */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <div>
              <p className="text-xs font-semibold text-white">Auto-Speak Questions Aloud</p>
              <p className="text-[11px] text-slate-400">The AI interviewer immediately reads each question upon transition</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSpeakQuestions}
              onChange={(e) => updateSettings({ autoSpeakQuestions: e.target.checked })}
              className="w-4 h-4 rounded accent-cyan-400"
            />
          </div>

        </div>

        {/* Microphone and Audio Settings */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Microphone & Speech Recognition</h3>
                <p className="text-[11px] text-slate-400">Test and calibrate your audio input hardware</p>
              </div>
            </div>

            <button
              onClick={handleTestMic}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                micTesting 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{micTesting ? 'Stop Mic Test' : 'Test Mic'}</span>
            </button>
          </div>

          {micTranscript && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300">
              {micTranscript}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <div>
              <p className="text-xs font-semibold text-white">Sound Effects</p>
              <p className="text-[11px] text-slate-400">Play subtle auditory cues on status changes and completion</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableSoundEffects}
              onChange={(e) => updateSettings({ enableSoundEffects: e.target.checked })}
              className="w-4 h-4 rounded accent-cyan-400"
            />
          </div>
        </div>

        {/* AI Engine & Optional Live Gemini Key */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">AI Evaluation Engine</h3>
              <p className="text-[11px] text-slate-400">Choose between the built-in deterministic NLP engine or live Gemini 1.5</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div
              onClick={() => updateSettings({ aiProvider: 'built-in' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.aiProvider === 'built-in'
                  ? 'bg-slate-800 border-cyan-400 text-cyan-200'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-white">Built-in NLP Rubrics</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Default (Free)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Deterministic keyword, structure, and STAR rubric engine. Works 100% offline with zero API keys or external server dependencies.
              </p>
            </div>

            <div
              onClick={() => updateSettings({ aiProvider: 'gemini' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.aiProvider === 'gemini'
                  ? 'bg-slate-800 border-violet-400 text-violet-200'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-white">Gemini 1.5 Flash</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                  Optional LLM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Live Google Deepmind LLM inference. Requires entering a free Gemini API key below.
              </p>
            </div>

          </div>

          {settings.aiProvider === 'gemini' && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Google Gemini API Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={settings.geminiApiKey || ''}
                  onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="flex-1 glass-input px-3.5 py-2 rounded-xl text-xs font-mono"
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Your API key is saved exclusively in your local browser storage and never transmitted to our servers.</span>
              </div>
            </div>
          )}

        </div>

        {/* Danger Zone: Reset & Clear */}
        <div className="glass-card rounded-2xl p-6 border border-rose-900/40 space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <Trash2 className="w-4 h-4" />
            <h3 className="font-bold text-sm">Data & History Management</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-white">Question Deduplication Tracking</p>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  {askedQuestionsCount} unique questions tracked
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Guarantees no repeated questions across past interviews. Reset to re-allow previous questions.</p>
            </div>
            <button
              onClick={handleResetQuestionsHistory}
              disabled={askedQuestionsCount === 0}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                askedQuestionsCount === 0
                  ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/40'
              }`}
            >
              Reset Question History
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white">Clear All Past Interviews</p>
              <p className="text-[11px] text-slate-400">Permanently delete stored interview scores, transcripts, and evaluation history</p>
            </div>
            <button
              onClick={handleClearHistory}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                confirmClearPending
                  ? 'bg-rose-600 text-white animate-pulse border border-rose-400 shadow-lg shadow-rose-600/30'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60'
              }`}
            >
              {confirmClearPending ? '⚠️ Click Again to Confirm Clear' : 'Clear Stored Sessions'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
