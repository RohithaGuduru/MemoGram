export type Role = 'caretaker' | 'patient' | null;

export type SupportedLanguageCode = 
  | 'as-IN'  // Assamese (অসমীয়া)
  | 'brx-IN' // Bodo (बड़ो)
  | 'mni-IN' // Manipuri / Meitei (মৈতৈ)
  | 'trp-IN' // Kokborok (ককবোরক)
  | 'lus-IN' // Mizo (Mizo)
  | 'kha-IN' // Khasi (Ka Ktien Khasi)
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
  category?: 'Parents' | 'Spouse' | 'Siblings' | 'Child' | 'Other' | string;
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
  medicineType?: 'Capsules' | 'Tablets' | 'Syrup / Tonic' | string;
  frequency?: string; // e.g. "Once", "Twice", "Thrice", "Daily"
  scheduledTimes?: string[]; // e.g. ["8:00 AM", "8:00 PM"]
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

export interface HydrationSettings {
  dailyGoalGlasses: number; // e.g. 8 or 3
  dailyGoal?: number; // alias for goal value
  unit: 'glasses' | 'litres';
  startTime: string; // e.g. '08:00 AM'
  endTime: string; // e.g. '08:00 PM'
  reminderIntervalMinutes: number; // 30, 60, 120
  enabled?: boolean;
}

export interface Appointment {
  id: string;
  hospitalName: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:30 AM"
  notes?: string;
}

export interface CognitiveMetrics {
  attention: number; // 0-100
  memory: number; // 0-100
  patternRecognition: number; // 0-100
  overallScore: number; // 0-100
  trend: 'improving' | 'stable' | 'needs_attention';
  weeklyActivityMinutes: number;
  cognitiveTimeTodayMinutes?: number;
  gamesPlayedToday: number;
  sessionsCompleted: number;
  lastPlayedAt: string;
  stepsToday?: number;
  stepGoal?: number;
  waterConsumedToday?: number;
}

export type GameId = 
  | 'groceries' 
  | 'routine' 
  | 'cup_shuffle' 
  | 'cultural_match' 
  | 'family_stories'
  | 'memory_mosaic'
  | 'block_mind';

export interface GameMetadata {
  id: GameId;
  name: string;
  category: 'Memory' | 'Executive Function' | 'Attention & Focus' | 'Cultural Memory' | 'Storytelling & Speech' | 'Pattern Recognition' | 'Spatial Planning';
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
  fontSize?: FontSizeSetting;
  caretakerId: string;
  caretakerName: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  hydrationSettings?: HydrationSettings;
  appointments?: Appointment[];
  accessibility_preferences?: Record<string, any>;
  stepsToday?: number;
  stepGoal?: number;
  waterConsumedToday?: number;
}

export interface CaretakerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationshipToPatient: string;
  photoUrl: string;
  language: SupportedLanguageCode;
  fontSize: FontSizeSetting;
}

export type ScreenId = 
  // Onboarding
  | 'welcome'
  | 'role_selection'
  | 'caretaker_auth'
  | 'caretaker_setup'
  | 'patient_auth'
  | 'patient_setup'
  | 'forgot_password'
  | 'reset_password'
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
  | 'game_family_stories'
  | 'game_memory_mosaic'
  | 'game_block_mind';
