/**
 * AI Interview Pro — Proctoring Types
 * ====================================
 * Type definitions for the proctored interview mode.
 * These types are intentionally separate from interview.ts to maintain clear boundaries.
 */

// ─── Proctored Session State Machine ─────────────────────────────────────────
export type ProctoredSessionState =
  | 'instructions'   // Showing rules + consent
  | 'device_check'   // Camera/mic permissions & device test
  | 'ready'          // All checks passed, waiting for user to press Start
  | 'in_progress'    // Active interview
  | 'paused'         // Temporarily paused (policy threshold reached or user-initiated)
  | 'completed'      // Interview finished normally
  | 'requires_review' // Threshold exceeded — flagged for human review
  | 'evaluation_pending'; // Answers submitted, awaiting scoring

// ─── Device Status ────────────────────────────────────────────────────────────
export type DeviceStatusValue =
  | 'not_checked'
  | 'requesting'
  | 'ready'
  | 'denied'
  | 'unavailable'
  | 'disconnected'
  | 'unsupported';

export interface DeviceStatus {
  camera: DeviceStatusValue;
  microphone: DeviceStatusValue;
}

// ─── Proctoring Event Types ───────────────────────────────────────────────────
export type ProctoringEventType =
  | 'tab_hidden'
  | 'window_blur'
  | 'tab_visible'
  | 'window_focus'
  | 'fullscreen_entered'
  | 'fullscreen_exited'
  | 'camera_disconnected'
  | 'camera_reconnected'
  | 'microphone_disconnected'
  | 'microphone_reconnected'
  | 'warning_shown'
  | 'interview_paused'
  | 'interview_resumed'
  | 'interview_completed'
  | 'consent_given'
  | 'device_check_passed';

export type ProctoringEventSeverity = 'info' | 'warning' | 'critical';

export interface ProctoringEvent {
  id: string;
  sessionId: string;
  eventType: ProctoringEventType;
  timestamp: string;  // ISO 8601
  severity: ProctoringEventSeverity;
  count: number;      // cumulative count of this event type at time of recording
  actionTaken?: string;
  explanation?: string;
}

// ─── Violation Counters ───────────────────────────────────────────────────────
export interface ViolationCounts {
  tabHidden: number;
  windowBlur: number;
  fullscreenExited: number;
  cameraDisconnected: number;
  micDisconnected: number;
}

// ─── Violation Policy ─────────────────────────────────────────────────────────
export interface ProctoringViolationPolicy {
  /** Number of tab-hidden events before showing Warning 1 */
  tabHiddenWarning1Threshold: number;
  /** Number of tab-hidden events before showing Warning 2 */
  tabHiddenWarning2Threshold: number;
  /** Number of tab-hidden events before pausing/flagging for review */
  tabHiddenPauseThreshold: number;
  /** Whether camera is required (mandatory). If false, loss is a warning only. */
  cameraRequired: boolean;
  /** Whether microphone is required for spoken answers */
  micRequired: boolean;
  /** Whether fullscreen exit should be flagged as a warning */
  fullscreenExitWarning: boolean;
  /** Whether a fullscreen exit should pause the interview */
  fullscreenExitPauses: boolean;
  /** Action on reaching pause threshold: 'pause' | 'review' */
  onThresholdReached: 'pause' | 'review';
}

export const DEFAULT_VIOLATION_POLICY: ProctoringViolationPolicy = {
  tabHiddenWarning1Threshold: 1,
  tabHiddenWarning2Threshold: 2,
  tabHiddenPauseThreshold: 3,
  cameraRequired: false,         // Warning only — not all candidates have cameras
  micRequired: false,            // Text input is always available as fallback
  fullscreenExitWarning: true,
  fullscreenExitPauses: false,
  onThresholdReached: 'review',  // Flag for review rather than hard-fail
};

// ─── Proctoring Session Snapshot ─────────────────────────────────────────────
export interface ProctoringSnapshot {
  sessionId: string;
  state: ProctoredSessionState;
  violations: ViolationCounts;
  eventLog: ProctoringEvent[];
  deviceStatus: DeviceStatus;
  fullscreenActive: boolean;
  consentGiven: boolean;
  pauseTimestamps: string[];
  resumeTimestamps: string[];
  activeWarnings: string[];
}

// ─── Proctoring Config (passed to hook) ──────────────────────────────────────
export interface ProctoringConfig {
  sessionId: string;
  enabled: boolean;
  policy: ProctoringViolationPolicy;
  /** Whether to request fullscreen on interview start */
  requestFullscreen: boolean;
  /** Whether to skip device check (e.g. text-only mode) */
  skipDeviceCheck: boolean;
}
