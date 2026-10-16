import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Bot, 
  Cpu, 
  Code2, 
  Users, 
  BrainCircuit, 
  MessageSquareQuote, 
  CheckCircle, 
  Volume2, 
  Globe2, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Play, 
  FileCheck,
  Trophy,
  TrendingUp,
  Star
} from 'lucide-react';
import { AIAvatar } from '../components/avatar/AIAvatar';
import { INTERVIEW_CATEGORIES } from '../data/questionBank';
import { SUPPORTED_LANGUAGES } from '../config/languages';
import { AIStatus } from '../types/interview';
import { ttsService } from '../services/speechSynthesis';
import { useSettings } from '../context/SettingsContext';
import { storageService } from '../services/storage';

interface LandingPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { settings } = useSettings();
  const [demoStatus, setDemoStatus] = useState<AIStatus>('idle');
  const [samplePlaying, setSamplePlaying] = useState(false);

  // Live stats from localStorage
  const sessions = storageService.getSessions();
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalQuestionsAnswered = completedSessions.reduce((a, s) => a + (s.responses?.length || 0), 0);
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((a, s) => a + (s.overallScore || 0), 0) / completedSessions.length)
    : 0;

  // Animated counter hook (fires once on mount)
  function useAnimatedCount(target: number, duration = 1200) {
    const [count, setCount] = useState(0);
    const frameRef = useRef<number | null>(null);
    useEffect(() => {
      if (target === 0) return;
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setCount(Math.round(eased * target));
        if (progress < 1) frameRef.current = requestAnimationFrame(step);
      };
      frameRef.current = requestAnimationFrame(step);
      return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [target, duration]);
    return count;
  }

  const animQs = useAnimatedCount(totalQuestionsAnswered);
  const animSessions = useAnimatedCount(sessions.length);
  const animScore = useAnimatedCount(avgScore);

  const sampleQuestion = "Hello candidate! Welcome to AI Interview Pro. Tell me about your background, the key projects you have engineered, and what motivates you to excel in this role.";

  const handlePlaySample = () => {
    if (samplePlaying) {
      ttsService.cancel();
      setSamplePlaying(false);
      setDemoStatus('idle');
      return;
    }

    setSamplePlaying(true);
    setDemoStatus('speaking');
    ttsService.speak(
      sampleQuestion,
      {
        voiceURI: settings.voiceURI,
        pitch: settings.voicePitch,
        rate: settings.voiceRate,
        lang: settings.language
      },
      {
        onStart: () => {
          setDemoStatus('speaking');
          setSamplePlaying(true);
        },
        onEnd: () => {
          setDemoStatus('idle');
          setSamplePlaying(false);
        },
        onError: () => {
          setDemoStatus('idle');
          setSamplePlaying(false);
        }
      }
    );
  };

  const howItWorksSteps = [
    {
      step: '01',
      title: 'Select Role & Track',
      desc: 'Choose from Campus Placements, Full Stack SDE, HR Behavioral, or Aptitude, and customize question count and difficulty.',
      icon: Cpu,
      color: 'text-cyan-400',
      border: 'border-cyan-500/20'
    },
    {
      step: '02',
      title: 'Engage with AI Voice Bot',
      desc: 'Experience realistic back-and-forth mock interviews. Speak through your microphone or type answers with live transcription.',
      icon: Bot,
      color: 'text-violet-400',
      border: 'border-violet-500/20'
    },
    {
      step: '03',
      title: 'Get In-Depth Evaluation',
      desc: 'Receive transparent rubric-based scores, identified keywords, strengths, improvement areas, and model exemplar answers.',
      icon: BarChart3,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20'
    }
  ];

  return (
    <div className="w-full">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Glow backdrop shapes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-violet-600/15 to-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-xs font-semibold text-cyan-300 shadow-lg shadow-cyan-500/10">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Next-Gen Placement AI • Inspired by HCL Berrybot</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                Your Next Interview <br />
                <span className="gradient-text-cyan-violet">Starts Here.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Step into a realistic, AI-powered placement interview simulation. Master technical algorithms, system design, HR behavioral rounds, and aptitude questions with dynamic voice interactions and real rubric evaluations.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onNavigate('setup')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-400/40 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 group"
                >
                  <span>Start Interview</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate('dashboard')}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-base bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-500 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Candidate Dashboard</span>
                </button>
              </div>

              {/* Feature Highlights Pills */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Real Voice In & Out</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span>Transparent Scoring Rubrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-violet-400" />
                  <span>Zero Fake Results</span>
                </div>
              </div>

            </div>

            {/* Right Interactive AI Interviewer Column */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="glass-card rounded-3xl p-6 sm:p-8 w-full max-w-md border border-slate-700/50 relative overflow-hidden shadow-2xl">
                
                {/* Background decorative corner lights */}
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">AI Host Simulation</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    LIVE VOICE
                  </span>
                </div>

                {/* Central Interactive Avatar */}
                <div className="py-2">
                  <AIAvatar 
                    status={demoStatus} 
                    size="lg" 
                    showStatusBadge={true} 
                    onRetry={() => setDemoStatus('idle')} 
                  />
                </div>

                {/* Live State Switcher Pill Strip */}
                <div className="pt-3 flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mr-1">Preview State:</span>
                  {(['idle', 'speaking', 'listening', 'thinking', 'error'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        if (samplePlaying && st !== 'speaking') {
                          ttsService.cancel();
                          setSamplePlaying(false);
                        }
                        setDemoStatus(st);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                        demoStatus === st
                          ? 'bg-cyan-500 text-navy-950 shadow-md shadow-cyan-500/30'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Interactive Demo Player */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="bg-navy-950/70 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed italic">
                    "{sampleQuestion}"
                  </div>

                  <button
                    onClick={handlePlaySample}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                      samplePlaying 
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30' 
                        : 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25'
                    }`}
                  >
                    {samplePlaying ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                        <span>Stop Voice Sample</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                        <span>Hear AI Voice Introduction</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Live Stats Strip */}
      <section className="py-8 border-y border-slate-800/60 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Questions Answered', value: animQs > 0 ? `${animQs}` : `${INTERVIEW_CATEGORIES.length * 10}+`, icon: BrainCircuit, color: 'text-cyan-400', sub: 'across sessions' },
              { label: 'Practice Sessions', value: animSessions > 0 ? `${animSessions}` : '0', icon: Trophy, color: 'text-violet-400', sub: 'mock interviews run' },
              { label: 'Average Score', value: animScore > 0 ? `${animScore}%` : '—', icon: TrendingUp, color: 'text-emerald-400', sub: 'AI rubric evaluation' },
              { label: 'Languages', value: `${SUPPORTED_LANGUAGES.length}`, icon: Globe2, color: 'text-amber-400', sub: 'voice + transcript' }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="space-y-1 group">
                  <div className="flex items-center justify-center gap-2">
                    <Icon className={`w-4 h-4 ${stat.color} group-hover:scale-110 transition-transform`} />
                    <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${stat.color}`}>{stat.value}</span>
                  </div>
                  <p className="text-xs font-semibold text-white">{stat.label}</p>
                  <p className="text-[10px] text-slate-500">{stat.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Explore Interview Features & Tracks Section */}
      <section className="py-20 bg-navy-900/50 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Complete Placement Suite
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tailored Mock Interviews For Every Discipline
            </h3>
            <p className="text-slate-400 text-sm sm:text-base">
              Built specifically to prepare college students, freshers, and experienced engineers for modern placement drives and high-bar tech interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INTERVIEW_CATEGORIES.map(category => {
              return (
                <div
                  key={category.id}
                  className="glass-card-interactive rounded-2xl p-6 flex flex-col justify-between border border-slate-800 relative group overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${category.gradient} rounded-bl-full pointer-events-none opacity-50`} />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-800/80 text-cyan-300 border border-slate-700/60">
                        {category.badge}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ~{category.recommendedDuration} mins
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                      {category.title}
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {category.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {category.skillsCovered.map((skill, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('setup', { initialType: category.id })}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-cyan-500 hover:text-navy-950 text-slate-200 transition-all duration-200 flex items-center justify-center gap-2 group-hover:border-cyan-400/30"
                  >
                    <span>Practice {category.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400">
              Autonomous Assessment
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How AI Interview Pro Works
            </h3>
            <p className="text-slate-400 text-sm sm:text-base">
              A 3-step structured simulation that mirrors corporate campus placements like HCL Berrybot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-8 border border-slate-800 relative hover:border-slate-700 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-slate-900/80 border ${step.border} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${step.color}`} />
                    </div>
                    <span className="text-3xl font-black text-slate-700/60 font-mono">
                      {step.step}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-2">
                    {step.title}
                  </h4>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Supported Languages Section */}
      <section className="py-16 bg-navy-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                <Globe2 className="w-4 h-4" />
                <span>Global Placement Preparation</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Multilingual Speech Recognition & Synthesis
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Practice in standard international English, regional Indian English accents, or bilingual modes with localized pronunciation recognition.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {SUPPORTED_LANGUAGES.map(lang => (
                <div
                  key={lang.id}
                  className="glass-panel px-3.5 py-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center gap-1 hover:border-cyan-500/40 transition-colors"
                >
                  <span className="text-xl mb-0.5">{lang.flag}</span>
                  <p className="font-bold text-white text-xs leading-tight">{lang.nativeName}</p>
                  <p className="text-[10px] text-slate-400">{lang.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Begin Banner */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-cyan-500/20 text-center relative overflow-hidden shadow-2xl">
            {/* Decorative glow orbs */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-xs font-semibold text-cyan-300">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Trusted AI Placement Engine</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready to Clear Your <span className="gradient-text-cyan-violet">Dream Placement?</span>
              </h3>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Zero cost, no signups required. Configure your target role in 30 seconds and experience realistic AI-powered mock interviews with transparent rubric scoring.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center gap-3 py-1">
                {[
                  { icon: CheckCircle, text: 'Live Voice AI', color: 'text-emerald-400' },
                  { icon: ShieldCheck, text: 'Rubric-Based Scoring', color: 'text-cyan-400' },
                  { icon: Globe2, text: '6 Languages', color: 'text-violet-400' },
                  { icon: BarChart3, text: 'Progress Analytics', color: 'text-amber-400' },
                  { icon: FileCheck, text: 'PDF Report', color: 'text-rose-400' }
                ].map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Icon className={`w-3.5 h-3.5 ${f.color}`} />
                      <span>{f.text}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => onNavigate('setup')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-400/40 transition-all duration-300 flex items-center justify-center gap-2 group active:scale-95"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Configure Your Interview Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl font-semibold text-sm bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all"
                >
                  Candidate Dashboard
                </button>
                <button
                  onClick={() => onNavigate('progress')}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl font-semibold text-sm bg-slate-900/80 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-950/30 transition-all flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Analytics</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-600 pt-2">
                All data is stored locally. No account required. Your progress is private.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
