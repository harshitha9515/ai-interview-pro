import { InterviewSession, UserSettings, InterviewType, ExperienceLevel, QuestionDifficulty, InterviewMode } from '../types/interview';
import { ProctoringSnapshot } from '../types/proctoring';
import { DEFAULT_USER_SETTINGS } from '../data/mockData';

const SESSIONS_KEY = 'ai_interview_pro_sessions_v1';
const SETTINGS_KEY = 'ai_interview_pro_settings_v1';
const ACTIVE_SESSION_KEY = 'ai_interview_pro_active_session_v1';
const ACTIVE_INDEX_KEY = 'ai_interview_pro_active_index_v1';
const SETUP_PREFS_KEY = 'ai_interview_pro_setup_prefs_v1';
const ASKED_QUESTIONS_KEY = 'ai_interview_pro_asked_questions_v1';

export interface SetupPreferences {
  candidateName?: string;
  type: InterviewType;
  role: string;
  isCustomRole?: boolean;
  customRoleInput?: string;
  experienceLevel: ExperienceLevel;
  language: string;
  difficulty: QuestionDifficulty;
  questionCount: number;
  mode: InterviewMode;
  durationMinutes: number;
  proctoredMode?: boolean;
}

export const DEFAULT_SETUP_PREFERENCES: SetupPreferences = {
  candidateName: '',
  type: 'placement_mixed',
  role: 'Campus Placement Fresher (All Disciplines)',
  isCustomRole: false,
  customRoleInput: '',
  experienceLevel: 'fresher',
  language: 'en-IN',
  difficulty: 'intermediate',
  questionCount: 5,
  mode: 'voice',
  durationMinutes: 15,
  proctoredMode: true
};

export const storageService = {
  getSessions(): InterviewSession[] {
    try {
      const data = localStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load sessions from localStorage', e);
      return [];
    }
  },

  getSessionById(id: string): InterviewSession | null {
    const sessions = this.getSessions();
    return sessions.find(s => s.id === id) || null;
  },

  saveSession(session: InterviewSession): void {
    try {
      const sessions = this.getSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.unshift(session);
      }
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save session to localStorage', e);
    }
  },

  deleteSession(id: string): void {
    try {
      const sessions = this.getSessions().filter(s => s.id !== id);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to delete session', e);
    }
  },

  clearAllSessions(): void {
    try {
      localStorage.removeItem(SESSIONS_KEY);
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem(ACTIVE_INDEX_KEY);
    } catch (e) {
      console.error('Failed to clear sessions', e);
    }
  },

  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? { ...DEFAULT_USER_SETTINGS, ...JSON.parse(data) } : DEFAULT_USER_SETTINGS;
    } catch (e) {
      console.error('Failed to load settings', e);
      return DEFAULT_USER_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },

  getActiveSession(): InterviewSession | null {
    try {
      const data = localStorage.getItem(ACTIVE_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveActiveSession(session: InterviewSession | null): void {
    try {
      if (session) {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
        localStorage.removeItem(ACTIVE_INDEX_KEY);
      }
    } catch (e) {
      console.error('Failed to save active session', e);
    }
  },

  getActiveSessionIndex(): number {
    try {
      const raw = localStorage.getItem(ACTIVE_INDEX_KEY);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch {
      return 0;
    }
  },

  saveActiveSessionIndex(index: number): void {
    try {
      localStorage.setItem(ACTIVE_INDEX_KEY, String(index));
    } catch (e) {
      // Ignore
    }
  },

  getSetupPreferences(): SetupPreferences {
    try {
      const raw = localStorage.getItem(SETUP_PREFS_KEY);
      return raw ? { ...DEFAULT_SETUP_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_SETUP_PREFERENCES;
    } catch {
      return DEFAULT_SETUP_PREFERENCES;
    }
  },

  saveSetupPreferences(prefs: Partial<SetupPreferences>): void {
    try {
      const current = this.getSetupPreferences();
      const updated = { ...current, ...prefs };
      localStorage.setItem(SETUP_PREFS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save setup preferences', e);
    }
  },

  getAskedQuestionsHistory(): string[] {
    try {
      const raw = localStorage.getItem(ASKED_QUESTIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  recordAskedQuestions(newQuestions: string[]): void {
    try {
      const existing = this.getAskedQuestionsHistory();
      const set = new Set(existing);
      for (const q of newQuestions) {
        const trimmed = q.trim();
        if (trimmed) {
          set.add(trimmed);
        }
      }
      localStorage.setItem(ASKED_QUESTIONS_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {
      console.error('Failed to record asked questions', e);
    }
  },

  clearAskedQuestionsHistory(): void {
    try {
      localStorage.removeItem(ASKED_QUESTIONS_KEY);
    } catch (e) {
      console.error('Failed to clear asked questions history', e);
    }
  },

  saveProctoringSnapshot(sessionId: string, snapshot: ProctoringSnapshot): void {
    try {
      localStorage.setItem(`ai_interview_pro_proctoring_${sessionId}`, JSON.stringify(snapshot));
      const session = this.getSessionById(sessionId);
      if (session) {
        session.isProctored = true;
        session.proctoringSnapshot = snapshot;
        this.saveSession(session);
      }
    } catch (e) {
      console.error('Failed to save proctoring snapshot', e);
    }
  },

  getProctoringSnapshot(sessionId: string): ProctoringSnapshot | null {
    try {
      const data = localStorage.getItem(`ai_interview_pro_proctoring_${sessionId}`);
      if (data) return JSON.parse(data);
      const session = this.getSessionById(sessionId);
      return session?.proctoringSnapshot || null;
    } catch (e) {
      console.error('Failed to load proctoring snapshot', e);
      return null;
    }
  }
};
