/**
 * AI Interview Pro — Proctor Monitor Panel
 * =========================================
 * Compact, always-visible monitoring dashboard shown during proctored interviews.
 * Displays camera status, microphone status, fullscreen status, violation counts,
 * and active warnings. Uses clear text labels and accessible status indicators.
 */

import React, { useRef, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DeviceStatus, DeviceStatusValue, ViolationCounts, ProctoredSessionState } from '../../types/proctoring';

interface ProctorMonitorPanelProps {
  proctoringState: ProctoredSessionState;
  deviceStatus: DeviceStatus;
  isFullscreen: boolean;
  violations: ViolationCounts;
  activeWarnings: string[];
  currentQuestionNum: number;
  totalQuestions: number;
  timeRemainingSeconds: number;
  cameraStream: MediaStream | null;
  onDismissWarning: (msg: string) => void;
}

function StatusDot({ status }: { status: 'good' | 'warning' | 'error' | 'inactive' }) {
  const colors = {
    good: 'bg-emerald-400',
    warning: 'bg-amber-400 animate-pulse',
    error: 'bg-rose-400 animate-pulse',
    inactive: 'bg-slate-500',
  };
  return <span className={`w-2 h-2 rounded-full ${colors[status]}`} />;
}

function deviceStatusToIndicator(status: DeviceStatusValue): 'good' | 'warning' | 'error' | 'inactive' {
  switch (status) {
    case 'ready': return 'good';
    case 'denied': return 'error';
    case 'disconnected': return 'error';
    case 'unavailable': return 'warning';
    case 'requesting': return 'warning';
    default: return 'inactive';
  }
}

function deviceStatusLabel(status: DeviceStatusValue): string {
  switch (status) {
    case 'ready': return 'Active';
    case 'denied': return 'Denied';
    case 'disconnected': return 'Lost';
    case 'unavailable': return 'N/A';
    case 'requesting': return 'Requesting…';
    case 'unsupported': return 'Unsupported';
    default: return 'Off';
  }
}

export const ProctorMonitorPanel: React.FC<ProctorMonitorPanelProps> = ({
  proctoringState,
  deviceStatus,
  isFullscreen,
  violations,
  activeWarnings,
  currentQuestionNum,
  totalQuestions,
  timeRemainingSeconds,
  cameraStream,
  onDismissWarning,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);

  // Attach camera stream to mini preview
  useEffect(() => {
    if (cameraPreviewRef.current && cameraStream) {
      cameraPreviewRef.current.srcObject = cameraStream;
      cameraPreviewRef.current.play().catch(() => {});
    }
  }, [cameraStream, collapsed]);

  const totalViolations = violations.tabHidden + violations.fullscreenExited +
    violations.cameraDisconnected + violations.micDisconnected;

  const stateLabel: Record<ProctoredSessionState, { text: string; color: string }> = {
    instructions: { text: 'Setup', color: 'text-slate-400' },
    device_check: { text: 'Device Check', color: 'text-cyan-400' },
    ready: { text: 'Ready', color: 'text-cyan-400' },
    in_progress: { text: 'In Progress', color: 'text-emerald-400' },
    paused: { text: 'Paused', color: 'text-amber-400' },
    completed: { text: 'Completed', color: 'text-emerald-400' },
    requires_review: { text: 'Under Review', color: 'text-rose-400' },
    evaluation_pending: { text: 'Evaluating', color: 'text-cyan-400' },
  };

  const stateInfo = stateLabel[proctoringState];

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card rounded-2xl border border-cyan-500/20 overflow-hidden transition-all">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {totalViolations > 0 ? (
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          )}
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
            Proctor Monitor
          </span>
          <span className={`text-[10px] font-bold ${stateInfo.color}`}>
            • {stateInfo.text}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {totalViolations > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/40">
              {totalViolations} event{totalViolations !== 1 ? 's' : ''}
            </span>
          )}
          {collapsed ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronUp className="w-3 h-3 text-slate-400" />}
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 space-y-3">

          {/* Mini Camera Preview */}
          {cameraStream && deviceStatus.camera === 'ready' && (
            <div className="w-full aspect-video max-h-[100px] rounded-xl overflow-hidden border border-slate-700 relative">
              <video
                ref={cameraPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <span className="absolute top-1 right-1 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
          )}

          {/* Status Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Camera */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <StatusDot status={deviceStatusToIndicator(deviceStatus.camera)} />
              {deviceStatus.camera === 'ready' ? <Camera className="w-3 h-3 text-emerald-400" /> : <CameraOff className="w-3 h-3 text-slate-500" />}
              <span className="text-slate-300">Camera: </span>
              <span className="font-bold text-white">{deviceStatusLabel(deviceStatus.camera)}</span>
            </div>

            {/* Microphone */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <StatusDot status={deviceStatusToIndicator(deviceStatus.microphone)} />
              {deviceStatus.microphone === 'ready' ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-slate-500" />}
              <span className="text-slate-300">Mic: </span>
              <span className="font-bold text-white">{deviceStatusLabel(deviceStatus.microphone)}</span>
            </div>

            {/* Fullscreen */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <StatusDot status={isFullscreen ? 'good' : 'inactive'} />
              {isFullscreen ? <Maximize2 className="w-3 h-3 text-emerald-400" /> : <Minimize2 className="w-3 h-3 text-slate-500" />}
              <span className="text-slate-300">Fullscreen: </span>
              <span className="font-bold text-white">{isFullscreen ? 'On' : 'Off'}</span>
            </div>

            {/* Tab Visibility */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <StatusDot status={!document.hidden ? 'good' : 'error'} />
              {!document.hidden ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-rose-400" />}
              <span className="text-slate-300">Tab: </span>
              <span className="font-bold text-white">{!document.hidden ? 'Visible' : 'Hidden'}</span>
            </div>
          </div>

          {/* Violation Counters */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-[10px]">
              <span className="text-slate-400">Tab Switches</span>
              <span className={`font-bold ${violations.tabHidden > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                {violations.tabHidden}
              </span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-[10px]">
              <span className="text-slate-400">Fullscreen Exits</span>
              <span className={`font-bold ${violations.fullscreenExited > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                {violations.fullscreenExited}
              </span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-[10px]">
              <span className="text-slate-400">Camera Issues</span>
              <span className={`font-bold ${violations.cameraDisconnected > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                {violations.cameraDisconnected}
              </span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-[10px]">
              <span className="text-slate-400">Mic Issues</span>
              <span className={`font-bold ${violations.micDisconnected > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                {violations.micDisconnected}
              </span>
            </div>
          </div>

          {/* Active Warnings */}
          {activeWarnings.length > 0 && (
            <div className="space-y-1.5">
              {activeWarnings.map((warning, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-2 px-3 py-2 rounded-xl bg-amber-950/50 border border-amber-700/40 text-amber-200 text-[10px] leading-relaxed animate-fadeIn"
                >
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span>{warning}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDismissWarning(warning)}
                    className="text-amber-400 hover:text-white shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
