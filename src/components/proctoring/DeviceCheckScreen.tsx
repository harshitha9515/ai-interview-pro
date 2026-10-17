/**
 * AI Interview Pro — Device Check Screen
 * =======================================
 * Step 2 of the mandatory proctored interview flow (after rules consent).
 * Verifies:
 *   - Camera permission + active video track
 *   - Microphone permission + active audio track
 *   - Live camera preview and microphone audio monitoring
 *   - Start Interview button enabled ONLY after all checks pass
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
  micStream?: MediaStream | null;
  onRequestCamera: () => Promise<boolean>;
  onRequestMicrophone: () => Promise<boolean>;
  onEnterFullscreen: () => Promise<boolean>;
  onProceed: () => void;
  onBack: () => void;
  cameraRequired: boolean;
}

function DeviceStatusBadge({
  status,
  hasTrack,
  label,
}: {
  status: DeviceStatusValue;
  hasTrack: boolean;
  label: string;
}) {
  const isReadyWithTrack = status === 'ready' && hasTrack;

  if (isReadyWithTrack) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-950/60 text-emerald-300 border-emerald-700/40">
        <CheckCircle className="w-3 h-3 text-emerald-400" />
        {label}: Ready (Track Active)
      </span>
    );
  }

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
      color: 'bg-amber-950/60 text-amber-300 border-amber-700/40',
      icon: <AlertTriangle className="w-3 h-3" />,
      text: 'Awaiting Active Track',
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
      text: 'Unsupported Browser',
    },
  };

  const c = cfg[status] || cfg.not_checked;
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
  micStream,
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
    try {
      await onRequestCamera();
    } finally {
      setRequesting(r => ({ ...r, camera: false }));
    }
  };

  const handleRequestMic = async () => {
    setRequesting(r => ({ ...r, mic: true }));
    try {
      await onRequestMicrophone();
    } finally {
      setRequesting(r => ({ ...r, mic: false }));
    }
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

  // Verify active tracks
  const hasActiveVideoTrack = !!cameraStream && cameraStream.getVideoTracks().some(t => t.readyState === 'live' && t.enabled);
  const hasActiveAudioTrack = (deviceStatus.microphone === 'ready') && (!micStream || micStream.getAudioTracks().some(t => t.readyState === 'live' && t.enabled));

  const cameraWorking = deviceStatus.camera === 'ready' && hasActiveVideoTrack;
  const micWorking = deviceStatus.microphone === 'ready' && hasActiveAudioTrack;
  const canProceed = cameraWorking && micWorking;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-3xl w-full space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-950 to-cyan-950 border border-violet-500/40 mx-auto flex items-center justify-center">
            <Monitor className="w-7 h-7 text-violet-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Hardware Verification & Device Check</h2>
          <p className="text-sm text-slate-400">
            Proctored Placement Mode requires verified camera and microphone access before your interview can begin.
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
                  Click below to prompt browser permission and activate live video and audio streams.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="enable-camera-mic-btn"
              onClick={handleRequestBoth}
              disabled={requesting.camera || requesting.mic}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
            >
              {requesting.camera || requesting.mic ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Enable Camera and Microphone</span>
            </button>
          </div>
        )}

        {/* Device Status Summary Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <DeviceStatusBadge status={deviceStatus.camera} hasTrack={hasActiveVideoTrack} label="Camera" />
          <DeviceStatusBadge status={deviceStatus.microphone} hasTrack={hasActiveAudioTrack} label="Microphone" />
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isFullscreen
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Maximize2 className="w-3 h-3" />
            Fullscreen: {isFullscreen ? 'Active' : 'Optional'}
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
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700/40 font-semibold">
                  Required
                </span>
              </div>
              {cameraWorking && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE PREVIEW
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 p-4">
                  <CameraOff className="w-8 h-8" />
                  <p className="text-xs text-center">
                    {deviceStatus.camera === 'denied'
                      ? 'Camera permission denied.'
                      : deviceStatus.camera === 'requesting'
                      ? 'Requesting camera access…'
                      : deviceStatus.camera === 'unavailable'
                      ? 'No active video stream detected.'
                      : 'Camera not yet enabled.'}
                  </p>
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
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {cameraWorking ? 'Camera Ready (Active Video Track)' : 'Request Camera Permission'}
            </button>

            {deviceStatus.camera === 'denied' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-700/40 text-rose-300 text-xs leading-relaxed">
                <strong>Camera Permission Denied:</strong> Click the permissions icon (padlock/tune) in your browser URL bar, set Camera to <strong>Allow</strong>, and click retry.
              </div>
            )}
          </div>

          {/* Microphone Panel */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {micWorking
                  ? <Mic className="w-4 h-4 text-emerald-400" />
                  : <MicOff className="w-4 h-4 text-slate-500" />}
                <h3 className="text-sm font-bold text-white">Microphone</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700/40 font-semibold">
                  Required
                </span>
              </div>
              {micWorking && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVE AUDIO
                </span>
              )}
            </div>

            <div className={`w-full rounded-xl p-5 border flex flex-col items-center justify-center gap-3 aspect-video ${
              micWorking
                ? 'bg-emerald-950/20 border-emerald-700/40'
                : 'bg-slate-900 border-slate-700'
            }`}>
              {micWorking ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1.5 py-1">
                    {[12, 22, 16, 28, 14, 20, 10].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-emerald-400 rounded-full animate-pulse"
                        style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-emerald-300 font-semibold">Microphone Ready (Audio Track Active)</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500 p-4">
                  <MicOff className="w-8 h-8" />
                  <p className="text-xs text-center">
                    {deviceStatus.microphone === 'denied'
                      ? 'Microphone permission denied.'
                      : deviceStatus.microphone === 'requesting'
                      ? 'Requesting microphone access…'
                      : deviceStatus.microphone === 'unavailable'
                      ? 'No active audio stream detected.'
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
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {micWorking ? 'Microphone Ready (Active Audio Track)' : 'Request Microphone Permission'}
            </button>

            {deviceStatus.microphone === 'denied' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-700/40 text-rose-300 text-xs leading-relaxed">
                <strong>Microphone Permission Denied:</strong> Click the permissions icon (padlock/tune) in your browser URL bar, set Microphone to <strong>Allow</strong>, and click retry.
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
                You can start in fullscreen to minimize distractions. You can exit anytime via Escape or F11.
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
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer"
          >
            ← Back to Rules
          </button>

          <button
            type="button"
            id="start-interview-btn"
            disabled={!canProceed}
            onClick={onProceed}
            className={`w-full sm:flex-1 px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
              canProceed
                ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-600 hover:from-emerald-400 hover:to-violet-500 text-slate-950 shadow-xl shadow-cyan-500/25 font-extrabold cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            {canProceed ? 'Start Interview' : 'Grant Camera & Microphone to Start'}
          </button>
        </div>

        {!canProceed && (
          <div className="text-center text-xs text-amber-300 bg-amber-950/40 p-3 rounded-xl border border-amber-600/30 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Both camera and microphone permissions with active media tracks must be verified before the <strong>Start Interview</strong> button is unlocked.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
