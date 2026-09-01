export type Role = 'caretaker' | 'patient' | null;

export type SupportedLanguageCode = 
  | 'as-IN'  // Assamese (অসমীয়া)
  | 'brx-IN' // Bodo (बड़ो)
  | 'mni-IN' // Manipuri / Meitei (মৈতৈ)
  | 'trp-IN' // Kokborok (ককবোরক)
  | 'lus-IN' // Mizo (Mizo)
  | 'hi-IN'  // Hindi (हिंदी)
  | 'en-IN'; // English

export interface LanguageInfo {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  script: string;
  region: string;
  capabilities: {
    text: boolean;
    voiceInput: boolean;
    tts: boolean;
    ttsVoiceAvailable: boolean; // browser voice matching
    statusNote?: string;
  };
}

export type FontSizeSetting = 'normal' | 'large' | 'extra-large';

export interface AccessibilitySettings {
  fontSize: FontSizeSetting;
  highContrast: boolean;
  theme: 'light' | 'dark' | 'warm';
  soundEnabled: boolean;
  autoSpeakPrompts: boolean;
  reducedMotion: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  photoUrl?: string;
  avatarBg?: string;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  scheduleTime: string; // e.g. "9:00 AM"
  timeCategory: 'morning' | 'afternoon' | 'evening' | 'night';
  remainingQuantity: number;
  totalQuantity: number;
  takenStatus: 'pending' | 'taken' | 'snoozed' | 'missed';
  takenAt?: string;
  snoozedUntil?: string;
  photoUrl?: string;
  instructions: string;
  prescribedBy?: string;
}

export interface CognitiveMetrics {
  attention: number; // 0-100
  memory: number; // 0-100
  patternRecognition: number; // 0-100
  overallScore: number; // 0-100
  trend: 'improving' | 'stable' | 'needs_attention';
  weeklyActivityMinutes: number;
  gamesPlayedToday: number;
  sessionsCompleted: number;
  lastPlayedAt: string;
}

export type GameId = 
  | 'groceries' 
  | 'routine' 
  | 'cup_shuffle' 
  | 'cultural_match' 
  | 'family_stories';

export interface GameMetadata {
  id: GameId;
  name: string;
  category: 'Memory' | 'Executive Function' | 'Attention & Focus' | 'Cultural Memory' | 'Storytelling & Speech';
  shortDescription: string;
  iconName: string;
  colorScheme: {
    bg: string;
    border: string;
    badge: string;
    text: string;
    accent: string;
  };
  durationEstimate: string;
}

export interface GameScoreResult {
  gameId: GameId;
  score: number;
  attempts: number;
  mistakes: number;
  hintsUsed: number;
  timeSpentSeconds: number;
  timestamp: string;
  difficulty: 'easier' | 'standard' | 'challenging';
  nextDifficultyRecommendation: 'easier' | 'standard' | 'challenging';
}

export interface AlertItem {
  id: string;
  type: 'medication_reminder' | 'missed_medication' | 'game_reminder' | 'encouragement' | 'sos_alert';
  title: string;
  message: string;
  time: string;
  unread: boolean;
  priority: 'normal' | 'high' | 'urgent';
  actionScreen?: string;
}

export interface FamilyStory {
  id: string;
  title: string;
  prompt: string;
  audioDurationSeconds?: number;
  recordedAt: string;
  transcript?: string;
  photoUrl?: string;
  tags: string[];
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  age: number;
  photoUrl: string;
  primaryLanguage: SupportedLanguageCode;
  fallbackLanguage: SupportedLanguageCode;
  caretakerId: string;
  caretakerName: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface CaretakerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationshipToPatient: string;
  photoUrl: string;
  language: SupportedLanguageCode;
}

export type ScreenId = 
  // Onboarding
  | 'welcome'
  | 'role_selection'
  | 'caretaker_auth'
  | 'caretaker_setup'
  | 'patient_auth'
  | 'patient_setup'
  // Caretaker Portal
  | 'caretaker_dashboard'
  | 'caretaker_medications'
  | 'caretaker_patient'
  | 'caretaker_cognitive'
  | 'caretaker_reports'
  | 'caretaker_profile'
  | 'caretaker_settings'
  // Patient Experience
  | 'patient_home'
  | 'patient_meds'
  | 'patient_games'
  | 'patient_alerts'
  | 'patient_profile'
  | 'patient_settings'
  | 'patient_help'
  // Games
  | 'game_groceries'
  | 'game_routine'
  | 'game_cup_shuffle'
  | 'game_cultural_match'
  | 'game_family_stories';
