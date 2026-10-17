/**
 * AI Interview Pro — Proctoring Warning Overlay
 * ==============================================
 * Full-screen overlay shown when:
 *   - Interview is paused due to policy threshold
 *   - Interview is flagged for review
 * 
 * Provides a clear message and a resume action.
 * Does NOT automatically label the candidate as a cheater.
 */

import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Play,
  Eye,
} from 'lucide-react';
import { ProctoredSessionState, ViolationCounts } from '../../types/proctoring';

interface ProctoringWarningOverlayProps {
  state: ProctoredSessionState;
  violations: ViolationCounts;
  onResume: () => void;
  /** For 'requires_review' state, a note that session is flagged */
  reviewNote?: string;
}

export const ProctoringWarningOverlay: React.FC<ProctoringWarningOverlayProps> = ({
  state,
  violations,
  onResume,
  reviewNote,
}) => {
  if (state !== 'paused' && state !== 'requires_review') return null;

  const isReview = state === 'requires_review';

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="max-w-lg w-full glass-card rounded-3xl p-8 border border-amber-500/40 text-center space-y-6 animate-in zoom-in-95 fade-in duration-300">
        
        {/* Icon */}
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
          isReview
            ? 'bg-rose-950/80 border-2 border-rose-500/50'
            : 'bg-amber-950/80 border-2 border-amber-500/50'
        }`}>
          {isReview ? (
            <Eye className="w-10 h-10 text-rose-400" />
          ) : (
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className={`text-2xl font-extrabold ${isReview ? 'text-rose-300' : 'text-amber-300'}`}>
            {isReview ? 'Session Flagged for Review' : 'Interview Paused'}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {isReview
              ? 'The configured monitoring threshold has been reached. Your session has been flagged for review. This does not mean automatic disqualification — there may be legitimate reasons for the recorded events.'
              : 'Your interview has been temporarily paused due to a monitoring event. Please return to the interview tab, ensure your camera and microphone are connected, and click Resume below.'}
          </p>
        </div>

        {/* Violation Summary */}
        <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
          {violations.tabHidden > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 text-center">
              <span className="text-amber-400 font-bold">{violations.tabHidden}</span> tab switch{violations.tabHidden !== 1 ? 'es' : ''}
            </div>
          )}
          {violations.fullscreenExited > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 text-center">
              <span className="text-amber-400 font-bold">{violations.fullscreenExited}</span> fullscreen exit{violations.fullscreenExited !== 1 ? 's' : ''}
            </div>
          )}
          {violations.cameraDisconnected > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 text-center">
              <span className="text-rose-400 font-bold">{violations.cameraDisconnected}</span> camera issue{violations.cameraDisconnected !== 1 ? 's' : ''}
            </div>
          )}
          {violations.micDisconnected > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 text-center">
              <span className="text-rose-400 font-bold">{violations.micDisconnected}</span> mic issue{violations.micDisconnected !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Important notice */}
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-400 text-left leading-relaxed max-w-md mx-auto">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-300">Note:</strong> Browser events can be triggered by
            permission dialogs, system notifications, or accidental clicks. A recorded event does not
            automatically indicate misconduct. Your submitted answers and scores remain unaffected by monitoring events.
          </span>
        </div>

        {reviewNote && (
          <p className="text-xs text-slate-500 italic max-w-md mx-auto">
            {reviewNote}
          </p>
        )}

        {/* Resume Button */}
        <button
          type="button"
          onClick={onResume}
          className="px-8 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2.5 mx-auto transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isReview ? 'Acknowledge & Continue Interview' : 'Resume Interview'}</span>
        </button>

        <p className="text-[10px] text-slate-500">
          Your interview timer is paused. Your already-submitted answers are preserved.
        </p>
      </div>
    </div>
  );
};
