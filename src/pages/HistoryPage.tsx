import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Trash2, 
  Eye, 
  Search, 
  Award, 
  Clock, 
  PlayCircle, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  X,
  Code2,
  Cpu,
  Compass,
  MessageSquare,
  Sparkles,
  ArrowUpDown,
  Download,
  FileText
} from 'lucide-react';
import { storageService } from '../services/storage';
import { InterviewSession, InterviewType } from '../types/interview';
import { getLanguageConfig } from '../config/languages';
import { StatRing } from '../components/common/StatRing';
import { pdfExportService } from '../services/pdfExportService';

interface HistoryPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_score' | 'lowest_score'>('newest');

  // Confirmation Modals
  const [deleteModalSession, setDeleteModalSession] = useState<InterviewSession | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const list = storageService.getSessions();
    setSessions(list);
  };

  const handleDeleteConfirmed = () => {
    if (!deleteModalSession) return;
    storageService.deleteSession(deleteModalSession.id);
    setDeleteModalSession(null);
    loadSessions();
  };

  const handleClearAllConfirmed = () => {
    storageService.clearAllSessions();
    setShowClearAllModal(false);
    loadSessions();
  };

  // Filter & Search Logic
  const filteredSessions = sessions.filter(s => {
    // Search
    const candidateStr = (s.candidateName || s.userName || '').toLowerCase();
    const matchesSearch = !searchQuery.trim() || 
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidateStr.includes(searchQuery.toLowerCase()) ||
      s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.language && s.language.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category
    const matchesCategory = selectedCategory === 'all' || s.type === selectedCategory;

    // Status
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort Logic
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const timeA = new Date(a.completedAt || a.createdAt).getTime();
    const timeB = new Date(b.completedAt || b.createdAt).getTime();
    const scoreA = a.overallScore ?? -1;
    const scoreB = b.overallScore ?? -1;

    switch (sortBy) {
      case 'oldest':
        return timeA - timeB;
      case 'highest_score':
        return scoreB - scoreA;
      case 'lowest_score':
        return scoreA - scoreB;
      case 'newest':
      default:
        return timeB - timeA;
    }
  });

  const completedList = sessions.filter(s => s.status === 'completed');
  const avgScore = completedList.length > 0
    ? Math.round(completedList.reduce((acc, s) => acc + (s.overallScore || 0), 0) / completedList.length)
    : 0;

  const placementReadyCount = completedList.filter(s => (s.overallScore || 0) >= 80).length;

  const getCategoryIcon = (type: InterviewType) => {
    switch (type) {
      case 'coding':
        return <Code2 className="w-4 h-4 text-violet-400" />;
      case 'technical':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'hr':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'aptitude':
      case 'communication':
      default:
        return <Compass className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
        <div className="space-y-1.5">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Interview History & Archives
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono border border-slate-700">
              {sessions.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Review detailed reports, question breakdowns, and score progress across all your past practice sessions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {sessions.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/40 flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('setup')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start New Interview</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400">Total Interviews</p>
          <p className="text-2xl font-extrabold font-mono text-white">{sessions.length}</p>
          <p className="text-[10px] text-slate-500">{completedList.length} completed rounds</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400">Average Score</p>
          <p className="text-2xl font-extrabold font-mono text-cyan-400">
            {completedList.length > 0 ? `${avgScore}%` : '—'}
          </p>
          <p className="text-[10px] text-slate-500">Across completed sessions</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400">Placement Ready</p>
          <p className="text-2xl font-extrabold font-mono text-emerald-400">{placementReadyCount}</p>
          <p className="text-[10px] text-slate-500">Scores ≥ 80%</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400">Active Storage</p>
          <p className="text-2xl font-extrabold font-mono text-violet-400">
            {storageService.getActiveSession() ? 'In Progress' : 'Idle'}
          </p>
          <p className="text-[10px] text-slate-500">Safe offline persistence</p>
        </div>
      </div>

      {/* Filters, Search & Sorting Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, track, or language..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status & Sort Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="in_progress">In Progress</option>
            </select>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1.5 text-xs text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_score">Highest Score</option>
                <option value="lowest_score">Lowest Score</option>
              </select>
            </div>
          </div>

        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Tracks' },
            { id: 'placement_mixed', label: 'Placement Mixed' },
            { id: 'technical', label: 'Technical' },
            { id: 'coding', label: 'Coding' },
            { id: 'hr', label: 'HR Behavioral' },
            { id: 'aptitude', label: 'Aptitude' },
            { id: 'communication', label: 'Communication' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session List */}
      {sortedSessions.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
            <Calendar className="w-8 h-8 text-cyan-400/60" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Interviews Match Your Filter</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query or category filters, or launch a new interview session.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {sortedSessions.map(session => {
            const isCompleted = session.status === 'completed';
            const score = session.overallScore ?? 0;
            const lang = getLanguageConfig(session.language);
            const dateStr = new Date(session.completedAt || session.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

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
                className="glass-card-interactive rounded-2xl p-5 border border-slate-800 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
              >
                {/* Left: Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="p-1 rounded-lg bg-slate-800">
                      {getCategoryIcon(session.type)}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {session.role}
                    </h3>
                    {(session.candidateName || session.userName) && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                        👤 {session.candidateName || session.userName}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {session.type.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      isCompleted 
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' 
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800/40 animate-pulse'
                    }`}>
                      {isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                    {session.feedbackSummary?.readinessStatus && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 font-semibold">
                        {session.feedbackSummary.readinessStatus}
                      </span>
                    )}
                    {session.resumeData && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
                        <FileText className="w-2.5 h-2.5" />
                        <span>Resume</span>
                      </span>
                    )}
                    {session.finalRecommendation && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider border ${
                        session.finalRecommendation.status === 'recommended'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                          : session.finalRecommendation.status === 'borderline'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                          : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                      }`}>
                        {session.finalRecommendation.status === 'recommended' ? '✓ Recommended' :
                         session.finalRecommendation.status === 'borderline' ? '▲ Borderline' : '✕ Needs Practice'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {dateStr}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{session.experienceLevel} Level</span>
                    <span>•</span>
                    <span className="capitalize">{session.difficulty}</span>
                    <span>•</span>
                    <span>{lang.flag} {lang.name}</span>
                    <span>•</span>
                    <span>{session.responses.length} / {session.totalQuestions} Questions</span>
                  </div>

                  {session.feedbackSummary && (
                    <p className="text-[11px] text-slate-300 line-clamp-1 italic bg-navy-950/60 p-2 rounded-lg border border-slate-850">
                      "{session.feedbackSummary.overallSummary}"
                    </p>
                  )}
                </div>

                {/* Right: Score Donut & Action Buttons */}
                <div className="flex items-center gap-4 self-end md:self-center">
                  {isCompleted && (
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className={`text-xl font-extrabold font-mono ${
                          score >= 80 ? 'text-emerald-400' : score >= 65 ? 'text-cyan-400' : 'text-amber-400'
                        }`}>
                          {score}%
                        </span>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Score</p>
                      </div>
                      <div className="hidden sm:block">
                        <StatRing score={score} size={44} strokeWidth={4} label="" sublabel="" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pdfExportService.generateInterviewReport(session);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors border border-cyan-800/40"
                        title="Download PDF Assessment Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('results', { sessionId: session.id });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="View Detailed Report"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModalSession(session);
                      }}
                      className="p-2 rounded-xl bg-slate-850 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single Session Delete Confirmation Modal */}
      {deleteModalSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md glass-card rounded-3xl p-6 border border-slate-700 bg-navy-900 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Delete Interview Session</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1 text-slate-300">
              <p><strong>Role:</strong> {deleteModalSession.role}</p>
              <p><strong>Category:</strong> <span className="capitalize">{deleteModalSession.type.replace('_', ' ')}</span></p>
              <p><strong>Date:</strong> {new Date(deleteModalSession.createdAt).toLocaleDateString()}</p>
              {deleteModalSession.overallScore !== undefined && (
                <p><strong>Score:</strong> {deleteModalSession.overallScore}%</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                onClick={() => setDeleteModalSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All History Confirmation Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md glass-card rounded-3xl p-6 border border-rose-500/40 bg-navy-900 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Clear All Interview History?</h3>
                <p className="text-xs text-rose-300">Danger: Irreversible action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete all <strong>{sessions.length} interview records</strong> and their detailed evaluation reports?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllConfirmed}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                Permanently Delete All History
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
