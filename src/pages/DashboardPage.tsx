import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Award, 
  Clock, 
  Calendar, 
  ArrowUpRight, 
  Sparkles, 
  BrainCircuit, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  RefreshCw, 
  ChevronRight,
  BookOpen,
  Flame,
  BarChart3
} from 'lucide-react';
import { storageService } from '../services/storage';
import { InterviewSession } from '../types/interview';
import { INTERVIEW_CATEGORIES } from '../data/questionBank';
import { INTERVIEW_TIPS, SKILL_BENCHMARKS } from '../data/mockData';
import { StatRing } from '../components/common/StatRing';
import { ScoreTrendChart } from '../components/common/ScoreTrendChart';
import { useToast } from '../context/ToastContext';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'in_progress'>('all');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const list = storageService.getSessions();
    setSessions(list);
  };

  const completedSessions = sessions.filter(s => s.status === 'completed' && s.overallScore !== undefined);
  
  // Calculate average score strictly from completed sessions
  const averageScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / completedSessions.length)
    : 0;

  const totalQuestionsAnswered = completedSessions.reduce(
    (acc, s) => acc + (s.responses?.length || 0), 
    0
  );

  const totalPracticeMinutes = completedSessions.reduce(
    (acc, s) => acc + Math.round((s.responses?.reduce((t, r) => t + r.timeSpentSeconds, 0) || 0) / 60),
    0
  );

  const { success: toastSuccess, info: toastInfo } = useToast();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (pendingDeleteId === id) {
      // Second click confirms
      storageService.deleteSession(id);
      setPendingDeleteId(null);
      toastSuccess('Session deleted', 'The interview record has been removed.');
      loadSessions();
    } else {
      setPendingDeleteId(id);
      toastInfo('Click again to confirm deletion', 'This action cannot be undone.');
      setTimeout(() => setPendingDeleteId(null), 4000);
    }
  };

  // Compute daily streak
  const computeStreak = useCallback(() => {
    const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dateSet = new Set(completedSessions.map(s => toKey(new Date(s.completedAt || s.createdAt))));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (dateSet.has(toKey(d))) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [completedSessions]);

  const streak = computeStreak();

  // Determine readiness status badge
  const getReadinessBadge = () => {
    if (completedSessions.length === 0) {
      return { label: 'New Candidate', color: 'bg-blue-900/60 text-blue-300 border-blue-700/50' };
    }
    if (averageScore >= 85) {
      return { label: 'Placement Ready ⭐', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' };
    }
    if (averageScore >= 70) {
      return { label: 'Promising Competency', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50' };
    }
    return { label: 'Needs Practice', color: 'bg-amber-950/80 text-amber-300 border-amber-500/50' };
  };

  const readiness = getReadinessBadge();

  // Filtered session list
  const filteredSessions = sessions.filter(s => {
    if (activeTab === 'completed') return s.status === 'completed';
    if (activeTab === 'in_progress') return s.status === 'in_progress';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      
      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-700/60 relative overflow-hidden bg-gradient-to-r from-navy-900 via-navy-850 to-navy-950">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Candidate Workspace
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${readiness.color}`}>
                {readiness.label}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back to <span className="gradient-text-cyan-violet">AI Interview Pro</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Track your mock interviews, sharpen your conceptual articulation, and review transparent AI rubric evaluations.
            </p>
          </div>

          <button
            onClick={() => onNavigate('setup')}
            className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-xl shadow-cyan-500/20 flex items-center gap-2 group transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start New Interview</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Placement Score</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {completedSessions.length > 0 ? `${averageScore}%` : 'N/A'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {completedSessions.length > 0 ? 'Based on completed rounds' : 'No completed sessions'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center">
            <Award className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Completed Sessions</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {completedSessions.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {sessions.length} total sessions created
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-violet-400" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Questions Answered</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {totalQuestionsAnswered}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Voice & text responses
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Practice Time</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {totalPracticeMinutes}m
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Simulated speaking time
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        {/* Streak + Analytics shortcut card */}
        <button
          onClick={() => onNavigate('progress')}
          className="glass-card-interactive rounded-2xl p-5 border border-slate-800 flex flex-col justify-between text-left group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="text-xs font-medium text-slate-400">Day Streak</p>
              <h3 className={`text-2xl font-extrabold mt-1 ${streak > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
                {streak > 0 ? `🔥 ${streak}` : '0'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {streak >= 3 ? 'On a roll! Keep going.' : 'Practice daily to build a streak'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-950/80 border border-orange-500/30 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>View Full Analytics →</span>
          </div>
        </button>

      </div>

      {/* Interview Categories Quick Launch */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Interview Categories</h2>
            <p className="text-xs text-slate-400">Choose a targeted category to launch instant preparation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INTERVIEW_CATEGORIES.map(cat => (
            <div
              key={cat.id}
              onClick={() => onNavigate('setup', { initialType: cat.id })}
              className="glass-card-interactive rounded-2xl p-5 border border-slate-800 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {cat.badge}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{cat.recommendedDuration}m</span>
                  </span>
                </div>
                <h3 className="font-bold text-white text-base mb-1.5 group-hover:text-cyan-300 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {cat.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400">
                <span>Start Practice</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Progression Trend Chart */}
      {completedSessions.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span>Performance Progression Trend</span>
              </h2>
              <p className="text-xs text-slate-400">
                Score progression trajectory across your completed interview rounds
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 font-mono">
                Latest: <strong>{completedSessions[0]?.overallScore ?? 0}%</strong>
              </span>
              <span className="px-3 py-1 rounded-lg bg-violet-950/80 border border-violet-800/40 text-violet-300 font-mono">
                Average: <strong>{averageScore}%</strong>
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto py-2">
            <div className="min-w-[500px] flex justify-center">
              <ScoreTrendChart 
                data={completedSessions.slice().reverse().map((s, idx) => ({
                  label: `Round ${idx + 1}`,
                  score: s.overallScore ?? 0
                }))} 
                width={720} 
                height={160} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions & Recommended Practice Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Interview Sessions */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <span>Recent Interview Sessions</span>
            </h2>

            {/* Filter Tabs & History Link */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${activeTab === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  All ({sessions.length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${activeTab === 'completed' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Completed ({completedSessions.length})
                </button>
              </div>

              <button
                onClick={() => onNavigate('history')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                View Archive →
              </button>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            /* Realistic Empty State */
            <div className="glass-card rounded-2xl p-10 border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-700/60 mx-auto flex items-center justify-center text-slate-400">
                <Calendar className="w-8 h-8 text-cyan-400/60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Interview Sessions Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You haven't completed any mock interviews yet. Launch your first round to evaluate your answers with our AI rubrics!
                </p>
              </div>
              <button
                onClick={() => onNavigate('setup')}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-navy-950 transition-all shadow-lg shadow-cyan-500/20"
              >
                Start First Interview
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map(session => {
                const dateStr = new Date(session.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const isCompleted = session.status === 'completed';
                const score = session.overallScore ?? 0;

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      if (isCompleted) {
                        onNavigate('results', { sessionId: session.id });
                      } else {
                        onNavigate('room');
                      }
                    }}
                    className="glass-card-interactive rounded-2xl p-4 sm:p-5 border border-slate-800 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {session.role}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-300 font-mono">
                          {session.type.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          isCompleted 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' 
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/40 animate-pulse'
                        }`}>
                          {isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 flex items-center gap-3">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{session.responses.length} / {session.totalQuestions} questions</span>
                        <span>•</span>
                        <span className="capitalize">{session.difficulty}</span>
                      </p>

                      {session.feedbackSummary && (
                        <p className="text-[11px] text-slate-300 line-clamp-1 italic pt-1">
                          "{session.feedbackSummary.overallSummary}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      {isCompleted && (
                        <div className="text-right">
                          <span className={`text-xl font-extrabold ${
                            score >= 80 ? 'text-emerald-400' : score >= 65 ? 'text-cyan-400' : 'text-amber-400'
                          }`}>
                            {score}%
                          </span>
                          <p className="text-[10px] text-slate-400 font-medium">Evaluation</p>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('results', { sessionId: session.id });
                          }}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="View Results"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          className="p-2 rounded-lg bg-slate-800/50 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Skill Summary & Recommended Areas */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Skill Performance Benchmark */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Skill Benchmarks</span>
            </h3>
            <p className="text-xs text-slate-400">
              Corporate placement readiness threshold targets:
            </p>

            <div className="space-y-3 pt-1">
              {SKILL_BENCHMARKS.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{item.skill}</span>
                    <span className="text-slate-400 font-mono">{item.averageScore}% / {item.targetScore}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${item.averageScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Practice Areas */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              <span>Recommended Practice</span>
            </h3>
            
            <div className="space-y-3">
              {INTERVIEW_TIPS.map((tip, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-800/40">
                      {tip.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white pt-1">{tip.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
