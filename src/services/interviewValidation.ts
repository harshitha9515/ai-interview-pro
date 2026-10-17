/**
 * AI Interview Pro — Centralized Interview Validation Service
 * ============================================================
 * Enforces strict validation rules for starting an interview session.
 * Used by:
 * - SetupPage.tsx (pre-check before navigating to rules/device check)
 * - InterviewRoomPage.tsx (guarding entry and execution)
 * - InterviewContext.tsx (startInterview runtime assertion)
 */

import { 
  InterviewType, 
  ExperienceLevel, 
  QuestionDifficulty, 
  InterviewMode, 
  ExtractedResumeData 
} from '../types/interview';
import { DeviceStatus } from '../types/proctoring';

export interface InterviewValidationParams {
  resumeData?: ExtractedResumeData | null;
  candidateName?: string;
  category?: InterviewType | null;
  role?: string;
  isCustomRole?: boolean;
  customRoleInput?: string;
  experienceLevel?: ExperienceLevel | null;
  mode?: InterviewMode | null;
  difficulty?: QuestionDifficulty | null;
  questionCount?: number | null;
  durationMinutes?: number | null;
  language?: string | null;
  rulesAcknowledged?: boolean;
  cameraReady?: boolean;
  cameraHasActiveTrack?: boolean;
  micReady?: boolean;
  micHasActiveTrack?: boolean;
  deviceCheckCompleted?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  missingField?: string;
}

/**
 * Validates initial interview preferences in Setup before proceeding to Rules/Device Check.
 */
export function validateSetupPreferences(params: InterviewValidationParams): ValidationResult {
  const errors: string[] = [];

  // 1. Resume uploaded & parsed
  if (!params.resumeData) {
    errors.push('A valid resume must be uploaded and parsed before starting an interview.');
  }

  // 2. Candidate name
  const trimmedName = (params.candidateName || '').trim();
  if (!trimmedName || trimmedName.length < 2) {
    errors.push('Candidate full name is required (minimum 2 characters).');
  }

  // 3. Category
  if (!params.category) {
    errors.push('Please select an interview category.');
  }

  // 4. Target Role
  const effectiveRole = params.isCustomRole ? (params.customRoleInput || '').trim() : (params.role || '').trim();
  if (!effectiveRole) {
    errors.push('Please select your target job role or specify a custom role.');
  }

  // 5. Experience level
  if (!params.experienceLevel) {
    errors.push('Please select an experience level.');
  }

  // 6. Input mode
  if (!params.mode) {
    errors.push('Please select an interview input mode (Voice & Speech or Text / Code Only).');
  }

  // 7. Difficulty
  if (!params.difficulty) {
    errors.push('Please select a question difficulty level.');
  }

  // 8. Question count
  if (!params.questionCount || params.questionCount < 1) {
    errors.push('Please select the number of questions.');
  }

  // 9. Session duration
  if (!params.durationMinutes || params.durationMinutes < 5) {
    errors.push('Please select session duration.');
  }

  // 10. Language
  if (!params.language) {
    errors.push('Please select a target interview language.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingField: errors[0]
  };
}

/**
 * Complete centralized validation for starting an interview session.
 * Rejects start unless ALL conditions pass:
 * - A valid resume has been uploaded and successfully parsed
 * - Category explicitly selected
 * - Target role selected (or valid custom role entered)
 * - Experience level selected
 * - Input mode selected
 * - Difficulty selected
 * - Question count selected
 * - Session duration selected
 * - Interview language selected
 * - Rules and privacy notice acknowledged
 * - Camera permission granted & active video track available
 * - Microphone permission granted & active audio track available
 * - Device checks completed successfully
 */
export function validateInterviewStart(params: InterviewValidationParams): ValidationResult {
  const prefResult = validateSetupPreferences(params);
  const errors: string[] = [...prefResult.errors];

  // 11. Rules acknowledgement
  if (!params.rulesAcknowledged) {
    errors.push('Interview rules and academic integrity notice must be acknowledged.');
  }

  // 12. Camera permission & active video track
  if (!params.cameraReady || !params.cameraHasActiveTrack) {
    errors.push('Camera permission is required with an active video track available.');
  }

  // 13. Microphone permission & active audio track
  if (!params.micReady || !params.micHasActiveTrack) {
    errors.push('Microphone permission is required with an active audio track available.');
  }

  // 14. Device checks completed
  if (!params.deviceCheckCompleted) {
    errors.push('All required hardware device checks must be completed successfully.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingField: errors[0]
  };
}
