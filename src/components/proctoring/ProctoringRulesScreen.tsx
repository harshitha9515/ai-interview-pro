/**
 * AI Interview Pro — Proctoring Rules & Consent Screen
 * =====================================================
 * Displayed before the interview begins in Proctored Mode.
 * Candidate must:
 *   1. Read all rules
 *   2. Explicitly acknowledge the monitoring policy
 *   3. Click "I Understand and Agree" to proceed to device check
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  Mic,
  Camera,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';

interface ProctoringRulesScreenProps {
  candidateName: string;
  onConsent: () => void;
  onDecline: () => void;
}

const INTERVIEW_RULES = [
  { id: 1, text: 'Remain on the interview page throughout the interview.' },
  { id: 2, text: 'Do not switch browser tabs or windows during the interview.' },
  { id: 3, text: 'Do not minimize the browser window.' },
  { id: 4, text: 'Keep your camera enabled and your face visible, if camera access is granted.' },
  { id: 5, text: 'Keep your microphone enabled when providing spoken answers.' },
  { id: 6, text: 'Do not disable camera or microphone permissions mid-interview.' },
  { id: 7, text: 'Answer questions independently and honestly. Do not use another person to answer.' },
  { id: 8, text: 'Do not use unauthorized external help, AI assistants, or answer-sharing tools.' },
  { id: 9, text: 'Do not copy or distribute confidential interview questions.' },
  { id: 10, text: 'Do not refresh or close the page before finishing unless instructed.' },
  { id: 11, text: 'Follow the configured interview time limits.' },
  { id: 12, text: 'Keep your internet connection stable throughout the session.' },
  { id: 13, text: 'Use a quiet, well-lit environment.' },
  { id: 14, text: 'Follow the selected interview language.' },
  { id: 15, text: 'Do not attempt to manipulate the interview timer, scores, or browser monitoring.' },
  {
    id: 16,
    text: 'Understand that some browser-level monitoring restrictions cannot be enforced perfectly by a website.',
  },
  {
    id: 17,
    text: 'Understand that warnings are recorded; repeated confirmed violations may flag your session for review.',
  },
];

const MONITORING_DISCLOSURES = [
  {
    icon: <Eye className="w-4 h-4 text-cyan-400" />,
    title: 'Tab-Switch Detection',
    detail:
      'The application uses the browser Page Visibility API and window blur events to detect when you leave the interview tab. Each departure is recorded with a timestamp and may trigger a warning.',
  },
  {
    icon: <Camera className="w-4 h-4 text-violet-400" />,
    title: 'Camera Status Monitoring',
    detail:
      'If you grant camera permission, a live preview is shown. The application detects when the camera stream is disconnected. No video is recorded, uploaded, or stored.',
  },
  {
    icon: <Mic className="w-4 h-4 text-emerald-400" />,
    title: 'Microphone Status Monitoring',
    detail:
      'Microphone access is used for spoken answers only. The application detects disconnection but does not record or store raw audio. Text input is always available as an alternative.',
  },
  {
    icon: <Monitor className="w-4 h-4 text-amber-400" />,
    title: 'Fullscreen Mode',
    detail:
      'You will be offered a Fullscreen option. If you exit fullscreen, the event is recorded as a note. Fullscreen cannot prevent you from switching apps; it is an indicator, not a lock.',
  },
  {
    icon: <Lock className="w-4 h-4 text-rose-400" />,
    title: 'Event Log',
    detail:
      'A structured event log is maintained for the session (timestamps, event types, warning counts). This log is stored only in your browser session. No personal video, audio recordings, or screenshots are taken.',
  },
];

export const ProctoringRulesScreen: React.FC<ProctoringRulesScreenProps> = ({
  candidateName,
  onConsent,
  onDecline,
}) => {
  const [rulesExpanded, setRulesExpanded] = useState(true);
  const [monitoringExpanded, setMonitoringExpanded] = useState(false);
  const [checkedAcknowledgments, setCheckedAcknowledgments] = useState<Record<string, boolean>>({});

  const acknowledgments = [
    { id: 'read_rules', text: 'I have read all the interview rules listed above.' },
    { id: 'understand_monitoring', text: 'I understand what browser activity is monitored and why.' },
    { id: 'no_recording', text: 'I acknowledge that no video or audio is recorded or stored by this application.' },
    { id: 'independent_work', text: 'I confirm that I will answer all questions independently and honestly.' },
    {
      id: 'browser_limitations',
      text: 'I understand that browser monitoring has limitations and some events may be false positives.',
    },
  ];

  const allChecked = acknowledgments.every(a => checkedAcknowledgments[a.id]);

  const toggleAck = (id: string) => {
    setCheckedAcknowledgments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-3xl w-full space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-950 to-violet-950 border border-cyan-500/40 mx-auto flex items-center justify-center shadow-xl shadow-cyan-900/30">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Interview Instructions & Rules</h1>
          <p className="text-sm text-slate-400">
            Hello <span className="text-cyan-300 font-bold">{candidateName || 'Candidate'}</span>. Please read
            the rules carefully and acknowledge the monitoring policy before proceeding.
          </p>
        </div>

        {/* Proctored Mode Notice */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-violet-950/50 border border-violet-500/40 text-violet-200 text-xs leading-relaxed">
          <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-violet-300">Proctored Mode is active.</strong> This interview monitors
            tab-switching, window focus, camera status, and microphone status using browser APIs. No video or
            audio is recorded or uploaded. Monitoring events are logged locally for this session only.
          </span>
        </div>

        {/* Interview Rules (collapsible) */}
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setRulesExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">Interview Rules ({INTERVIEW_RULES.length})</span>
            </div>
            {rulesExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {rulesExpanded && (
            <div className="px-5 pb-5 space-y-2">
              {INTERVIEW_RULES.map(rule => (
                <div key={rule.id} className="flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-bold text-[10px] flex items-center justify-center mt-0.5">
                    {rule.id}
                  </span>
                  <span>{rule.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monitoring Disclosures (collapsible) */}
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setMonitoringExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-bold text-white">What Is Monitored & Why</span>
            </div>
            {monitoringExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {monitoringExpanded && (
            <div className="px-5 pb-5 space-y-4">
              {MONITORING_DISCLOSURES.map((disc, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="shrink-0 mt-0.5">{disc.icon}</div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">{disc.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{disc.detail}</p>
                  </div>
                </div>
              ))}

              {/* Limitations Notice */}
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-950/40 border border-amber-700/40 text-amber-200 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300 mb-1">Important Browser Limitations</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-200/80">
                    <li>Browsers cannot detect all external applications or second devices.</li>
                    <li>Window blur events may fire for system notifications or OS prompts — these are supplementary signals only.</li>
                    <li>Fullscreen mode cannot prevent tab switching at the OS level.</li>
                    <li>A monitoring event does not automatically prove misconduct.</li>
                    <li>No facial recognition or identity verification is performed.</li>
                  </ul>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 leading-relaxed">
                <strong className="text-slate-400">Data Retention:</strong> The session event log exists only
                in your browser's memory for the duration of this tab session. No data is transmitted to
                external servers. No screenshots, video recordings, or audio recordings are made. Refreshing
                the page clears the event log.
              </div>
            </div>
          )}
        </div>

        {/* Acknowledgment Checkboxes */}
        <div className="glass-card rounded-2xl border border-slate-800 p-5 space-y-3">
          <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">
            Required Acknowledgments
          </p>
          {acknowledgments.map(ack => (
            <label
              key={ack.id}
              className="flex items-start gap-3 cursor-pointer group"
              onClick={() => toggleAck(ack.id)}
            >
              <div
                className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                  checkedAcknowledgments[ack.id]
                    ? 'bg-cyan-500 border-cyan-400'
                    : 'bg-slate-900 border-slate-600 group-hover:border-cyan-500/50'
                }`}
              >
                {checkedAcknowledgments[ack.id] && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10.28 2.28L4 8.56 1.72 6.28a1 1 0 00-1.44 1.44l3 3a1 1 0 001.44 0l7-7a1 1 0 00-1.44-1.44z" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                {ack.text}
              </span>
            </label>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onDecline}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all"
          >
            Cancel — Return to Setup
          </button>

          <button
            type="button"
            disabled={!allChecked}
            onClick={onConsent}
            className={`w-full sm:flex-1 px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
              allChecked
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-xl shadow-cyan-500/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>I Understand and Agree — Proceed to Device Check</span>
          </button>
        </div>

        {!allChecked && (
          <p className="text-center text-[11px] text-amber-400">
            Please check all acknowledgment boxes above to proceed.
          </p>
        )}
      </div>
    </div>
  );
};
