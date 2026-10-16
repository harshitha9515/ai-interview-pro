import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  ArrowLeft,
  Award,
  Target,
  Calendar,
  Flame,
  BrainCircuit,
  BarChart3,
  Zap,
  BookOpen,
  PlayCircle,
  Trophy,
  ChevronRight,
  Star,
  Clock,
  Code2,
  MessageSquare,
  Cpu,
  Compass
} from 'lucide-react';
import { storageService } from '../services/storage';
import { InterviewSession, InterviewType } from '../types/interview';
import { StatRing } from '../components/common/StatRing';
import { RadarChart } from '../components/common/RadarChart';

interface ProgressPageProps {
  onNavigate: (page: string, params?: any) => void;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStreak(sessions: InterviewSession[]): number {
  const completed = sessions.filter(s => s.status === 'completed');
  if (completed.length === 0) return 0;

  const dateSet = new Set(completed.map(s => toDateKey(new Date(s.completedAt || s.createdAt))));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (dateSet.has(toDateKey(d))) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

function computeActivityMap(sessions: InterviewSession[]): Map<string, number> {
  const map = new Map<string, number>();
  sessions.forEach(s => {
    const key = toDateKey(new Date(s.completedAt || s.createdAt));
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

const CATEGORY_INFO: Record<InterviewType, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
  placement_mixed: { label: 'Placement Mixed', icon: ({ className }) => <Trophy className={className} />, color: 'text-violet-400' },
  technical:       { label: 'Technical',        icon: ({ className }) => <Cpu className={className} />, color: 'text-cyan-400' },
  coding:          { label: 'Coding',           icon: ({ className }) => <Code2 className={className} />, color: 'text-emerald-400' },
  hr:              { label: 'HR / Behavioral',  icon: ({ className }) => <MessageSquare className={className} />, color: 'text-rose-400' },
  aptitude:        { label: 'Aptitude',         icon: ({ className }) => <BrainCircuit className={className} />, color: 'text-amber-400' },
  communication:   { label: 'Communication',   icon: ({ className }) => <Compass className={className} />, color: 'text-sky-400' }
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ProgressPage: React.FC<ProgressPageProps> = ({ onNavigate }) => {
  const sessions = storageService.getSessions();
  const completed = sessions.filter(s => s.status === 'completed' && s.overallScore !== undefined);
  const [hoverDay, setHoverDay] = useState<string | null>(null);

  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((a, s) => a + (s.overallScore || 0), 0) / completed.length)
    : 0;

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const activityMap = useMemo(() => computeActivityMap(sessions), [sessions]);

  const totalPracticeMin = Math.round(
    completed.reduce((a, s) => a + (s.responses?.reduce((t, r) => t + r.timeSpentSeconds, 0) || 0), 0) / 60
  );

  const bestScore = completed.length > 0 ? Math.max(...completed.map(s => s.overallScore || 0)) : 0;

  // Per-category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    completed.forEach(s => {
      if (!map[s.type]) map[s.type] = { total: 0, count: 0 };
      map[s.type].total += s.overallScore || 0;
      map[s.type].count += 1;
    });
    return Object.entries(map).map(([type, { total, count }]) => ({
      type: type as InterviewType,
      avg: Math.round(total / count),
      count
    })).sort((a, b) => b.avg - a.avg);
  }, [completed]);

  // Radar data — map category scores to radar axes
  const radarData = useMemo(() => {
    const axes = [
      { label: 'Technical', key: 'technical' as InterviewType },
      { label: 'Coding',    key: 'coding'    as InterviewType },
      { label: 'HR',        key: 'hr'        as InterviewType },
      { label: 'Aptitude',  key: 'aptitude'  as InterviewType },
      { label: 'Communication', key: 'communication' as InterviewType },
      { label: 'Placement', key: 'placement_mixed' as InterviewType }
    ];
    const catMap: Record<string, number> = {};
    categoryBreakdown.forEach(c => { catMap[c.type] = c.avg; });
    return axes.map(a => ({ label: a.label, value: catMap[a.key] ?? 0 }));
  }, [categoryBreakdown]);

  // Score progression — last 10 completed sessions, oldest first
  const progressionData = useMemo(() => {
    return [...completed]
      .sort((a, b) => new Date(a.completedAt || a.createdAt).getTime() - new Date(b.completedAt || b.createdAt).getTime())
      .slice(-10);
  }, [completed]);

