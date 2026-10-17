/**
 * AI Interview Pro — Device Check Screen
 * =======================================
 * Step 2 of the proctored interview flow (after consent).
 * Tests:
 *   - Camera permission + live preview
 *   - Microphone permission
 *   - Fullscreen readiness (optional)
 * 
 * The candidate can:
 *   - Grant camera and microphone permissions
 *   - See live camera preview and verify positioning
 *   - Enter fullscreen if desired
 *   - Proceed to interview with or without camera (configurable)
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Maximize2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  XCircle,
  RefreshCw,
  ChevronRight,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { DeviceStatus, DeviceStatusValue } from '../../types/proctoring';

interface DeviceCheckScreenProps {
  deviceStatus: DeviceStatus;
  isFullscreen: boolean;
  cameraStream: MediaStream | null;
  onRequestCamera: () => Promise<boolean>;
  onRequestMicrophone: () => Promise<boolean>;
  onEnterFullscreen: () => Promise<boolean>;
  onProceed: () => void;
  onBack: () => void;
  /** If false, camera is optional and user can proceed without it */
  cameraRequired: boolean;
}

function DeviceStatusBadge({
  status,
  label,
}: {
  status: DeviceStatusValue;
  label: string;
}) {
  const cfg: Record<DeviceStatusValue, { color: string; icon: React.ReactNode; text: string }> = {
    not_checked: {
      color: 'bg-slate-800 text-slate-400 border-slate-700',
      icon: <div className="w-2 h-2 rounded-full bg-slate-500" />,
      text: 'Not Checked',
    },
    requesting: {
      color: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/40',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      text: 'Requesting…',
    },
    ready: {
      color: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40',
      icon: <CheckCircle className="w-3 h-3" />,
      text: 'Ready',
    },
    denied: {
      color: 'bg-rose-950/60 text-rose-300 border-rose-700/40',
      icon: <XCircle className="w-3 h-3" />,
      text: 'Permission Denied',
    },
    unavailable: {
      color: 'bg-amber-950/60 text-amber-300 border-amber-700/40',
      icon: <AlertTriangle className="w-3 h-3" />,
      text: 'Not Available',
    },
    disconnected: {
      color: 'bg-rose-950/60 text-rose-300 border-rose-700/40',
      icon: <AlertTriangle className="w-3 h-3" />,
      text: 'Disconnected',
    },
    unsupported: {
      color: 'bg-slate-800 text-slate-500 border-slate-700',
      icon: <XCircle className="w-3 h-3" />,
      text: 'Unsupported',
    },
  };

  const c = cfg[status];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${c.color}`}>
      {c.icon}
      {label}: {c.text}
    </span>
  );
}

export const DeviceCheckScreen: React.FC<DeviceCheckScreenProps> = ({
  deviceStatus,
  isFullscreen,
  cameraStream,
  onRequestCamera,
  onRequestMicrophone,
  onEnterFullscreen,
  onProceed,
  onBack,
  cameraRequired,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fullscreenSupported] = useState<boolean>(!!document.documentElement.requestFullscreen);
  const [requesting, setRequesting] = useState<{ camera: boolean; mic: boolean }>({
    camera: false,
    mic: false,
  });

  // Attach camera stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraStream]);

  const handleRequestCamera = async () => {
    setRequesting(r => ({ ...r, camera: true }));
    await onRequestCamera();
    setRequesting(r => ({ ...r, camera: false }));
  };

  const handleRequestMic = async () => {
    setRequesting(r => ({ ...r, mic: true }));
    await onRequestMicrophone();
    setRequesting(r => ({ ...r, mic: false }));
  };

  const handleRequestBoth = async () => {
    setRequesting({ camera: true, mic: true });
    try {
      await onRequestCamera();
    } catch {}
    try {
      await onRequestMicrophone();
    } catch {}
    setRequesting({ camera: false, mic: false });
  };

  const cameraWorking = deviceStatus.camera === 'ready';
  const micWorking = deviceStatus.microphone === 'ready';
  // Both camera AND microphone must be accepted before starting
  const canProceed = cameraWorking && micWorking;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-3xl w-full space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-950 to-cyan-950 border border-violet-500/40 mx-auto flex items-center justify-center">
            <Monitor className="w-7 h-7 text-violet-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Device Check</h2>
          <p className="text-sm text-slate-400">
            Accept camera and microphone permissions to start your interview and enable AI voice interaction.
          </p>
        </div>

        {/* Quick Grant Banner if either device is not ready */}
        {(!cameraWorking || !micWorking) && (
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-900/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white">Camera & Microphone Access Required</h4>
                <p className="text-[11px] text-slate-300">
                  The interview and interviewer speaking will start only after you accept both camera and microphone permissions.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRequestBoth}
              disabled={requesting.camera || requesting.mic}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
            >
              {requesting.camera || requesting.mic ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Allow Camera & Microphone</span>
            </button>
          </div>
        )}

        {/* Device Status Summary */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <DeviceStatusBadge status={deviceStatus.camera} label="Camera" />
          <DeviceStatusBadge status={deviceStatus.microphone} label="Microphone" />
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isFullscreen
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Maximize2 className="w-3 h-3" />
            Fullscreen: {isFullscreen ? 'Active' : 'Not Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Camera Panel */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {cameraWorking
                  ? <Camera className="w-4 h-4 text-emerald-400" />
                  : <CameraOff className="w-4 h-4 text-slate-500" />}
                <h3 className="text-sm font-bold text-white">Camera</h3>
                {!cameraRequired && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Optional
                  </span>
                )}
                {cameraRequired && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700/40">
                    Required
                  </span>
                )}
              </div>
              {cameraWorking && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>

            {/* Live Camera Preview */}
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-700 relative">
              {cameraWorking ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <CameraOff className="w-8 h-8" />
                  <p className="text-xs text-center">
                    {deviceStatus.camera === 'denied'
                      ? 'Camera permission denied.\nCheck your browser settings.'
                      : deviceStatus.camera === 'requesting'
                      ? 'Requesting camera access…'
                      : deviceStatus.camera === 'unavailable'
                      ? 'No camera device found.'
                      : deviceStatus.camera === 'unsupported'
                      ? 'Camera not supported in this browser.'
                      : 'Camera not yet enabled.'}
                  </p>
                </div>
              )}
              {cameraWorking && (
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <span className="text-[10px] px-2 py-1 rounded bg-black/70 text-cyan-300">
                    Position your face in the frame and ensure you're well-lit.
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleRequestCamera}
              disabled={requesting.camera || deviceStatus.camera === 'requesting'}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                cameraWorking
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-900/50'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
              }`}
            >
              {requesting.camera || deviceStatus.camera === 'requesting' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : cameraWorking ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {cameraWorking ? 'Camera Ready — Click to Re-test' : 'Enable Camera'}
            </button>

            {deviceStatus.camera === 'denied' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-700/40 text-rose-300 text-xs leading-relaxed">
                <strong>Permission Denied:</strong> Open your browser settings → Site Permissions →
                Camera and allow access for this site, then refresh.
              </div>
            )}
          </div>

          {/* Microphone Panel */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              {micWorking
                ? <Mic className="w-4 h-4 text-emerald-400" />
                : <MicOff className="w-4 h-4 text-slate-500" />}
              <h3 className="text-sm font-bold text-white">Microphone</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Text input always available
              </span>
            </div>

            <div className={`w-full rounded-xl p-5 border flex flex-col items-center justify-center gap-3 min-h-[140px] ${
              micWorking
                ? 'bg-emerald-950/20 border-emerald-700/40'
                : 'bg-slate-900 border-slate-700'
            }`}>
              {micWorking ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-emerald-400 rounded-full animate-pulse"
                        style={{ height: `${8 + Math.random() * 16}px`, animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-emerald-300 font-semibold">Microphone Ready</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <MicOff className="w-8 h-8" />
                  <p className="text-xs text-center">
                    {deviceStatus.microphone === 'denied'
                      ? 'Microphone permission denied.'
                      : deviceStatus.microphone === 'requesting'
                      ? 'Requesting microphone access…'
                      : deviceStatus.microphone === 'unavailable'
                      ? 'No microphone device found.'
                      : 'Microphone not yet enabled.'}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleRequestMic}
              disabled={requesting.mic || deviceStatus.microphone === 'requesting'}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                micWorking
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-900/50'
                  : 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/50'
              }`}
            >
              {requesting.mic || deviceStatus.microphone === 'requesting' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : micWorking ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {micWorking ? 'Microphone Ready — Click to Re-test' : 'Test Microphone'}
            </button>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Note:</strong> If microphone access is denied or
              unavailable, you can still complete the interview by typing your answers. Text input is
              always available.
            </div>

            {deviceStatus.microphone === 'denied' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-700/40 text-rose-300 text-xs leading-relaxed">
                <strong>Permission Denied:</strong> Open your browser settings → Site Permissions →
                Microphone and allow access, then refresh.
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Option */}
        {fullscreenSupported && (
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">Fullscreen Mode</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Optional
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Start the interview in fullscreen to minimise distractions. Exiting fullscreen will
                be logged but will not block the interview. You can exit fullscreen at any time using
                Escape or F11.
              </p>
            </div>
            <button
              type="button"
              onClick={onEnterFullscreen}
              disabled={isFullscreen}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isFullscreen
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40'
                  : 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-700/40'
              }`}
            >
              {isFullscreen ? <CheckCircle className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isFullscreen ? 'Fullscreen Active' : 'Enter Fullscreen'}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all"
          >
            ← Back to Rules
          </button>

          <button
            type="button"
            disabled={!canProceed}
            onClick={onProceed}
            className={`w-full sm:flex-1 px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
              canProceed
                ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-600 hover:from-emerald-400 hover:to-violet-500 text-slate-950 shadow-xl shadow-cyan-500/25 font-extrabold cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            {canProceed ? 'Start Proctored Interview & Begin Speaking' : 'Grant Camera & Microphone to Start'}
          </button>
        </div>

        {!canProceed && (
          <p className="text-center text-xs text-amber-300 bg-amber-950/40 p-3 rounded-xl border border-amber-600/30">
            ⚠️ The interview will start and the interviewer will begin speaking only after you accept both camera and microphone permissions.
          </p>
        )}
      </div>
    </div>
  );
};
