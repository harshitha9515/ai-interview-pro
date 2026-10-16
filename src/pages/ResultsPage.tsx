import React, { useEffect, useState } from 'react';
import { 
  Award, 
  RotateCcw, 
  Download, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  ArrowLeft,
  BookOpen,
  Check,
  X,
  Target,
  Compass,
  Code2,
  Cpu,
  ShieldAlert,
  Info,
  Calendar,
  Clock,
  Globe2,
  Briefcase,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storageService } from '../services/storage';
import { InterviewSession, CategoryWeightInfo } from '../types/interview';
import { useInterview } from '../context/InterviewContext';
import { StatRing } from '../components/common/StatRing';
import { getLanguageConfig } from '../config/languages';
import { CATEGORY_CRITERIA_DOCS } from '../services/aiEvaluator';
import { useToast } from '../context/ToastContext';

interface ResultsPageProps {
  onNavigate: (page: string, params?: any) => void;
  sessionId?: string;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ onNavigate, sessionId }) => {
  const { restartInterviewWithSession } = useInterview();
  const { success: toastSuccess } = useToast();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [showWeightInfo, setShowWeightInfo] = useState(false);

  useEffect(() => {
    let targetSession: InterviewSession | null = null;
    if (sessionId) {
      targetSession = storageService.getSessionById(sessionId);
    }
    
    // If not found by ID or no ID, grab latest completed session
    if (!targetSession) {
      const all = storageService.getSessions();
      targetSession = all.find(s => s.status === 'completed') || all[0] || null;
    }

    setSession(targetSession);

    // If score is 80+, trigger celebratory confetti
    if (targetSession && (targetSession.overallScore || 0) >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe confetti fallback
      }
    }
  }, [sessionId]);

  const toggleExpand = (qId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleRetry = () => {
    if (session) {
      const newId = restartInterviewWithSession(session);
      onNavigate('room', { sessionId: newId });
    } else {
      onNavigate('setup');
    }
  };

  const handlePrintDownload = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!session) return;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Interview_Report_${session.role.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    toastSuccess('Link copied!', 'Results page URL copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-400">
          <Award className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold text-white">No Evaluation Results Available</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Complete an interview session to unlock your in-depth performance analysis, rubric scores, and model answers.
        </p>
        <button
          onClick={() => onNavigate('setup')}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-navy-950 hover:bg-cyan-400"
        >
          Start An Interview
        </button>
      </div>
    );
  }

  const score = session.overallScore ?? 0;
  const summary = session.feedbackSummary;
  const langConfig = getLanguageConfig(session.language);

  // Compute duration
  const startTime = new Date(session.createdAt).getTime();
  const endTime = session.completedAt ? new Date(session.completedAt).getTime() : startTime;
  const diffSecs = Math.max(0, Math.round((endTime - startTime) / 1000));
  const durationFormatted = diffSecs > 0
    ? `${Math.floor(diffSecs / 60)}m ${diffSecs % 60}s`
    : `${session.durationMinutes || 15} mins`;

  // Compute or format category weights
  const categoryWeights: CategoryWeightInfo[] = summary?.categoryWeights && summary.categoryWeights.length > 0
    ? summary.categoryWeights
    : (summary?.categoryScores || []).map(cs => {
        const totalQ = session.responses.length || 1;
        const weightPercent = Math.round((cs.totalQuestions / totalQ) * 100);
        return {
          category: cs.category,
          weightPercent,
          score: cs.score,
          weightedContribution: Math.round((cs.score * weightPercent) / 100),
          criteriaDescription: cs.criteriaDescription || CATEGORY_CRITERIA_DOCS[cs.category] || CATEGORY_CRITERIA_DOCS.technical
        };
      });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 print:p-0 print:m-0 print:max-w-full">
      
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleShare}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrintDownload}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report (PDF)</span>
          </button>

          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Interview</span>
          </button>

          <button
            onClick={() => onNavigate('progress')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-950/50 hover:bg-violet-900/60 text-violet-300 border border-violet-500/30 flex items-center gap-1.5 transition-all"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>View Analytics</span>
          </button>
        </div>
      </div>

      {/* Main Score & Readiness Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/60 relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-850 to-navy-950 print:border print:border-slate-300 print:bg-white print:text-black">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left: Radial Score Donut */}
          <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800/80 pb-6 md:pb-0 md:pr-6 print:border-slate-300">
            <StatRing score={score} size={160} strokeWidth={12} label="Candidate Score" sublabel="Overall Score" />
            
            <div className="mt-3 text-center space-y-1">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border inline-block ${
                score >= 80 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 print:bg-emerald-100 print:text-emerald-900' :
                score >= 65 ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 print:bg-cyan-100 print:text-cyan-900' :
                'bg-amber-950/80 text-amber-300 border-amber-500/50 print:bg-amber-100 print:text-amber-900'
              }`}>
                {summary?.readinessStatus || 'Evaluation Complete'}
              </span>
              <p className="text-[10px] text-slate-400 print:text-slate-600">Calculated via Documented Category Weights</p>
            </div>
          </div>

          {/* Right: Role, Date & Executive Summary */}
          <div className="md:col-span-8 space-y-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-cyan-300 print:bg-slate-200 print:text-slate-800">
                  {session.type.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 print:text-slate-600">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {new Date(session.completedAt || session.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 print:text-slate-600">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Duration: <strong className="text-slate-200 font-mono print:text-slate-900">{durationFormatted}</strong>
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 w-fit">
                    <User className="w-3 h-3 text-cyan-400" />
                    <span>Candidate: <strong className="text-white">{session.candidateName || session.userName || 'Candidate'}</strong></span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white print:text-black">
                  {session.role} Interview Assessment
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 print:text-slate-700">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                  Level: <strong className="text-slate-200 capitalize ml-1 print:text-slate-900">{session.experienceLevel}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                  Language: <strong className="text-cyan-300 font-semibold ml-1 print:text-black">{langConfig.flag} {langConfig.nativeName} ({langConfig.name})</strong>
                </span>
                <span>•</span>
                <span>
                  Difficulty: <strong className="text-slate-200 capitalize print:text-slate-900">{session.difficulty}</strong>
                </span>
              </div>
            </div>

            {/* Executive Synthesis */}
            {summary && (
              <div className="bg-navy-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-2 print:bg-slate-50 print:border-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 print:text-slate-600">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Performance Synthesis
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    summary.source === 'gemini'
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                      : summary.source === 'openai'
                      ? 'bg-purple-950/70 text-purple-300 border-purple-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  } print:border-slate-400 print:text-slate-800`}>
                    {summary.source === 'gemini' ? '✨ Gemini AI Report' : summary.source === 'openai' ? '✨ OpenAI Report' : '📚 Rubric Engine'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed print:text-slate-800">
                  "{summary.overallSummary}"
                </p>
              </div>
            )}

            {/* Dimensional Category Breakdown Pills */}
            {summary?.categoryScores && summary.categoryScores.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {summary.categoryScores.map((cat, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center text-xs print:bg-slate-100 print:border-slate-300">
                    <div>
                      <span className="text-slate-300 font-medium capitalize block print:text-slate-800">{cat.category}</span>
                      <span className="text-[10px] text-slate-500 print:text-slate-600">{cat.totalQuestions} questions</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-cyan-400 font-mono block print:text-cyan-800">{cat.score}%</strong>
                      <span className={`text-[9px] uppercase font-bold ${
                        cat.status === 'excellent' ? 'text-emerald-400 print:text-emerald-700' :
                        cat.status === 'good' ? 'text-cyan-400 print:text-cyan-700' : 'text-amber-400 print:text-amber-700'
                      }`}>
                        {cat.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Documented Scoring Weights Breakdown Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 print:border-slate-300 print:bg-white print:text-black">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
              Documented Category Weights & Scoring Breakdown
            </h2>
          </div>
          <button
            onClick={() => setShowWeightInfo(!showWeightInfo)}
            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 no-print"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showWeightInfo ? 'Hide Criteria Notes' : 'How is this calculated?'}</span>
          </button>
        </div>

        {showWeightInfo && (
          <div className="p-3.5 rounded-xl bg-navy-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed no-print">
            <p><strong>Transparent Scoring Formula:</strong> Overall score is the weighted sum of category scores:</p>
            <p className="font-mono text-cyan-300 text-[11px]">
              Overall Score = Σ (Category Score × Category Weight %)
            </p>
            <p className="text-[11px] text-slate-400">
              Each category applies customized rubrics. For instance, HR behavioral questions do not score coding criteria, while coding questions evaluate sandbox test executions and algorithmic logic.
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider print:border-slate-300 print:text-slate-600">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Evaluation Rubric & Criteria</th>
                <th className="py-2.5 px-3 text-center">Category Score</th>
                <th className="py-2.5 px-3 text-center">Session Weight</th>
                <th className="py-2.5 px-3 text-right">Weighted Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
              {categoryWeights.map((cw, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors print:hover:bg-transparent">
                  <td className="py-3 px-3 font-semibold text-white capitalize flex items-center gap-2 print:text-black">
                    {cw.category === 'coding' ? <Code2 className="w-3.5 h-3.5 text-violet-400" /> :
                     cw.category === 'technical' ? <Cpu className="w-3.5 h-3.5 text-cyan-400" /> :
                     <Compass className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{cw.category}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-[11px] max-w-md print:text-slate-700">
                    {cw.criteriaDescription}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400 print:text-black">
                    {cw.score}%
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-300 print:text-black">
                    {cw.weightPercent}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                    +{cw.weightedContribution} pts
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-700 font-bold text-xs bg-slate-900/60 print:bg-slate-100 print:border-slate-400">
                <td className="py-3 px-3 text-white uppercase print:text-black" colSpan={2}>
                  Total Overall Weighted Score
                </td>
                <td className="py-3 px-3 text-center font-mono text-slate-400 print:text-slate-700">—</td>
                <td className="py-3 px-3 text-center font-mono text-slate-300 print:text-black">100%</td>
                <td className="py-3 px-3 text-right font-mono text-base text-cyan-400 print:text-black">
                  {score}/100
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Strengths & Improvement Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Identified Strengths */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 print:border-slate-300 print:bg-white print:text-black">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm print:text-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>What You Did Well (Strengths)</span>
          </div>

          {summary?.strengths && summary.strengths.length > 0 ? (
            <ul className="space-y-2.5">
              {summary.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed print:text-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 print:bg-emerald-700" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">Answer more questions to highlight technical strengths.</p>
          )}
        </div>

        {/* Actionable Areas to Improve */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 print:border-slate-300 print:bg-white print:text-black">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm print:text-amber-800">
            <AlertCircle className="w-4 h-4" />
            <span>Missing Points & Areas to Improve</span>
          </div>

          {summary?.improvements && summary.improvements.length > 0 ? (
            <ul className="space-y-2.5">
              {summary.improvements.map((imp, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed print:text-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 print:bg-amber-700" />
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">No major weaknesses detected. Keep up the high standard!</p>
          )}
        </div>

      </div>

      {/* Recommended Topics & Next Practice Action */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Recommended Topics to Study */}
        <div className="md:col-span-7 glass-card rounded-2xl p-6 border border-slate-800 space-y-3.5 print:border-slate-300 print:bg-white print:text-black">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm print:text-cyan-800">
            <BookOpen className="w-4 h-4" />
            <span>Recommended Topics to Study</span>
          </div>
          <p className="text-xs text-slate-400 print:text-slate-600">
            Based on concepts missed or partially covered during your answers, focus your revision on these core topics:
          </p>
          <div className="space-y-2 pt-1">
            {(summary?.recommendedTopics || [
              'System Design & Microservices Architecture',
              'Data Structures & Algorithmic Complexity (Big-O)',
              'STAR Method for Behavioral Problem Scenarios'
            ]).map((topic, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs print:bg-slate-100 print:border-slate-300">
                <span className="text-slate-200 font-medium print:text-black">{topic}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/40 print:bg-slate-200 print:text-black">
                  Recommended
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Clear Next-Practice Recommendation */}
        <div className="md:col-span-5 glass-card rounded-2xl p-6 border border-slate-800 space-y-3.5 flex flex-col justify-between print:border-slate-300 print:bg-white print:text-black">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-violet-400 font-bold text-sm print:text-violet-800">
              <Compass className="w-4 h-4" />
              <span>Next Practice Recommendation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-navy-950/90 p-3.5 rounded-xl border border-slate-800 print:bg-slate-100 print:border-slate-300 print:text-slate-800">
              {summary?.nextPracticeRecommendation ||
                'Schedule another 15-minute mock interview focusing specifically on your target category to reinforce newly learned concepts.'}
            </p>
          </div>

          <div className="pt-2 no-print">
            <button
              onClick={handleRetry}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Again with Same Setup</span>
            </button>
          </div>
        </div>

      </div>

      {/* Question-by-Question Deep Dive */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white print:text-black">Question-by-Question Evaluation</h2>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Actual submitted candidate answers, missing points, test executions, and suggested improved answers
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {session.responses.map((resp, idx) => {
            const qId = resp.questionId;
            const isExpanded = expandedQuestions[qId] ?? true;
            const evalResult = resp.evaluations;
            const respScore = evalResult?.score ?? 0;
            const matchedQ = session.questions?.find(q => q.id === qId);
            const isAiGenerated = matchedQ?.source === 'ai_generated';
            const isFollowUp = matchedQ?.isFollowUp || resp.isFollowUp;
            const isUnavailable = evalResult?.isUnavailable || !resp.answerText?.trim();

            return (
              <div
                key={qId}
                className="glass-card rounded-2xl border border-slate-800 overflow-hidden transition-all print:border-slate-300 print:bg-white print:text-black"
              >
                {/* Question Header Accordion */}
                <div
                  onClick={() => toggleExpand(qId)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850/50 transition-colors print:hover:bg-transparent"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-300 font-bold text-xs flex items-center justify-center flex-shrink-0 print:bg-slate-200 print:text-black">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-xs sm:text-sm font-bold text-white print:text-black">
                          {resp.questionText}
                        </h3>
                        {isAiGenerated ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-950/80 text-violet-300 border border-violet-500/40 inline-flex items-center gap-1 print:border-slate-400 print:text-black">
                            <Sparkles className="w-2.5 h-2.5" /> AI Generated
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 inline-flex items-center gap-1 print:border-slate-400 print:text-black">
                            <BookOpen className="w-2.5 h-2.5" /> Curated
                          </span>
                        )}
                        {isFollowUp && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 print:border-slate-400 print:text-black">
                            🔗 Follow-up
                          </span>
                        )}
                        {isUnavailable && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/40 print:border-rose-400 print:text-rose-900">
                            Skipped / Unanswered
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 print:text-slate-600">
                        Category: <span className="capitalize font-medium text-slate-300 print:text-black">{resp.category}</span> • {resp.wordCount} words • {resp.timeSpentSeconds}s duration
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-base font-extrabold font-mono ${
                      isUnavailable ? 'text-slate-500 print:text-slate-600' :
                      respScore >= 80 ? 'text-emerald-400 print:text-emerald-700' :
                      respScore >= 65 ? 'text-cyan-400 print:text-cyan-700' :
                      'text-amber-400 print:text-amber-700'
                    }`}>
                      {isUnavailable ? '0%' : `${respScore}%`}
                    </span>
                    <span className="no-print">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </span>
                  </div>
                </div>

                {/* Expanded Evaluation Body */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-slate-800/80 space-y-4 bg-navy-950/40 print:border-slate-300 print:bg-white print:text-black">
                    
                    {/* Candidate's submitted response */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 print:text-slate-600">
                        Candidate Answer
                      </h4>
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans print:bg-slate-50 print:border-slate-300 print:text-black">
                        {resp.answerText ? (
                          resp.answerText
                        ) : (
                          <span className="text-amber-400/90 italic flex items-center gap-1.5 print:text-amber-800">
                            <AlertCircle className="w-3.5 h-3.5" />
                            [Question skipped — no candidate response submitted. Marked clearly with 0 points.]
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Coding Test Execution vs AI Code Review (Distinguished) */}
                    {evalResult?.codingTestSummary && (
                      <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/40 text-xs space-y-1 print:bg-violet-50 print:border-violet-300 print:text-violet-950">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-violet-300 flex items-center gap-1.5 print:text-violet-900">
                            <Code2 className="w-3.5 h-3.5" />
                            Automated Sandbox Test Execution (Functional Correctness)
                          </span>
                          <span className="font-mono font-bold text-violet-200 print:text-violet-900">
                            {evalResult.codingTestSummary.passed} / {evalResult.codingTestSummary.total} Passed
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 print:text-slate-700">
                          {evalResult.codingTestSummary.details}
                        </p>
                      </div>
                    )}

                    {/* AI Feedback & Keyword Tags */}
                    {evalResult && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        
                        <div className="space-y-3">
                          <h4 className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider print:text-cyan-800">
                            AI Evaluation & Constructive Feedback
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed bg-navy-950 p-3 rounded-xl border border-slate-800/80 print:bg-slate-50 print:border-slate-300 print:text-black">
                            {evalResult.feedback}
                          </p>

                          {/* Metric sub-scores */}
                          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 print:bg-slate-100 print:border-slate-300">
                              <p className="text-slate-400 print:text-slate-600">Accuracy</p>
                              <p className="font-bold text-cyan-300 font-mono print:text-black">{evalResult.accuracyScore}%</p>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 print:bg-slate-100 print:border-slate-300">
                              <p className="text-slate-400 print:text-slate-600">Clarity</p>
                              <p className="font-bold text-violet-300 font-mono print:text-black">{evalResult.clarityScore}%</p>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 print:bg-slate-100 print:border-slate-300">
                              <p className="text-slate-400 print:text-slate-600">Depth</p>
                              <p className="font-bold text-emerald-300 font-mono print:text-black">{evalResult.depthScore}%</p>
                            </div>
                            {evalResult.relevanceScore !== undefined && (
                              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 print:bg-slate-100 print:border-slate-300">
                                <p className="text-slate-400 print:text-slate-600">Relevance</p>
                                <p className="font-bold text-amber-300 font-mono print:text-black">{evalResult.relevanceScore}%</p>
                              </div>
                            )}
                            {evalResult.reasoningScore !== undefined && (
                              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 print:bg-slate-100 print:border-slate-300">
                                <p className="text-slate-400 print:text-slate-600">Reasoning</p>
                                <p className="font-bold text-blue-300 font-mono print:text-black">{evalResult.reasoningScore}%</p>
                              </div>
                            )}
                            {evalResult.completenessScore !== undefined && (
                              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 print:bg-slate-100 print:border-slate-300">
                                <p className="text-slate-400 print:text-slate-600">Completeness</p>
                                <p className="font-bold text-rose-300 font-mono print:text-black">{evalResult.completenessScore}%</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Missing Points or Errors */}
                          {evalResult.missingPoints && evalResult.missingPoints.length > 0 && (
                            <div className="space-y-1.5">
                              <h4 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider print:text-amber-800">
                                Missing Points or Omissions
                              </h4>
                              <ul className="space-y-1">
                                {evalResult.missingPoints.map((mp, i) => (
                                  <li key={i} className="text-xs text-amber-200/90 flex items-start gap-1.5 bg-amber-950/30 p-2 rounded-lg border border-amber-800/30 print:bg-amber-50 print:border-amber-200 print:text-amber-900">
                                    <X className="w-3.5 h-3.5 mt-0.5 text-amber-400 flex-shrink-0" />
                                    <span>{mp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Keyword Coverage */}
                          <div className="space-y-2">
                            <div>
                              <span className="text-[10px] text-emerald-400 font-semibold block mb-1 print:text-emerald-800">
                                Matched Concepts:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {evalResult.matchedKeywords.length > 0 ? (
                                  evalResult.matchedKeywords.map((kw, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 flex items-center gap-1 print:bg-emerald-100 print:border-emerald-300 print:text-emerald-900">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>{kw}</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-slate-500 italic print:text-slate-600">None matched</span>
                                )}
                              </div>
                            </div>

                            {evalResult.missedKeywords.length > 0 && (
                              <div>
                                <span className="text-[10px] text-amber-400 font-semibold block mb-1 print:text-amber-800">
                                  Missed Core Keywords:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {evalResult.missedKeywords.map((kw, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/40 text-amber-300 flex items-center gap-1 print:bg-amber-100 print:border-amber-300 print:text-amber-900">
                                      <X className="w-2.5 h-2.5" />
                                      <span>{kw}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Suggested Improved Answer */}
                    {(evalResult?.suggestedImprovedAnswer || evalResult?.modelAnswer) && (
                      <div className="pt-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 print:text-emerald-800">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Suggested Improved Answer (Exemplar for Beginners)</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-100 leading-relaxed print:bg-emerald-50 print:border-emerald-300 print:text-emerald-950">
                          {evalResult.suggestedImprovedAnswer || evalResult.modelAnswer}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Practice Disclaimers & Ethics Note */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-slate-400 space-y-2 text-xs print:border-slate-300 print:bg-white print:text-slate-700">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs print:text-black">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span>Evaluation Ethics & Educational Practice Notice</span>
        </div>
        <p className="leading-relaxed">
          <strong>Practice Tool Disclaimer:</strong> AI Interview Pro is an educational self-improvement simulation. Evaluation scores are generated using automated rubrics and do not represent a guarantee of selection, hiring, or specific employment outcomes with any organization.
        </p>
        <p className="leading-relaxed text-[11px] text-slate-500 print:text-slate-600">
          <strong>Language & Accent Fairness:</strong> Evaluations assess substantive technical knowledge and logical reasoning. Candidates are never penalized for regional accents, pronunciation variations, or natural multilingual code-switching.
        </p>
      </div>

    </div>
  );
};