  // Weak areas — category with lowest avg score
  const weakAreas = useMemo(() => {
    return categoryBreakdown
      .filter(c => c.avg < 70)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 3);
  }, [categoryBreakdown]);

  // Heatmap: last 84 days (12 weeks)
  const heatmapDays = useMemo(() => {
    const days: { key: string; date: Date; count: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toDateKey(d);
      days.push({ key, date: d, count: activityMap.get(key) || 0 });
    }
    return days;
  }, [activityMap]);

  const heatCellColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/60';
    if (count === 1) return 'bg-cyan-900/80';
    if (count === 2) return 'bg-cyan-700/80';
    return 'bg-cyan-500/90';
  };

  // Days since last session
  const daysSinceLast = completed.length > 0
    ? daysSince(completed.sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())[0].completedAt || completed[0].createdAt)
    : null;

  if (completed.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="glass-card rounded-3xl p-14 border border-slate-800 text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700 mx-auto flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-cyan-400/60" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">No Analytics Yet</h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Complete at least one interview session to unlock your personalized progress dashboard with skill radar, streaks, and category analytics.
            </p>
          </div>
          <button
            onClick={() => onNavigate('setup')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20"
          >
            <PlayCircle className="w-4 h-4" />
            Start Your First Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1.5">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="gradient-text-cyan-violet">Progress Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Deep-dive into your performance metrics and skill development trajectory.
          </p>
        </div>
        <button
          onClick={() => onNavigate('setup')}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20"
        >
          <PlayCircle className="w-4 h-4" />
          New Practice
        </button>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Avg Score',    value: `${avgScore}%`,      icon: Award,       color: 'text-cyan-400',    sub: 'across all rounds' },
          { label: 'Best Score',   value: `${bestScore}%`,     icon: Trophy,      color: 'text-emerald-400', sub: 'personal best' },
          { label: 'Sessions',     value: completed.length,    icon: Calendar,    color: 'text-violet-400',  sub: 'completed rounds' },
          { label: 'Practice Min', value: totalPracticeMin,    icon: Clock,       color: 'text-amber-400',   sub: 'total time' },
          { label: 'Day Streak',   value: streak,              icon: Flame,       color: 'text-orange-400',  sub: streak >= 3 ? '🔥 on a roll!' : 'practice daily' },
          { label: 'Last Session', value: daysSinceLast === 0 ? 'Today' : daysSinceLast === 1 ? 'Yesterday' : `${daysSinceLast}d ago`, icon: Zap, color: 'text-rose-400', sub: 'recency' }
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className={`text-xl font-extrabold font-mono ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-slate-500">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Radar + Score progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Skill Radar */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              Skill Radar
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Average performance per interview category</p>
          </div>
          <div className="flex items-center justify-center py-2">
            <RadarChart data={radarData} size={260} />
          </div>
        </div>

        {/* Right: Category Breakdown */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Category Performance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Scored across completed sessions in each track</p>
          </div>

          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No category data available yet.</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map(c => {
                const info = CATEGORY_INFO[c.type];
                const Icon = info.icon;
                return (
                  <div key={c.type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${info.color}`} />
                        <span className="text-slate-300 font-medium">{info.label}</span>
                        <span className="text-slate-600">({c.count} session{c.count !== 1 ? 's' : ''})</span>
                      </div>
                      <span className={`font-mono font-bold ${
                        c.avg >= 80 ? 'text-emerald-400' : c.avg >= 65 ? 'text-cyan-400' : 'text-amber-400'
                      }`}>{c.avg}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${c.avg}%`,
                          background: c.avg >= 80
                            ? 'linear-gradient(90deg,#10b981,#34d399)'
                            : c.avg >= 65
                            ? 'linear-gradient(90deg,#06b6d4,#818cf8)'
                            : 'linear-gradient(90deg,#f59e0b,#fb923c)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Score Progression Timeline */}
      {progressionData.length >= 2 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Score Progression Timeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Your last {progressionData.length} completed sessions</p>
          </div>

          <div className="overflow-x-auto">
            <div className="flex items-end gap-2 min-w-[400px] h-36 px-1">
              {progressionData.map((s, i) => {
                const score = s.overallScore || 0;
                const heightPct = Math.max(score, 5);
                const date = new Date(s.completedAt || s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const barColor = score >= 80 ? '#10b981' : score >= 65 ? '#06b6d4' : '#f59e0b';
                return (
                  <div key={s.id} className="flex flex-col items-center gap-1 flex-1 min-w-[36px] group">
                    <span className="text-[10px] font-mono font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {score}%
                    </span>
                    <div
                      className="w-full rounded-t-lg cursor-default transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${(heightPct / 100) * 100}px`, background: barColor, minHeight: '4px' }}
                      title={`${date}: ${score}%`}
                    />
                    <span className="text-[9px] text-slate-500 text-center leading-tight">{date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trend annotation */}
          {progressionData.length >= 2 && (() => {
            const first = progressionData[0].overallScore || 0;
            const last = progressionData[progressionData.length - 1].overallScore || 0;
            const diff = last - first;
            return (
              <div className={`flex items-center gap-2 text-xs font-semibold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                <TrendingUp className={`w-3.5 h-3.5 ${diff < 0 ? 'rotate-180' : ''}`} />
                <span>
                  {diff >= 0 ? '+' : ''}{diff}% improvement from your first to latest session
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Activity Heatmap */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Practice Activity — Last 12 Weeks
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {streak > 0 ? (
              <span className="text-orange-400 font-semibold">🔥 {streak}-day streak!</span>
            ) : 'Start a streak by practicing today.'}
          </p>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="grid grid-flow-col gap-1 auto-cols-max min-w-max">
            {heatmapDays.map(({ key, date, count }) => (
              <div
                key={key}
                onMouseEnter={() => setHoverDay(key)}
                onMouseLeave={() => setHoverDay(null)}
                title={`${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${count} session${count !== 1 ? 's' : ''}`}
                className={`w-3.5 h-3.5 rounded-sm cursor-default transition-all duration-150 
                  ${heatCellColor(count)}
                  ${hoverDay === key ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950' : ''}
                `}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-500">
            <span>Less</span>
            {[0, 1, 2, 3].map(n => (
              <div key={n} className={`w-3 h-3 rounded-sm ${heatCellColor(n)}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Bottom: Weak Areas + Recent Sessions Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Weak Areas Recommendations */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            Focus Areas
          </h2>

          {weakAreas.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <Star className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-300 font-semibold">Excellent! All tracked categories are above 70%.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {weakAreas.map(c => {
                const info = CATEGORY_INFO[c.type];
                const Icon = info.icon;
                const studyTopics: Record<InterviewType, string[]> = {
                  technical:       ['OS Fundamentals', 'Networking Basics', 'DBMS Concepts', 'OOP Principles'],
                  coding:          ['Arrays & Strings', 'Dynamic Programming', 'Graph Traversal', 'Recursion'],
                  hr:              ['STAR Method', 'Conflict Resolution', 'Leadership Stories', 'Career Goals'],
                  aptitude:        ['Time & Work', 'Permutation-Combination', 'Data Interpretation', 'Logical Reasoning'],
                  communication:   ['Structured Speaking', 'Active Listening', 'Non-verbal Cues', 'Presentation Skills'],
                  placement_mixed: ['Resume Building', 'Group Discussion', 'Mock Aptitude', 'Tech Fundamentals']
                };
                return (
                  <div key={c.type} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${info.color}`} />
                        <span className="text-sm font-bold text-white">{info.label}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">{c.avg}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(studyTopics[c.type] || []).map(topic => (
                        <span key={topic} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {topic}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => onNavigate('setup', { initialType: c.type })}
                      className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <span>Practice this track</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent 5 sessions */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            Recent Sessions
          </h2>

          <div className="space-y-2">
            {completed.slice(0, 6).map(s => {
              const score = s.overallScore || 0;
              const dateStr = new Date(s.completedAt || s.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              });
              return (
                <div
                  key={s.id}
                  onClick={() => onNavigate('results', { sessionId: s.id })}
                  className="glass-card-interactive flex items-center justify-between rounded-xl p-3.5 border border-slate-800 cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {s.role}
                    </p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span className="capitalize">{s.type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>{s.responses.length} Qs</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-base font-extrabold font-mono ${
                      score >= 80 ? 'text-emerald-400' : score >= 65 ? 'text-cyan-400' : 'text-amber-400'
                    }`}>{score}%</span>
                    <StatRing score={score} size={36} strokeWidth={3} label="" sublabel="" />
                  </div>
                </div>
              );
            })}
          </div>

          {completed.length > 6 && (
            <button
              onClick={() => onNavigate('history')}
              className="w-full py-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors text-center"
            >
              View full history →
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
