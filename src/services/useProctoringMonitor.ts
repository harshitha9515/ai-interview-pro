/**
 * AI Interview Pro — Proctoring Monitor Hook
 * ===========================================
 * Core proctoring logic as a React hook. Handles:
 *   - Page visibility and tab-switch detection
 *   - Window blur / focus detection
 *   - Fullscreen entry/exit via Fullscreen API
 *   - Camera track monitoring (MediaStreamTrack ended)
 *   - Microphone track monitoring
 *   - Structured event log per session
 *   - Violation counting with configurable thresholds
 *
 * BROWSER LIMITATIONS (documented, not hidden):
 *   - Browsers cannot reliably detect every external app the user opens.
 *   - blur events fire for permission dialogs, system notifications, and other OS activity.
 *   - Page Visibility API is the primary signal; blur/focus are supplementary.
 *   - We cannot prevent tab switching; we observe and record.
 *   - We cannot detect second-device usage.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ProctoringConfig,
  ProctoringEvent,
  ProctoringEventType,
  ProctoredSessionState,
  ViolationCounts,
  DeviceStatus,
  DeviceStatusValue,
  ProctoringSnapshot,
} from '../types/proctoring';

interface UseProctoringMonitorResult {
  /** Current proctoring state */
  proctoringState: ProctoredSessionState;
  setProctoringState: (state: ProctoredSessionState) => void;
  /** Device status (camera, microphone) */
  deviceStatus: DeviceStatus;
  /** Whether fullscreen is currently active */
  isFullscreen: boolean;
  /** Number of distinct violations per category */
  violations: ViolationCounts;
  /** Full ordered event log for this session */
  eventLog: ProctoringEvent[];
  /** Active human-readable warnings to show the candidate */
  activeWarnings: string[];
  /** Whether consent has been acknowledged */
  consentGiven: boolean;
  setConsentGiven: (v: boolean) => void;
  /** Live camera MediaStream, if available (for preview) */
  cameraStream: MediaStream | null;
  /** Live microphone MediaStream, if available */
  micStream: MediaStream | null;
  /** Request camera permission and start stream */
  requestCamera: () => Promise<boolean>;
  /** Request microphone permission */
  requestMicrophone: () => Promise<boolean>;
  /** Request fullscreen mode */
  enterFullscreen: () => Promise<boolean>;
  /** Exit fullscreen (user-initiated) */
  exitFullscreen: () => void;
  /** Dismiss a specific warning */
  dismissWarning: (msg: string) => void;
  /** Clear all warnings (used after interview resumes) */
  clearWarnings: () => void;
  /** Pause the proctored session via policy */
  pauseFromPolicy: (reason: string) => void;
  /** Resume from a policy-pause */
  resumeFromPause: () => void;
  /** Mark interview as completed and clean up */
  completeInterview: () => void;
  /** Get a serializable snapshot of proctoring data */
  getSnapshot: () => ProctoringSnapshot;
  /** Stop all media tracks (call on unmount / session end) */
  stopAllTracks: () => void;
}

function makeEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function useProctoringMonitor(
  config: ProctoringConfig
): UseProctoringMonitorResult {
  const { sessionId, enabled, policy } = config;

  const [proctoringState, setProctoringState] = useState<ProctoredSessionState>('instructions');
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: 'not_checked',
    microphone: 'not_checked',
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [violations, setViolations] = useState<ViolationCounts>({
    tabHidden: 0,
    windowBlur: 0,
    fullscreenExited: 0,
    cameraDisconnected: 0,
    micDisconnected: 0,
  });
  const [eventLog, setEventLog] = useState<ProctoringEvent[]>([]);
  const [activeWarnings, setActiveWarnings] = useState<string[]>([]);
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // Refs for tracking to avoid duplicate events
  const isPageHiddenRef = useRef(false);
  const isWindowBlurredRef = useRef(false);
  const pauseTimestampsRef = useRef<string[]>([]);
  const resumeTimestampsRef = useRef<string[]>([]);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const isInterviewActiveRef = useRef(false);

  // ─── Log an event ──────────────────────────────────────────────────────────
  const logEvent = useCallback(
    (
      eventType: ProctoringEventType,
      opts?: {
        actionTaken?: string;
        explanation?: string;
        countOverride?: number;
        severity?: 'info' | 'warning' | 'critical';
      }
    ) => {
      setEventLog(prev => {
        const countOfType = prev.filter(e => e.eventType === eventType).length + 1;
        const evt: ProctoringEvent = {
          id: makeEventId(),
          sessionId,
          eventType,
          timestamp: new Date().toISOString(),
          severity: opts?.severity ?? 'info',
          count: opts?.countOverride ?? countOfType,
          actionTaken: opts?.actionTaken,
          explanation: opts?.explanation,
        };
        return [...prev, evt];
      });
    },
    [sessionId]
  );

  // ─── Add a warning ─────────────────────────────────────────────────────────
  const addWarning = useCallback((msg: string) => {
    setActiveWarnings(prev => {
      if (prev.includes(msg)) return prev; // Deduplicate
      return [...prev, msg];
    });
  }, []);

  const dismissWarning = useCallback((msg: string) => {
    setActiveWarnings(prev => prev.filter(w => w !== msg));
  }, []);

  const clearWarnings = useCallback(() => {
    setActiveWarnings([]);
  }, []);

  // ─── Tab / Page Visibility Handler ────────────────────────────────────────
  const handleVisibilityChange = useCallback(() => {
    if (!enabled || !isInterviewActiveRef.current) return;

    if (document.hidden) {
      if (isPageHiddenRef.current) return; // Already hidden — avoid double-counting
      isPageHiddenRef.current = true;

      setViolations(prev => {
        const newCount = prev.tabHidden + 1;
        const msg1 = `Warning ${newCount}: You left the interview page. Please remain on this page until the interview is complete.`;
        const msg2 = `Warning ${newCount}: Another tab-switch event was detected. Further violations may flag the interview for review.`;
        const msgCritical = `Your interview has been flagged for review because the monitoring threshold was reached. Please follow on-screen instructions.`;

        logEvent('tab_hidden', {
          severity: newCount >= policy.tabHiddenPauseThreshold ? 'critical' : 'warning',
          actionTaken:
            newCount >= policy.tabHiddenPauseThreshold
              ? 'Interview flagged for review'
              : `Warning ${newCount} shown`,
          explanation: `Page visibility became hidden (tab switch or window minimise).`,
        });
        logEvent('warning_shown', {
          severity: 'warning',
          explanation: newCount >= policy.tabHiddenPauseThreshold ? msgCritical : newCount >= policy.tabHiddenWarning2Threshold ? msg2 : msg1,
        });

        if (newCount >= policy.tabHiddenPauseThreshold) {
          addWarning(msgCritical);
          if (policy.onThresholdReached === 'review') {
            setProctoringState('requires_review');
          } else {
            setProctoringState('paused');
          }
        } else if (newCount >= policy.tabHiddenWarning2Threshold) {
          addWarning(msg2);
        } else if (newCount >= policy.tabHiddenWarning1Threshold) {
          addWarning(msg1);
        }

        return { ...prev, tabHidden: newCount };
      });
    } else {
      if (!isPageHiddenRef.current) return;
      isPageHiddenRef.current = false;
      logEvent('tab_visible', { severity: 'info', explanation: 'Candidate returned to interview page.' });
    }
  }, [enabled, policy, logEvent, addWarning]);

  // ─── Window Blur/Focus (supplementary signal) ─────────────────────────────
  const handleWindowBlur = useCallback(() => {
    if (!enabled || !isInterviewActiveRef.current) return;
    if (isWindowBlurredRef.current) return;
    isWindowBlurredRef.current = true;
    // We log blur but do NOT increment tabHidden — only visibilityChange does that.
    // blur can fire for permission dialogs, system popups, etc.
    logEvent('window_blur', {
      severity: 'info',
      explanation: 'Browser window lost focus. This may be caused by permission dialogs or OS prompts.',
    });
    setViolations(prev => ({ ...prev, windowBlur: prev.windowBlur + 1 }));
  }, [enabled, logEvent]);

  const handleWindowFocus = useCallback(() => {
    if (!enabled) return;
    if (!isWindowBlurredRef.current) return;
    isWindowBlurredRef.current = false;
    logEvent('window_focus', { severity: 'info', explanation: 'Browser window regained focus.' });
  }, [enabled, logEvent]);

  // ─── Fullscreen change ────────────────────────────────────────────────────
  const handleFullscreenChange = useCallback(() => {
    const fsEl = document.fullscreenElement;
    if (fsEl) {
      setIsFullscreen(true);
      logEvent('fullscreen_entered', { severity: 'info' });
    } else {
      setIsFullscreen(false);
      if (enabled && isInterviewActiveRef.current) {
        setViolations(prev => ({ ...prev, fullscreenExited: prev.fullscreenExited + 1 }));
        logEvent('fullscreen_exited', {
          severity: 'warning',
          explanation: 'Candidate exited fullscreen mode.',
        });
        if (policy.fullscreenExitWarning) {
          addWarning('You exited fullscreen mode. For best results, please keep the interview in fullscreen.');
        }
        if (policy.fullscreenExitPauses) {
          setProctoringState('paused');
          logEvent('interview_paused', { severity: 'warning', actionTaken: 'Paused due to fullscreen exit' });
        }
      }
    }
  }, [enabled, policy, logEvent, addWarning]);

  // ─── Attach / detach DOM event listeners ──────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [enabled, handleVisibilityChange, handleWindowBlur, handleWindowFocus, handleFullscreenChange]);

  // ─── Track isInterviewActive ref from proctoringState ────────────────────
  useEffect(() => {
    isInterviewActiveRef.current = proctoringState === 'in_progress';
  }, [proctoringState]);

  // ─── Camera request & monitoring ─────────────────────────────────────────
  const requestCamera = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setDeviceStatus(prev => ({ ...prev, camera: 'unsupported' as DeviceStatusValue }));
      return false;
    }
    setDeviceStatus(prev => ({ ...prev, camera: 'requesting' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
      });
      
      const videoTracks = stream.getVideoTracks();
      const hasActiveVideo = videoTracks.some(t => t.readyState === 'live' && t.enabled);
      if (!hasActiveVideo) {
        setDeviceStatus(prev => ({ ...prev, camera: 'unavailable' }));
        return false;
      }

      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setDeviceStatus(prev => ({ ...prev, camera: 'ready' }));
      logEvent('device_check_passed', { severity: 'info', explanation: 'Camera permission granted and active video track confirmed.' });

      // Monitor track for disconnection
      videoTracks.forEach(track => {
        track.addEventListener('ended', () => {
          setDeviceStatus(prev => ({ ...prev, camera: 'disconnected' }));
          setViolations(prev => ({ ...prev, cameraDisconnected: prev.cameraDisconnected + 1 }));
          logEvent('camera_disconnected', {
            severity: 'critical',
            explanation: 'Camera track ended unexpectedly.',
            actionTaken: 'Interview paused; camera required',
          });
          addWarning('Camera disconnected. Please reconnect your camera to continue.');
          if (isInterviewActiveRef.current) {
            setProctoringState('paused');
          }
        });
      });
      return true;
    } catch (err: any) {
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setDeviceStatus(prev => ({ ...prev, camera: isDenied ? 'denied' : 'unavailable' }));
      logEvent('camera_disconnected', {
        severity: 'warning',
        explanation: `Camera request failed: ${err?.message ?? 'unknown'}`,
      });
      return false;
    }
  }, [policy, logEvent, addWarning]);

  // ─── Microphone request & monitoring ─────────────────────────────────────
  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setDeviceStatus(prev => ({ ...prev, microphone: 'unsupported' as DeviceStatusValue }));
      return false;
    }
    setDeviceStatus(prev => ({ ...prev, microphone: 'requesting' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioTracks = stream.getAudioTracks();
      const hasActiveAudio = audioTracks.some(t => t.readyState === 'live' && t.enabled);
      if (!hasActiveAudio) {
        setDeviceStatus(prev => ({ ...prev, microphone: 'unavailable' }));
        return false;
      }

      micStreamRef.current = stream;
      setMicStream(stream);
      setDeviceStatus(prev => ({ ...prev, microphone: 'ready' }));
      logEvent('device_check_passed', { severity: 'info', explanation: 'Microphone permission granted and active audio track confirmed.' });

      audioTracks.forEach(track => {
        track.addEventListener('ended', () => {
          setDeviceStatus(prev => ({ ...prev, microphone: 'disconnected' }));
          setViolations(prev => ({ ...prev, micDisconnected: prev.micDisconnected + 1 }));
          logEvent('microphone_disconnected', {
            severity: 'critical',
            explanation: 'Microphone track ended unexpectedly.',
            actionTaken: 'Interview paused; microphone required',
          });
          addWarning('Microphone disconnected. Please reconnect your microphone to continue.');
          if (isInterviewActiveRef.current) {
            setProctoringState('paused');
          }
        });
      });
      return true;
    } catch (err: any) {
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setDeviceStatus(prev => ({ ...prev, microphone: isDenied ? 'denied' : 'unavailable' }));
      return false;
    }
  }, [policy, logEvent, addWarning]);

  // ─── Fullscreen API ───────────────────────────────────────────────────────
  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    if (!document.documentElement.requestFullscreen) {
      return false; // Unsupported
    }
    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch {
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // ─── Pause / Resume ────────────────────────────────────────────────────────
  const pauseFromPolicy = useCallback(
    (reason: string) => {
      setProctoringState('paused');
      pauseTimestampsRef.current.push(new Date().toISOString());
      logEvent('interview_paused', {
        severity: 'warning',
        actionTaken: 'Interview paused',
        explanation: reason,
      });
    },
    [logEvent]
  );

  const resumeFromPause = useCallback(() => {
    setProctoringState('in_progress');
    resumeTimestampsRef.current.push(new Date().toISOString());
    logEvent('interview_resumed', { severity: 'info', explanation: 'Candidate resumed the interview.' });
    clearWarnings();
  }, [logEvent, clearWarnings]);

  // ─── Complete ──────────────────────────────────────────────────────────────
  const completeInterview = useCallback(() => {
    setProctoringState('completed');
    logEvent('interview_completed', { severity: 'info' });
  }, [logEvent]);

  // ─── Stop all media tracks on cleanup ─────────────────────────────────────
  const stopAllTracks = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraStreamRef.current = null;
    micStreamRef.current = null;
    setCameraStream(null);
    setMicStream(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllTracks();
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [stopAllTracks]);

  // ─── Snapshot ─────────────────────────────────────────────────────────────
  const getSnapshot = useCallback((): ProctoringSnapshot => ({
    sessionId,
    state: proctoringState,
    violations,
    eventLog,
    deviceStatus,
    fullscreenActive: isFullscreen,
    consentGiven,
    pauseTimestamps: [...pauseTimestampsRef.current],
    resumeTimestamps: [...resumeTimestampsRef.current],
    activeWarnings,
  }), [sessionId, proctoringState, violations, eventLog, deviceStatus, isFullscreen, consentGiven, activeWarnings]);

  return {
    proctoringState,
    setProctoringState,
    deviceStatus,
    isFullscreen,
    violations,
    eventLog,
    activeWarnings,
    consentGiven,
    setConsentGiven,
    cameraStream,
    micStream,
    requestCamera,
    requestMicrophone,
    enterFullscreen,
    exitFullscreen,
    dismissWarning,
    clearWarnings,
    pauseFromPolicy,
    resumeFromPause,
    completeInterview,
    getSnapshot,
    stopAllTracks,
  };
}
