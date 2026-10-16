import { UserSettings } from '../types/interview';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  language: 'en-US',
  voiceURI: '',
  voicePitch: 1.0,
  voiceRate: 1.0,
  voiceVolume: 1.0,
  autoSpeakQuestions: true,
  theme: 'dark-navy',
  micDeviceId: 'default',
  aiProvider: 'built-in',
  geminiApiKey: '',
  sttProvider: 'browser-native',
  whisperApiKey: '',
  enableSoundEffects: true,
  hapticFeedback: false,
};

export const INTERVIEW_TIPS = [
  {
    title: 'Use the STAR Method for Behavioral Questions',
    description: 'Frame responses as Situation (context), Task (your goal), Action (what you specifically did), and Result (quantifiable outcome).',
    category: 'HR'
  },
  {
    title: 'Think Aloud in Technical & Coding Rounds',
    description: 'Interviewers evaluate your thought process. State your brute force idea first, discuss tradeoffs, then optimize.',
    category: 'Technical'
  },
  {
    title: 'Structure System & Architecture Answers',
    description: 'Clarify requirements, define scale (QPS, storage), draft high-level components, then deep-dive into bottlenecks.',
    category: 'Architecture'
  },
  {
    title: 'Aptitude Speed Technique',
    description: 'Identify the governing mathematical theorem before calculating. Use fractional shortcuts like 5/18 for speed conversions.',
    category: 'Aptitude'
  }
];

export const SKILL_BENCHMARKS = [
  { skill: 'Data Structures & Algorithms', averageScore: 74, targetScore: 85 },
  { skill: 'System Design & APIs', averageScore: 68, targetScore: 80 },
  { skill: 'Behavioral & STAR Method', averageScore: 82, targetScore: 90 },
  { skill: 'Quantitative & Logical Aptitude', averageScore: 71, targetScore: 85 },
  { skill: 'Technical Articulation', averageScore: 76, targetScore: 88 }
];
