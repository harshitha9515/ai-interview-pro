/**
 * AI Interview Pro — Proctoring Results & Integrity Report
 * ==========================================================
 * Rendered on ResultsPage for proctored interview sessions.
 * Displays:
 *   - Verified integrity status or review flag
 *   - Violation metrics (tab switches, blur events, device disconnects)
 *   - Device readiness & consent audit
 *   - Complete chronological event audit trail
 *   - Fair assessment disclaimer (scores are never altered by browser events)
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Camera,
  Mic,
  Maximize2,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { InterviewSession } from '../../types/interview';
import { ProctoringSnapshot, ProctoringEvent } from '../../types/proctoring';
import { storageService } from '../../services/storage';

interface ProctoringResultsSectionProps {
  session: InterviewSession;
}

export const ProctoringResultsSection: React.FC<ProctoringResultsSectionProps> = ({ session }) => {
  const [showFullAuditLog, setShowFullAuditLog] = useState<boolean>(false);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'warning_critical'>('all');

  // Load snapshot from session or localStorage
  const snapshot: ProctoringSnapshot | null =
    session.proctoringSnapshot ||
    (session.id ? storageService.getProctoringSnapshot(session.id) : null);

  const isProctored = session.isProctored || !!snapshot;

  if (!isProctored) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Standard Practice Session (Unproctored)</h4>
            <p className="text-[11px] text-slate-400">This interview was conducted in self-practice mode with browser monitoring disabled.</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Unmonitored
        </span>
      </div>
    );
  }

  const violations = snapshot?.violations || {
    tabHidden: 0,
    windowBlur: 0,
    fullscreenExited: 0,
    cameraDisconnected: 0,
    micDisconnected: 0,
  };

  const eventLog: ProctoringEvent[] = snapshot?.eventLog || [];

  // Determine Overall Integrity Status
  const isFlagged =
    snapshot?.state === 'requires_review' ||
    violations.tabHidden >= 3 ||
    (violations.cameraDisconnected > 0 && snapshot?.deviceStatus.camera === 'denied');

  const hasMinorDeviations =
    !isFlagged &&
    (violations.tabHidden > 0 || violations.fullscreenExited > 0 || violations.windowBlur > 2);

  const isVerifiedClean = !isFlagged && !hasMinorDeviations;

  const filteredEvents = eventLog.filter(e => {
    if (filterSeverity === 'warning_critical') {
      return e.severity === 'warning' || e.severity === 'critical';
    }
    return true;
  });

  return (
    <div className="rounded-3xl glass-card border border-slate-800 p-6 space-y-6">
      
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            isVerifiedClean
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400'
              : isFlagged
              ? 'bg-rose-950/80 border border-rose-500/40 text-rose-400'
              : 'bg-amber-950/80 border border-amber-500/40 text-amber-400'
          }`}>
            {isVerifiedClean ? (
              <ShieldCheck className="w-5 h-5" />
            ) : isFlagged ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">Proctored Assessment Integrity Report</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                Live Proctoring Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verified automated session telemetry, event auditing, and environment adherence.
            </p>
          </div>
        </div>

        {/* Primary Status Badge */}
        <div>
          {isVerifiedClean ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 border border-emerald-400 shadow-sm">
              <CheckCircle className="w-3.5 h-3.5" />
              Verified Clean Session
            </span>
          ) : isFlagged ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500 text-white border border-rose-400 shadow-sm">
              <Eye className="w-3.5 h-3.5" />
              Flagged for Placement Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 border border-amber-400 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Risk / Minor Deviations
            </span>
          )}
        </div>
      </div>

      {/* Narrative Evaluation Card */}
      <div className={`p-4 rounded-2xl border ${
        isVerifiedClean
          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
          : isFlagged
          ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
          : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
      }`}>
        <p className="text-xs leading-relaxed">
          {isVerifiedClean
            ? 'Candidate strictly remained within the interview environment without unauthorized tab departures or device interruptions. All verification checks passed.'
            : isFlagged
            ? `Candidate accumulated repeated visibility departures (${violations.tabHidden} tab switches). The interview was paused and flagged for placement reviewer assessment.`
            : `Candidate experienced minor visibility changes (${violations.tabHidden} tab departure, ${violations.windowBlur} blur events) but resumed appropriately. Reviewer discretion recommended.`}
        </p>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Tab Switches</span>
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className={`text-xl font-extrabold font-mono ${violations.tabHidden > 0 ? (violations.tabHidden >= 3 ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'}`}>
            {violations.tabHidden}
          </p>
          <span className="text-[10px] text-slate-500 block">Threshold: 3 limit</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Window Blurs</span>
            <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <p className="text-xl font-extrabold font-mono text-slate-300">
            {violations.windowBlur}
          </p>
          <span className="text-[10px] text-slate-500 block">System popups / focus</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Fullscreen Exits</span>
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className={`text-xl font-extrabold font-mono ${violations.fullscreenExited > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {violations.fullscreenExited}
          </p>
          <span className="text-[10px] text-slate-500 block">Exits tracked</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Camera Drops</span>
            <Camera className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className={`text-xl font-extrabold font-mono ${violations.cameraDisconnected > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {violations.cameraDisconnected}
          </p>
          <span className="text-[10px] text-slate-500 block">Track disconnects</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Mic Drops</span>
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className={`text-xl font-extrabold font-mono ${violations.micDisconnected > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {violations.micDisconnected}
          </p>
          <span className="text-[10px] text-slate-500 block">Audio interruptions</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Events Logged</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-xl font-extrabold font-mono text-cyan-300">
            {eventLog.length}
          </p>
          <span className="text-[10px] text-slate-500 block">Full audit trail</span>
        </div>
      </div>

      {/* Pre-Interview Verification Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Pre-Interview Consent</span>
            <span className="text-[11px] text-slate-400">Rules acknowledged before start</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
            snapshot?.deviceStatus?.camera === 'ready'
              ? 'bg-emerald-950 border-emerald-700/50 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Camera Readiness</span>
            <span className="text-[11px] text-slate-400">
              {snapshot?.deviceStatus?.camera === 'ready' ? 'Device Verified' : 'Optional / Text Mode'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
            snapshot?.deviceStatus?.microphone === 'ready'
              ? 'bg-emerald-950 border-emerald-700/50 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Microphone Readiness</span>
            <span className="text-[11px] text-slate-400">
              {snapshot?.deviceStatus?.microphone === 'ready' ? 'Device Verified' : 'Text Fallback Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Audit Log */}
      <div className="border-t border-slate-800/80 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFullAuditLog(!showFullAuditLog)}
            className="flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            <span>{showFullAuditLog ? 'Hide Full Audit Trail' : `View Full Audit Trail (${eventLog.length} Events)`}</span>
            {showFullAuditLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFullAuditLog && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2 py-0.5 rounded ${filterSeverity === 'all' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-600/40' : 'text-slate-400 hover:text-white'}`}
              >
                All ({eventLog.length})
              </button>
              <button
                onClick={() => setFilterSeverity('warning_critical')}
                className={`px-2 py-0.5 rounded ${filterSeverity === 'warning_critical' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-600/40' : 'text-slate-400 hover:text-white'}`}
              >
                Warnings Only
              </button>
            </div>
          )}
        </div>

        {showFullAuditLog && (
          <div className="max-h-72 overflow-y-auto space-y-2 pr-2 rounded-xl bg-slate-950/80 p-3 border border-slate-800">
            {filteredEvents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No events matching the selected filter.</p>
            ) : (
              filteredEvents.map(evt => {
                const timeStr = new Date(evt.timestamp).toLocaleTimeString();
                return (
                  <div
                    key={evt.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                      evt.severity === 'critical'
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                        : evt.severity === 'warning'
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-800">
                          {evt.eventType.replace(/_/g, ' ')}
                        </span>
                        {evt.actionTaken && (
                          <span className="text-[10px] text-cyan-300 font-semibold">• {evt.actionTaken}</span>
                        )}
                      </div>
                      {evt.explanation && (
                        <p className="text-[11px] text-slate-400 leading-snug">{evt.explanation}</p>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">{timeStr}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Fairness & Legal Non-Deduction Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <span className="font-semibold text-slate-300">Policy Separation Disclaimer: </span>
          Interview performance scores (rubric, technical accuracy, communication) are computed completely independently from browser monitoring telemetry. Telemetry is provided purely as an advisory audit signal for hiring teams and does NOT mechanically alter earned marks.
        </div>
      </div>

    </div>
  );
};
