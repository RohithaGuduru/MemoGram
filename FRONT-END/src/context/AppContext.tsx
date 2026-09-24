import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { 
  Role, 
  ScreenId, 
  SupportedLanguageCode, 
  AccessibilitySettings,
  PatientProfile,
  CaretakerProfile,
  FamilyMember,
  Medication,
  CognitiveMetrics,
  AlertItem,
  FamilyStory,
  GameScoreResult,
  GameId,
  FontSizeSetting,
  HydrationSettings,
  Appointment
} from '../types';
import {
  isDemoId,
  isRealPatientId,
  isDemoMode,
  getDemoPatient,
  getDemoPatients,
  getDemoCaretaker,
  getDemoMedications,
  getDemoFamilyMembers,
  getDemoAppointments,
  getDemoCognitiveMetrics,
  getDemoGameHistory,
  getDemoAlerts,
  getDemoStories,
  getDemoHydrationSettings,
  DemoModeApiError,
} from '../services/demoFallback';
import { speechService } from '../services/speechService';
import { 
  getLanguageInfo, 
  syncLanguagesFromBackend, 
  frontendToBackendLang, 
  backendToFrontendLang,
  t 
} from '../services/languageCapabilities';
import { 
  authApi, 
  patientsApi, 
  caretakersApi, 
  relationshipsApi, 
  medicinesApi, 
  remindersApi, 
  familyApi, 
  sosApi, 
  notificationsApi, 
  voiceApi, 
  metricsApi, 
  gameSessionsApi, 
  getAccessToken,
  clearAuthTokens,
  RelationshipBackendResponse,
  VoiceProcessBackendResponse,
  ReminderUpdatePayload
} from '../api';

export interface ToastNotice {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
}

export interface AppContextType {
  // Navigation & Role
  role: Role;
  setRole: (role: Role, targetScreen?: ScreenId) => void;
  currentScreen: ScreenId;
  navigateTo: (screen: ScreenId) => void;
  screenHistory: ScreenId[];
  goBack: () => void;

  // View presentation mode (for demo)
  viewMode: 'device_frame' | 'responsive';
  setViewMode: (mode: 'device_frame' | 'responsive') => void;

  // Caretaker Preferences (independent)
  caretakerLanguage: SupportedLanguageCode;
  caretakerFontSize: FontSizeSetting;
  setCaretakerLanguage: (lang: SupportedLanguageCode) => void;
  setCaretakerFontSize: (size: FontSizeSetting) => void;

  // Patient Preferences (independent)
  patientLanguage: SupportedLanguageCode;
  patientFontSize: FontSizeSetting;
  setPatientLanguage: (lang: SupportedLanguageCode) => void;
  setPatientFontSize: (size: FontSizeSetting) => void;

  // Accessibility
  accessibility: AccessibilitySettings;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;

  // Language
  primaryLanguage: SupportedLanguageCode;
  fallbackLanguage: SupportedLanguageCode;
  setPrimaryLanguage: (lang: SupportedLanguageCode) => void;
  setFallbackLanguage: (lang: SupportedLanguageCode) => void;

  // Backend sync status
  backendConnected: boolean;
  isSyncing: boolean;
  refreshData: () => Promise<void>;

  // Profiles
  patient: PatientProfile;
  updatePatient: (data: Partial<PatientProfile>) => void;
  caretaker: CaretakerProfile;
  updateCaretaker: (data: Partial<CaretakerProfile>) => void;
  assignedPatients: RelationshipBackendResponse[];
  activeRelationshipId?: string;
  availablePatients: PatientProfile[];
  selectPatient: (patientId: string) => Promise<void>;
  familyMembers: FamilyMember[];
  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateFamilyMember: (id: string, member: Partial<FamilyMember>) => void;
  deleteFamilyMember: (id: string) => void;

  // Medications
  medications: Medication[];
  addMedication: (med: Omit<Medication, 'id'>) => void;
  updateMedication: (id: string, med: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  markMedicationTaken: (id: string) => void;
  snoozeMedication: (id: string, minutes?: number) => void;

  // Hydration Settings
  hydrationSettings: HydrationSettings;
  updateHydrationSettings: (settings: Partial<HydrationSettings>) => Promise<void>;

  // Appointments
  appointments: Appointment[];
  addAppointment: (apt: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointment: (id: string, apt: Partial<Omit<Appointment, 'id'>>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  // Cognitive Analytics & Games
  cognitiveMetrics: CognitiveMetrics;
  gameHistory: GameScoreResult[];
  adaptiveDifficulties: Record<GameId, 'easier' | 'standard' | 'challenging'>;
  setAdaptiveDifficulty: (gameId: GameId, diff: 'easier' | 'standard' | 'challenging') => void;
  recordGameResult: (result: Omit<GameScoreResult, 'timestamp'>) => void;

  // Alerts & Notifications
  alerts: AlertItem[];
  markAlertRead: (id: string) => void;
  addAlert: (alert: Omit<AlertItem, 'id' | 'time'>) => void;
  dismissAlert: (id: string) => void;

  // Family Stories
  stories: FamilyStory[];
  addStory: (story: Omit<FamilyStory, 'id' | 'recordedAt'>) => void;
  deleteStory: (id: string) => void;

  // SOS Emergency Modal
  isSosModalOpen: boolean;
  openSosModal: () => void;
  closeSosModal: () => void;
  triggerSosAlert: () => void;
  resolveSosAlert: (alertId?: string) => Promise<void>;
  sosAlertSent: boolean;

  // Speech & Voice State
  isSpeaking: boolean;
  isListening: boolean;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  startVoiceListening: (onResult?: (text: string) => void) => void;
  stopVoiceListening: () => void;
  processVoiceAssistant: (textOrAudio: { transcript?: string; audioBase64?: string; audioContentType?: string }) => Promise<VoiceProcessBackendResponse | null>;
  voiceTranscript: string;

  // Toast / System Notices
  toasts: ToastNotice[];
  showToast: (message: string, type?: ToastNotice['type'], title?: string) => void;
  removeToast: (id: string) => void;

  // Localization
  t: (key: string, params?: Record<string, string | number>) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation & Role
  const [role, setRoleState] = useState<Role>(() => {
    const savedRole = localStorage.getItem('memogram_user_role');
    if (savedRole === 'CAREGIVER' || savedRole === 'CARETAKER' || savedRole === 'caretaker') return 'caretaker';
    if (savedRole === 'PATIENT' || savedRole === 'patient') return 'patient';
    return null;
  });
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    try {
      const saved = localStorage.getItem('memogram_current_screen');
      const savedRole = localStorage.getItem('memogram_user_role');
      if (saved) {
        const isAuthScreen = saved.startsWith('patient_') || saved.startsWith('caretaker_') || saved.startsWith('game_');
        if (!isAuthScreen || savedRole) {
          return saved as ScreenId;
        }
      }
    } catch {}
    return 'welcome';
  });
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>(() => {
    try {
      const saved = localStorage.getItem('memogram_current_screen');
      const savedRole = localStorage.getItem('memogram_user_role');
      if (saved) {
        const isAuthScreen = saved.startsWith('patient_') || saved.startsWith('caretaker_') || saved.startsWith('game_');
        if (!isAuthScreen || savedRole) {
          return [saved as ScreenId];
        }
      }
    } catch {}
    return ['welcome'];
  });

  // Presentation view
  const [viewMode, setViewMode] = useState<'device_frame' | 'responsive'>('device_frame');

  // Backend Sync / Online status
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Accessibility
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('memogram_accessibility');
      return saved ? JSON.parse(saved) : {
        fontSize: 'normal',
        highContrast: false,
        theme: 'light',
        soundEnabled: true,
        autoSpeakPrompts: false,
        reducedMotion: false,
      };
    } catch {
      return {
        fontSize: 'normal',
        highContrast: false,
        theme: 'light',
        soundEnabled: true,
        autoSpeakPrompts: false,
        reducedMotion: false,
      };
    }
  });

  // Independent Caretaker Preferences
  const [caretakerLanguage, setCaretakerLanguageState] = useState<SupportedLanguageCode>(() => {
    try {
      const saved = localStorage.getItem('memogram_caretaker_language');
      return (saved as SupportedLanguageCode) || 'en-IN';
    } catch {
      return 'en-IN';
    }
  });

  const [caretakerFontSize, setCaretakerFontSizeState] = useState<FontSizeSetting>(() => {
    try {
      const saved = localStorage.getItem('memogram_caretaker_font_size');
      return (saved as FontSizeSetting) || 'normal';
    } catch {
      return 'normal';
    }
  });

  // Independent Patient Preferences
  const [patientLanguage, setPatientLanguageState] = useState<SupportedLanguageCode>(() => {
    try {
      const saved = localStorage.getItem('memogram_patient_language');
      return (saved as SupportedLanguageCode) || 'as-IN';
    } catch {
      return 'as-IN';
    }
  });

  const [patientFontSize, setPatientFontSizeState] = useState<FontSizeSetting>(() => {
    try {
      const saved = localStorage.getItem('memogram_patient_font_size');
      return (saved as FontSizeSetting) || 'normal';
    } catch {
      return 'normal';
    }
  });

  // Role and Screen Context Helpers
  const isCaretakerScreen = currentScreen.startsWith('caretaker');
  const isPatientScreen = currentScreen.startsWith('patient') || currentScreen.startsWith('game_');
  const isCaretakerContext = isCaretakerScreen || (role === 'caretaker' && !isPatientScreen);
  const effectivePrimaryLanguage = isCaretakerContext ? caretakerLanguage : patientLanguage;
  const effectiveFontSize = isCaretakerContext ? caretakerFontSize : patientFontSize;
  const primaryLanguage = effectivePrimaryLanguage;

  // Compatibility Language State
  const [fallbackLanguage, setFallbackLanguageState] = useState<SupportedLanguageCode>('hi-IN');

  // Bound translation helper using active effective language and fallback
  const tBound = useCallback((key: string, params?: Record<string, string | number>) => {
    return t(key, effectivePrimaryLanguage, fallbackLanguage, params);
  }, [effectivePrimaryLanguage, fallbackLanguage]);

  // Profiles & Data (Populated by default with Demo Fallback Data for a complete prototype)
  const [patient, setPatient] = useState<PatientProfile>(() => {
    try {
      const saved = localStorage.getItem('memogram_patient_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) return parsed;
      }
    } catch {}
    return getDemoPatient();
  });
  const [caretaker, setCaretaker] = useState<CaretakerProfile>(() => {
    try {
      const saved = localStorage.getItem('memogram_caretaker_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) return parsed;
      }
    } catch {}
    return getDemoCaretaker();
  });
  const [assignedPatients, setAssignedPatients] = useState<RelationshipBackendResponse[]>([]);
  const [availablePatients, setAvailablePatients] = useState<PatientProfile[]>(() => getDemoPatients());
  const [activeRelationshipId, setActiveRelationshipId] = useState<string | undefined>();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() => {
    try {
      const saved = localStorage.getItem('memogram_family_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return getDemoFamilyMembers();
  });
  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const saved = localStorage.getItem('memogram_medications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return getDemoMedications();
  });
  const [hydrationSettings, setHydrationSettings] = useState<HydrationSettings>(() => {
    try {
      const saved = localStorage.getItem('memogram_hydration_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) return parsed;
      }
    } catch {}
    return getDemoHydrationSettings();
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem('memogram_appointments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return getDemoAppointments();
  });
  const [cognitiveMetrics, setCognitiveMetrics] = useState<CognitiveMetrics>(() => getDemoCognitiveMetrics());
  const [gameHistory, setGameHistory] = useState<GameScoreResult[]>(() => getDemoGameHistory());
  const [adaptiveDifficulties, setAdaptiveDifficulties] = useState<Record<GameId, 'easier' | 'standard' | 'challenging'>>({
    groceries: 'standard',
    routine: 'standard',
    cup_shuffle: 'standard',
    cultural_match: 'standard',
    family_stories: 'standard',
    memory_mosaic: 'standard',
    block_mind: 'standard',
  });
  const [alerts, setAlerts] = useState<AlertItem[]>(() => getDemoAlerts());
  const [stories, setStories] = useState<FamilyStory[]>(() => getDemoStories());

  // SOS state
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [sosAlertSent, setSosAlertSent] = useState(false);
  const [activeSosId, setActiveSosId] = useState<string | null>(null);

  // Speech & Voice
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>('');

  // Toasts
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const showToast = useCallback((message: string, type: ToastNotice['type'] = 'info', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync backend language registry on startup
  useEffect(() => {
    syncLanguagesFromBackend();
  }, []);

  // Listen to speech synthesis state
  useEffect(() => {
    const unsub = speechService.subscribeSpeaking((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => unsub();
  }, []);

  // Update HTML root class for accessibility
  useEffect(() => {
    const root = document.documentElement;
    if (accessibility.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    root.setAttribute('data-font-size', effectiveFontSize);
    root.setAttribute('lang', effectivePrimaryLanguage);
    if (typeof document !== 'undefined' && document.body) {
      document.body.setAttribute('data-font-size', effectiveFontSize);
    }
    try {
      localStorage.setItem('memogram_accessibility', JSON.stringify({
        ...accessibility,
        fontSize: effectiveFontSize,
      }));
    } catch {}
  }, [accessibility.theme, accessibility.highContrast, effectiveFontSize, effectivePrimaryLanguage]);

  // Comprehensive Backend Bootstrap & Data Fetching
  const refreshData = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setIsSyncing(true);
    try {
      // 1. Get current user profile
      const me = await authApi.getMe();
      setBackendConnected(true);

      // Determine patient ID to load
      let patientIdToLoad = isRealPatientId(patient.id) ? patient.id : '';

      if (me.role === 'PATIENT' && isRealPatientId(me.patient_id)) {
        patientIdToLoad = me.patient_id;
      } else if (me.role === 'CAREGIVER' || me.role === 'CARETAKER') {
        try {
          const caregiverProfile = await caretakersApi.getProfile();
          if (caregiverProfile) {
            const cgLang = caregiverProfile.preferred_language 
              ? backendToFrontendLang(caregiverProfile.preferred_language) 
              : undefined;
            const cgFont: FontSizeSetting | undefined = caregiverProfile.font_size === 'large' 
              ? 'large' 
              : caregiverProfile.font_size === 'extra-large' || caregiverProfile.font_size === 'extra_large' 
              ? 'extra-large' 
              : caregiverProfile.font_size === 'normal' || caregiverProfile.font_size === 'medium'
              ? 'normal'
              : undefined;

            if (cgLang) {
              setCaretakerLanguageState(cgLang);
              try { localStorage.setItem('memogram_caretaker_language', cgLang); } catch {}
            }
            if (cgFont) {
              setCaretakerFontSizeState(cgFont);
              try { localStorage.setItem('memogram_caretaker_font_size', cgFont); } catch {}
            }

            setCaretaker((prev) => ({
              ...prev,
              id: caregiverProfile.id || prev.id,
              name: caregiverProfile.user?.full_name || prev.name,
              email: caregiverProfile.user?.email || prev.email,
              phone: caregiverProfile.user?.phone || prev.phone,
              relationshipToPatient: caregiverProfile.relationship_with_patient || prev.relationshipToPatient,
              language: cgLang || prev.language,
              fontSize: cgFont || prev.fontSize,
            }));
          }

          const assigned = await caretakersApi.listAssignedPatients();
          setAssignedPatients(assigned);
          const realAssigned = assigned.filter((rel) => isRealPatientId(rel.patient_id));
          if (realAssigned.length > 0) {
            const mappedAvailable: PatientProfile[] = realAssigned.map((rel) => ({
              id: rel.patient_id,
              name: rel.patient_name || 'Patient',
              email: rel.patient_email || '',
              phone: '',
              age: 70,
              gender: 'other',
              photoUrl: '',
              primaryLanguage: 'as-IN',
              fallbackLanguage: 'hi-IN',
              fontSize: 'normal',
              caretakerId: rel.caretaker_id || caretaker.id || '',
              caretakerName: rel.caretaker_name || caretaker.name || '',
              emergencyContact: {
                name: caretaker.name || '',
                relationship: rel.relation_type || 'Caregiver',
                phone: caretaker.phone || '',
              },
              stepsToday: 0,
              stepGoal: 3000,
              waterConsumedToday: 0,
            }));
            setAvailablePatients(mappedAvailable);

            if (!isRealPatientId(patientIdToLoad) || !realAssigned.some((a) => a.patient_id === patientIdToLoad)) {
              patientIdToLoad = realAssigned[0].patient_id;
              setActiveRelationshipId(realAssigned[0].id);
            }
          } else {
            // Keep demo patients available for prototype presentation
            setAvailablePatients(getDemoPatients());
            patientIdToLoad = '';
          }
        } catch (e) {
          console.debug('[AppContext] Caretaker profile load skipped', e);
        }
      }

      // 2. Fetch Patient Profile & details ONLY if patient ID is a verified real backend ID
      if (isRealPatientId(patientIdToLoad)) {
        try {
          const patientData = await patientsApi.getPatient(patientIdToLoad);
          if (patientData) {
            const feLang = backendToFrontendLang(patientData.preferred_language || patientData.primary_language || 'as');
            const feFallback = backendToFrontendLang(patientData.fallback_language || 'en');

            const backendFontSize = patientData.font_size;
            const mappedFontSize: FontSizeSetting = 
              backendFontSize === 'large' ? 'large' :
              backendFontSize === 'extra_large' || backendFontSize === 'extra-large' ? 'extra-large' : 'normal';

            // Only hydrate patient preference states if current session is Patient
            if (me.role === 'PATIENT' || role === 'patient') {
              setPatientLanguageState(feLang);
              try { localStorage.setItem('memogram_patient_language', feLang); } catch {}
              setFallbackLanguageState(feFallback);

              setPatientFontSizeState(mappedFontSize);
              try { localStorage.setItem('memogram_patient_font_size', mappedFontSize); } catch {}

              setAccessibility((prev) => ({
                ...prev,
                fontSize: mappedFontSize,
                highContrast: patientData.accessibility_preferences?.high_contrast ?? prev.highContrast,
              }));
            }

            const waterConsumed = patientData.accessibility_preferences?.waterConsumedToday;
            const stepsTodayVal = patientData.accessibility_preferences?.stepsToday;

            setPatient((prev) => ({
              ...prev,
              id: patientData.id,
              name: patientData.user?.full_name || prev.name,
              email: patientData.user?.email || prev.email,
              phone: patientData.user?.phone || prev.phone,
              gender: (patientData.gender as any) || prev.gender,
              primaryLanguage: feLang,
              fallbackLanguage: feFallback,
              fontSize: mappedFontSize,
              waterConsumedToday: waterConsumed !== undefined ? waterConsumed : prev.waterConsumedToday,
              stepsToday: stepsTodayVal !== undefined ? stepsTodayVal : prev.stepsToday,
              accessibility_preferences: patientData.accessibility_preferences,
              emergencyContact: {
                name: patientData.emergency_contact_name || prev.emergencyContact.name,
                relationship: prev.emergencyContact.relationship,
                phone: patientData.emergency_contact_phone || prev.emergencyContact.phone,
              }
            }));
            if (patientData.accessibility_preferences?.hydration) {
              setHydrationSettings((prev) => ({
                ...prev,
                ...patientData.accessibility_preferences!.hydration,
              }));
            }
          }
        } catch (e) {
          console.debug('[AppContext] Patient detail fetch fallback to initial data', e);
        }

        // 3. Fetch Medicines for this real patient
        try {
          const backendMeds = await medicinesApi.listPatientMedicines(patientIdToLoad);
          if (Array.isArray(backendMeds)) {
            const mappedMeds: Medication[] = backendMeds.map((bm) => ({
              id: bm.id,
              name: bm.name,
              dosage: bm.dosage,
              scheduleTime: bm.time_of_day,
              frequency: bm.frequency || 'Daily',
              scheduledTimes: [bm.time_of_day],
              timeCategory: bm.time_of_day.toLowerCase().includes('am') ? 'morning' : 'evening',
              takenStatus: 'pending',
              instructions: bm.instructions || 'Take with water as directed.',
              remainingQuantity: bm.remaining_quantity,
              totalQuantity: bm.total_quantity,
              photoUrl: bm.photo_url || undefined,
            }));
            setMedications(mappedMeds);
          }
        } catch (e) {
          console.debug('[AppContext] Medicines list fallback', e);
        }

        // 4. Fetch Family Members for this real patient
        try {
          const backendFamily = await familyApi.listFamilyMembers(patientIdToLoad);
          if (Array.isArray(backendFamily)) {
            const mappedFamily: FamilyMember[] = backendFamily.map((bf) => ({
              id: bf.id,
              name: bf.name,
              relationship: bf.relation,
              phone: bf.phone || '',
              photoUrl: bf.photo_url || undefined,
              notes: bf.notes,
            }));
            setFamilyMembers(mappedFamily);
          }
        } catch (e) {
          console.debug('[AppContext] Family list fallback', e);
        }

        // 4b. Fetch Reminders (Hydration & Appointments)
        try {
          const backendReminders = await remindersApi.listPatientReminders(patientIdToLoad);
          if (Array.isArray(backendReminders)) {
            const hydrationRem = backendReminders.find((r) => r.reminder_type === 'HYDRATION');
            if (hydrationRem) {
              const intervalMatch = hydrationRem.recurrence_rule?.match(/INTERVAL_MINUTES=(\d+)/);
              const startMatch = hydrationRem.recurrence_rule?.match(/START=([^;]+)/);
              const endMatch = hydrationRem.recurrence_rule?.match(/END=([^;]+)/);
              const goalMatch = hydrationRem.recurrence_rule?.match(/GOAL=(\d+)/);

              setHydrationSettings((prev) => ({
                ...prev,
                dailyGoalGlasses: goalMatch ? Number(goalMatch[1]) : prev.dailyGoalGlasses,
                startTime: startMatch ? startMatch[1] : (hydrationRem.scheduled_time || prev.startTime),
                endTime: endMatch ? endMatch[1] : prev.endTime,
                reminderIntervalMinutes: intervalMatch ? Number(intervalMatch[1]) : prev.reminderIntervalMinutes,
                enabled: hydrationRem.is_active,
              }));
            }

            const appointmentRems = backendReminders.filter((r) => r.reminder_type === 'APPOINTMENT');
            if (appointmentRems.length > 0) {
              const mappedApts: Appointment[] = appointmentRems.map((ar) => {
                const dateMatch = ar.recurrence_rule?.match(/DATE=([^;]+)/);
                const hospitalMatch = ar.description?.match(/Hospital:\s*([^,\n]+)/i) || ar.title?.match(/at\s+(.+)$/i);
                const doctorMatch = ar.description?.match(/Doctor:\s*([^,\n]+)/i) || ar.title?.match(/with\s+(?:Dr\.\s*)?([^at]+)/i);

                return {
                  id: ar.id,
                  hospitalName: hospitalMatch ? hospitalMatch[1].trim() : 'Hospital',
                  doctorName: doctorMatch ? doctorMatch[1].trim() : 'Doctor',
                  date: dateMatch ? dateMatch[1] : (ar.created_at ? ar.created_at.split('T')[0] : '2026-09-25'),
                  time: ar.scheduled_time ? String(ar.scheduled_time) : '10:00 AM',
                  notes: ar.description,
                };
              });
              setAppointments(mappedApts);
            }
          }
        } catch (e) {
          console.debug('[AppContext] Reminders fetch fallback', e);
        }

        // 5. Fetch Cognitive Performance Overview
        try {
          const perf = await metricsApi.getPerformanceOverview(patientIdToLoad);
          if (perf) {
            setCognitiveMetrics((prev) => {
              const attentionCat = perf.categories.find((c) => c.category.toUpperCase().includes('ATTENTION'));
              const memoryCat = perf.categories.find((c) => c.category.toUpperCase().includes('MEMORY'));
              const patternCat = perf.categories.find((c) => c.category.toUpperCase().includes('PATTERN'));

              return {
                ...prev,
                overallScore: perf.overall_accuracy || prev.overallScore,
                sessionsCompleted: perf.total_sessions_completed || prev.sessionsCompleted,
                attention: attentionCat ? attentionCat.average_accuracy : prev.attention,
                memory: memoryCat ? memoryCat.average_accuracy : prev.memory,
                patternRecognition: patternCat ? patternCat.average_accuracy : prev.patternRecognition,
                trend: perf.overall_accuracy >= 75 ? 'improving' : perf.overall_accuracy >= 60 ? 'stable' : 'needs_attention',
              };
            });
          }
        } catch (e) {
          console.debug('[AppContext] Cognitive metrics fallback', e);
        }

        // 6. Fetch Notifications
        try {
          const notifs = await notificationsApi.listNotifications();
          if (Array.isArray(notifs) && notifs.length > 0) {
            const mappedAlerts: AlertItem[] = notifs.map((n) => ({
              id: n.id,
              title: n.title,
              message: n.body,
              time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: !n.is_read,
              priority: n.notification_type === 'SOS' ? 'urgent' : n.notification_type === 'MEDICATION' ? 'high' : 'normal',
              type: n.notification_type === 'MEDICATION' ? 'medication_reminder' : n.notification_type === 'SOS' ? 'sos_alert' : 'encouragement',
            }));
            setAlerts(mappedAlerts);
          }
        } catch (e) {
          console.debug('[AppContext] Notifications fallback', e);
        }
      } else {
        // When there is NO real backend patient ID yet:
        // Use existing demo data for display. Do NOT make patient-specific API requests.
        // The UI remains populated, complete, and polished.
        if (!isRealPatientId(patient.id)) {
          if (!patient.id || !patient.name) {
            setPatient(getDemoPatient());
          }
          if (medications.length === 0) {
            setMedications(getDemoMedications());
          }
          if (familyMembers.length === 0) {
            setFamilyMembers(getDemoFamilyMembers());
          }
          if (appointments.length === 0) {
            setAppointments(getDemoAppointments());
          }
          if (cognitiveMetrics.overallScore === 0) {
            setCognitiveMetrics(getDemoCognitiveMetrics());
          }
          if (gameHistory.length === 0) {
            setGameHistory(getDemoGameHistory());
          }
          if (alerts.length === 0) {
            setAlerts(getDemoAlerts());
          }
          if (stories.length === 0) {
            setStories(getDemoStories());
          }
        }
      }
    } catch (err) {
      console.debug('[AppContext] Backend offline or unauthenticated; running in local prototype mode.', err);
      setBackendConnected(false);
      // Ensure demo fallback is populated
      if (!isRealPatientId(patient.id)) {
        if (!patient.name) setPatient(getDemoPatient());
        if (medications.length === 0) setMedications(getDemoMedications());
        if (familyMembers.length === 0) setFamilyMembers(getDemoFamilyMembers());
        if (appointments.length === 0) setAppointments(getDemoAppointments());
        if (cognitiveMetrics.overallScore === 0) setCognitiveMetrics(getDemoCognitiveMetrics());
      }
    } finally {
      setIsSyncing(false);
    }
  }, [patient.id]);

  // Initial bootstrap when auth exists
  useEffect(() => {
    if (getAccessToken()) {
      refreshData();
    }
  }, [refreshData]);

  const navigateTo = (screen: ScreenId) => {
    speechService.stop();
    if (accessibility.soundEnabled) {
      speechService.playChime('gentle_click');
    }
    setScreenHistory((prev) => [...prev, screen]);
    setCurrentScreen(screen);
    try {
      localStorage.setItem('memogram_current_screen', screen);
    } catch {}
  };

  const goBack = () => {
    speechService.stop();
    if (screenHistory.length > 1) {
      const newHistory = [...screenHistory];
      newHistory.pop();
      const prevScreen = newHistory[newHistory.length - 1];
      setScreenHistory(newHistory);
      setCurrentScreen(prevScreen);
      try {
        localStorage.setItem('memogram_current_screen', prevScreen);
      } catch {}
    } else {
      const defaultTarget: ScreenId = role === 'caretaker' 
        ? (currentScreen === 'caretaker_setup' ? 'caretaker_auth' : 'caretaker_dashboard')
        : role === 'patient' 
        ? (currentScreen === 'patient_setup' ? 'patient_auth' : 'patient_home')
        : 'welcome';
      setCurrentScreen(defaultTarget);
      try {
        localStorage.setItem('memogram_current_screen', defaultTarget);
      } catch {}
    }
  };

  const setRole = (newRole: Role, targetScreen?: ScreenId) => {
    setRoleState(newRole);
    if (newRole) {
      try {
        localStorage.setItem('memogram_user_role', newRole === 'caretaker' ? 'CAREGIVER' : 'PATIENT');
      } catch {}
    } else {
      try {
        localStorage.removeItem('memogram_user_role');
        localStorage.removeItem('memogram_current_screen');
      } catch {}
      clearAuthTokens();
    }

    if (targetScreen) {
      navigateTo(targetScreen);
    } else if (newRole === 'caretaker') {
      navigateTo('caretaker_dashboard');
    } else if (newRole === 'patient') {
      navigateTo('patient_home');
    } else {
      navigateTo('welcome');
    }
  };

  const setCaretakerLanguage = async (lang: SupportedLanguageCode) => {
    setCaretakerLanguageState(lang);
    setCaretaker((prev) => {
      const updated = { ...prev, language: lang };
      try {
        localStorage.setItem('memogram_caretaker_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      localStorage.setItem('memogram_caretaker_language', lang);
    } catch {}

    if (getAccessToken()) {
      try {
        await caretakersApi.updateProfile({
          preferred_language: frontendToBackendLang(lang),
        });
      } catch (err) {
        console.debug('[AppContext] Caretaker language update offline fallback', err);
      }
    }

    const info = getLanguageInfo(lang);
    showToast(`Caretaker language set to ${info.name} (${info.nativeName})`, 'success');
  };

  const setCaretakerFontSize = async (size: FontSizeSetting) => {
    setCaretakerFontSizeState(size);
    setCaretaker((prev) => {
      const updated = { ...prev, fontSize: size };
      try {
        localStorage.setItem('memogram_caretaker_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      localStorage.setItem('memogram_caretaker_font_size', size);
    } catch {}

    if (getAccessToken()) {
      try {
        await caretakersApi.updateProfile({
          font_size: size,
        });
      } catch (err) {
        console.debug('[AppContext] Caretaker font size update offline fallback', err);
      }
    }
  };

  const setPatientLanguage = async (lang: SupportedLanguageCode) => {
    setPatientLanguageState(lang);
    setPatient((prev) => ({ ...prev, primaryLanguage: lang }));
    try {
      localStorage.setItem('memogram_patient_language', lang);
    } catch {}

    let pid = patient.id;
    if (!isRealPatientId(pid) && getAccessToken()) {
      try {
        const me = await authApi.getMe();
        if (me?.patient_id && isRealPatientId(me.patient_id)) pid = me.patient_id;
      } catch {}
    }

    if (isRealPatientId(pid)) {
      try {
        await patientsApi.updatePatient(pid, {
          primary_language: frontendToBackendLang(lang),
          preferred_language: frontendToBackendLang(lang),
        });
      } catch (err) {
        console.debug('[AppContext] Patient language update offline fallback', err);
      }
    }

    const info = getLanguageInfo(lang);
    if (!info.capabilities.tts || !info.capabilities.voiceInput) {
      showToast(
        `Voice support for ${info.name} is currently under development.`,
        'warning',
        'Language Capability'
      );
    } else {
      showToast(`Language set to ${info.name} (${info.nativeName})`, 'success');
    }
  };

  const setPatientFontSize = async (size: FontSizeSetting) => {
    setPatientFontSizeState(size);
    setPatient((prev) => ({ ...prev, fontSize: size }));
    try {
      localStorage.setItem('memogram_patient_font_size', size);
    } catch {}

    let pid = patient.id;
    if (!isRealPatientId(pid) && getAccessToken()) {
      try {
        const me = await authApi.getMe();
        if (me?.patient_id && isRealPatientId(me.patient_id)) pid = me.patient_id;
      } catch {}
    }

    if (isRealPatientId(pid)) {
      try {
        await patientsApi.updatePatient(pid, {
          font_size: size === 'normal' ? 'normal' : size,
          accessibility_preferences: {
            ...(patient as any).accessibility_preferences,
            fontSize: size,
          },
        });
      } catch (err) {
        console.debug('[AppContext] Patient font size update offline fallback', err);
      }
    }
  };

  const updateAccessibility = (settings: Partial<AccessibilitySettings>) => {
    if (settings.fontSize) {
      if (isCaretakerContext) {
        setCaretakerFontSize(settings.fontSize);
      } else {
        setPatientFontSize(settings.fontSize);
      }
    }
    setAccessibility((prev) => ({ ...prev, ...settings }));
  };

  const setPrimaryLanguage = async (lang: SupportedLanguageCode) => {
    if (isCaretakerContext) {
      await setCaretakerLanguage(lang);
    } else {
      await setPatientLanguage(lang);
    }
  };

  const setFallbackLanguage = async (lang: SupportedLanguageCode) => {
    setFallbackLanguageState(lang);
    setPatient((prev) => ({ ...prev, fallbackLanguage: lang }));
    if (isRealPatientId(patient.id)) {
      try {
        await patientsApi.updatePatient(patient.id, {
          fallback_language: frontendToBackendLang(lang),
        });
      } catch {}
    }
  };

  const updatePatient = async (data: Partial<PatientProfile>) => {
    const effectiveId = data.id || patient.id;
    if (isRealPatientId(effectiveId)) {
      try {
        const updatePayload: any = {};
        if (data.name) updatePayload.full_name = data.name;
        if (data.phone) updatePayload.phone = data.phone;
        if (data.gender) updatePayload.gender = data.gender;
        if (data.emergencyContact?.name) updatePayload.emergency_contact_name = data.emergencyContact.name;
        if (data.emergencyContact?.phone) updatePayload.emergency_contact_phone = data.emergencyContact.phone;

        const currentPrefs = patient.accessibility_preferences || {};
        const updatedPrefs = { ...currentPrefs };
        let hasPrefChanges = false;

        if (data.waterConsumedToday !== undefined) {
          updatedPrefs.waterConsumedToday = data.waterConsumedToday;
          hasPrefChanges = true;
        }
        if (data.stepsToday !== undefined) {
          updatedPrefs.stepsToday = data.stepsToday;
          hasPrefChanges = true;
        }
        if (data.accessibility_preferences) {
          Object.assign(updatedPrefs, data.accessibility_preferences);
          hasPrefChanges = true;
        }
        if (data.hydrationSettings) {
          updatedPrefs.hydration = data.hydrationSettings;
          hasPrefChanges = true;
        }
        if (hasPrefChanges) {
          updatePayload.accessibility_preferences = updatedPrefs;
        }

        if (Object.keys(updatePayload).length > 0 && isRealPatientId(patient.id)) {
          await patientsApi.updatePatient(patient.id, updatePayload);
        }

        // Only update confirmed state after successful API response
        setPatient((prev) => ({ ...prev, ...data }));
        setAvailablePatients((prev) => prev.map((p) => p.id === effectiveId ? { ...p, ...data } : p));
        if (isRealPatientId(patient.id)) {
          showToast('Patient profile updated', 'success');
        }
      } catch (err) {
        console.error('[AppContext] Failed to update patient on backend:', err);
        showToast('Failed to update patient on server', 'error');
      }
    } else {
      // Demo mode: update local demo state only
      setPatient((prev) => ({ ...prev, ...data }));
      setAvailablePatients((prev) => prev.map((p) => p.id === effectiveId ? { ...p, ...data } : p));
      showToast('Patient profile updated (Demo mode)', 'info');
    }
  };

  const selectPatient = async (patientId: string) => {
    if (!patientId) return;

    // Handle switching to a demo patient
    if (isDemoId(patientId)) {
      const target = availablePatients.find((p) => p.id === patientId) || getDemoPatient(patientId);
      if (!target) return;

      setPatient(target);
      const pSettings = target.hydrationSettings || target.accessibility_preferences?.hydration || getDemoHydrationSettings();
      setHydrationSettings(pSettings);

      setCognitiveMetrics(getDemoCognitiveMetrics(patientId));
      setGameHistory(getDemoGameHistory(patientId));
      setAppointments(target.appointments || getDemoAppointments());

      if (target.primaryLanguage) {
        setPatientLanguageState(target.primaryLanguage);
      }
      if (target.fontSize) {
        setPatientFontSizeState(target.fontSize);
      }

      showToast(`Switched patient to ${target.name} (Demo mode)`, 'info');
      return;
    }

    // Handle switching to a real backend patient
    const target = availablePatients.find((p) => p.id === patientId);
    if (!target) return;

    setPatient(target);

    // Sync hydration settings for newly selected patient
    const pSettings = target.hydrationSettings || target.accessibility_preferences?.hydration;
    if (pSettings) {
      setHydrationSettings(pSettings);
      try {
        localStorage.setItem('memogram_hydration_settings', JSON.stringify(pSettings));
      } catch {}
    }

    if (target.stepsToday !== undefined) {
      setCognitiveMetrics((prev) => ({
        ...prev,
        stepsToday: target.stepsToday,
        waterConsumedToday: target.waterConsumedToday,
      }));
    }

    if (target.appointments) {
      setAppointments(target.appointments);
    } else {
      setAppointments([]);
    }

    if (target.primaryLanguage) {
      setPatientLanguageState(target.primaryLanguage);
    }
    if (target.fontSize) {
      setPatientFontSizeState(target.fontSize);
    }

    // If backend connected and valid real ID, refresh real patient data
    if (backendConnected && isRealPatientId(patientId)) {
      try {
        const pData = await patientsApi.getPatient(patientId);
        if (pData) {
          const feLang = backendToFrontendLang(pData.preferred_language || pData.primary_language || 'as');
          const waterConsumed = pData.accessibility_preferences?.waterConsumedToday;
          const stepsTodayVal = pData.accessibility_preferences?.stepsToday;

          setPatient((prev) => ({
            ...prev,
            id: pData.id,
            name: pData.user?.full_name || prev.name,
            email: pData.user?.email || prev.email,
            phone: pData.user?.phone || prev.phone,
            primaryLanguage: feLang,
            waterConsumedToday: waterConsumed !== undefined ? waterConsumed : prev.waterConsumedToday,
            stepsToday: stepsTodayVal !== undefined ? stepsTodayVal : prev.stepsToday,
            accessibility_preferences: pData.accessibility_preferences,
          }));
          if (pData.accessibility_preferences?.hydration) {
            setHydrationSettings(pData.accessibility_preferences.hydration);
          }
        }

        // Reminders & Appointments
        try {
          const backendReminders = await remindersApi.listPatientReminders(patientId);
          if (Array.isArray(backendReminders)) {
            const appointmentRems = backendReminders.filter((r) => r.reminder_type === 'APPOINTMENT');
            if (appointmentRems.length > 0) {
              const mappedApts: Appointment[] = appointmentRems.map((ar) => {
                const dateMatch = ar.recurrence_rule?.match(/DATE=([^;]+)/);
                const hospitalMatch = ar.description?.match(/Hospital:\s*([^,\n]+)/i) || ar.title?.match(/at\s+(.+)$/i);
                const doctorMatch = ar.description?.match(/Doctor:\s*([^,\n]+)/i) || ar.title?.match(/with\s+(?:Dr\.\s*)?([^at]+)/i);

                return {
                  id: ar.id,
                  hospitalName: hospitalMatch ? hospitalMatch[1].trim() : 'Hospital',
                  doctorName: doctorMatch ? doctorMatch[1].trim() : 'Doctor',
                  date: dateMatch ? dateMatch[1] : (ar.created_at ? ar.created_at.split('T')[0] : '2026-09-25'),
                  time: ar.scheduled_time ? String(ar.scheduled_time) : '10:00 AM',
                  notes: ar.description,
                };
              });
              setAppointments(mappedApts);
            }
          }
        } catch (rErr) {
          console.debug('[AppContext] selectPatient reminders fetch fallback', rErr);
        }

        // Medicines
        try {
          const backendMeds = await medicinesApi.listPatientMedicines(patientId);
          if (Array.isArray(backendMeds)) {
            const mappedMeds: Medication[] = backendMeds.map((bm) => ({
              id: bm.id,
              name: bm.name,
              dosage: bm.dosage,
              scheduleTime: bm.time_of_day,
              frequency: bm.frequency || 'Daily',
              scheduledTimes: [bm.time_of_day],
              timeCategory: bm.time_of_day.toLowerCase().includes('am') ? 'morning' : 'evening',
              takenStatus: 'pending',
              instructions: bm.instructions || 'Take with water as directed.',
              remainingQuantity: bm.remaining_quantity,
              totalQuantity: bm.total_quantity,
              photoUrl: bm.photo_url || undefined,
            }));
            setMedications(mappedMeds);
          }
        } catch (mErr) {
          console.debug('[AppContext] selectPatient medicines fetch fallback', mErr);
        }

        // Family Members
        try {
          const backendFamily = await familyApi.listFamilyMembers(patientId);
          if (Array.isArray(backendFamily)) {
            const mappedFamily: FamilyMember[] = backendFamily.map((bf) => ({
              id: bf.id,
              name: bf.name,
              relationship: bf.relation,
              phone: bf.phone || '',
              photoUrl: bf.photo_url || undefined,
              notes: bf.notes,
            }));
            setFamilyMembers(mappedFamily);
          }
        } catch (fErr) {
          console.debug('[AppContext] selectPatient family fetch fallback', fErr);
        }

        // Performance Overview
        try {
          const perf = await metricsApi.getPerformanceOverview(patientId);
          if (perf) {
            setCognitiveMetrics((prev) => ({
              ...prev,
              overallScore: perf.overall_accuracy || prev.overallScore,
              sessionsCompleted: perf.total_sessions_completed || prev.sessionsCompleted,
            }));
          }
        } catch (pErr) {
          console.debug('[AppContext] selectPatient metrics fetch fallback', pErr);
        }
      } catch (err) {
        console.debug('[AppContext] selectPatient backend fetch fallback', err);
      }
    }
    showToast(`Switched patient to ${target.name}`, 'info');
  };

  const updateCaretaker = (data: Partial<CaretakerProfile>) => {
    setCaretaker((prev) => ({ ...prev, ...data }));
    showToast('Caregiver profile updated', 'success');
  };

  const addFamilyMember = async (member: Omit<FamilyMember, 'id'>) => {
    if (isRealPatientId(patient.id)) {
      try {
        const res = await familyApi.addFamilyMember(patient.id, {
          name: member.name,
          relation: member.relationship,
          photo_url: member.photoUrl,
          phone: member.phone,
          notes: member.notes,
        });
        if (res?.id) {
          const confirmedMember: FamilyMember = { ...member, id: res.id };
          setFamilyMembers((prev) => [...prev, confirmedMember]);
          showToast(`${member.name} added to family circle`, 'success');
        }
      } catch (err) {
        console.error('[FamilyApi] Failed to add family member on backend:', err);
        showToast(`Failed to add ${member.name} to server`, 'error');
      }
    } else {
      // Demo mode: update local state only
      const tempId = `fam-${Date.now()}`;
      const newMember: FamilyMember = { ...member, id: tempId };
      setFamilyMembers((prev) => [...prev, newMember]);
      showToast(`${member.name} added to family circle (Demo mode)`, 'info');
    }
  };

  const updateFamilyMember = async (id: string, data: Partial<FamilyMember>) => {
    if (isRealPatientId(patient.id) && !isDemoId(id)) {
      try {
        await familyApi.updateFamilyMember(id, {
          name: data.name,
          relation: data.relationship,
          phone: data.phone,
          notes: data.notes,
          photo_url: data.photoUrl,
        });
        setFamilyMembers((prev) => prev.map((m) => m.id === id ? { ...m, ...data } : m));
        showToast('Family member updated', 'success');
      } catch (err) {
        console.error('[FamilyApi] Failed to update family member on backend:', err);
        showToast('Failed to update family member on server', 'error');
      }
    } else {
      // Demo mode: update local state only
      setFamilyMembers((prev) => prev.map((m) => m.id === id ? { ...m, ...data } : m));
      showToast('Family member updated (Demo mode)', 'info');
    }
  };

  const deleteFamilyMember = async (id: string) => {
    if (isRealPatientId(patient.id) && !isDemoId(id)) {
      try {
        await familyApi.deleteFamilyMember(id);
        setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
        showToast('Family member removed', 'info');
      } catch (err) {
        console.error('[FamilyApi] Failed to delete family member on backend:', err);
        showToast('Failed to remove family member from server', 'error');
      }
    } else {
      // Demo mode: update local state only
      setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
      showToast('Family member removed (Demo mode)', 'info');
    }
  };

  const addMedication = async (med: Omit<Medication, 'id'>) => {
    if (isRealPatientId(patient.id)) {
      try {
        const res = await medicinesApi.createMedicine(patient.id, {
          name: med.name,
          dosage: med.dosage,
          time_of_day: med.scheduleTime,
          frequency: med.frequency || 'Daily',
          start_date: new Date().toISOString().split('T')[0],
          instructions: med.instructions,
          remaining_quantity: med.remainingQuantity,
          total_quantity: med.totalQuantity,
          photo_url: med.photoUrl,
        });
        if (res?.id) {
          const confirmedMed: Medication = { ...med, id: res.id };
          setMedications((prev) => [...prev, confirmedMed]);
          showToast(`Added ${med.name} to schedule`, 'success');
        }
      } catch (err) {
        console.error('[MedicinesApi] Failed to add medication on backend:', err);
        showToast(`Failed to add ${med.name} to server`, 'error');
      }
    } else {
      // Demo mode: update local state only
      const tempId = `med-${Date.now()}`;
      const newMed: Medication = { ...med, id: tempId };
      setMedications((prev) => [...prev, newMed]);
      showToast(`Added ${med.name} to schedule (Demo mode)`, 'info');
    }
  };

  const updateMedication = async (id: string, medData: Partial<Medication>) => {
    if (isRealPatientId(patient.id) && !isDemoId(id)) {
      try {
        await medicinesApi.updateMedicine(id, {
          name: medData.name,
          dosage: medData.dosage,
          time_of_day: medData.scheduleTime,
          frequency: medData.frequency,
          instructions: medData.instructions,
          remaining_quantity: medData.remainingQuantity,
          total_quantity: medData.totalQuantity,
          photo_url: medData.photoUrl,
        });
        setMedications((prev) => prev.map((m) => m.id === id ? { ...m, ...medData } : m));
        showToast('Medication details updated', 'success');
      } catch (err) {
        console.error('[MedicinesApi] Failed to update medication on backend:', err);
        showToast('Failed to update medication on server', 'error');
      }
    } else {
      // Demo mode: update local state only
      setMedications((prev) => prev.map((m) => m.id === id ? { ...m, ...medData } : m));
      showToast('Medication details updated (Demo mode)', 'info');
    }
  };

  const deleteMedication = async (id: string) => {
    if (isRealPatientId(patient.id) && !isDemoId(id)) {
      try {
        await medicinesApi.deleteMedicine(id);
        setMedications((prev) => prev.filter((m) => m.id !== id));
        showToast('Medication removed', 'info');
      } catch (err) {
        console.error('[MedicinesApi] Failed to delete medication on backend:', err);
        showToast('Failed to delete medication from server', 'error');
      }
    } else {
      // Demo mode: update local state only
      setMedications((prev) => prev.filter((m) => m.id !== id));
      showToast('Medication removed (Demo mode)', 'info');
    }
  };

  const markMedicationTaken = async (id: string) => {
    if (isRealPatientId(patient.id) && !isDemoId(id)) {
      try {
        await medicinesApi.recordAction(id, { action: 'TOOK_IT' }, patient.id);
        setMedications((prev) => prev.map((m) => {
          if (m.id === id) {
            const remaining = Math.max(0, m.remainingQuantity - 1);
            return {
              ...m,
              takenStatus: 'taken',
              takenAt: 'Just now',
              remainingQuantity: remaining,
            };
          }
          return m;
        }));
        if (accessibility.soundEnabled) speechService.playChime('success_bell');
        showToast('Marked as taken! Great job keeping up with your wellness.', 'success', 'Medicine Recorded');
      } catch (err) {
        console.error('[MedicinesApi] Failed to record medication action on backend:', err);
        showToast('Failed to record dose on server', 'error');
      }
    } else {
      // Demo mode: update local state only
      setMedications((prev) => prev.map((m) => {
        if (m.id === id) {
          const remaining = Math.max(0, m.remainingQuantity - 1);
          return {
            ...m,
            takenStatus: 'taken',
            takenAt: 'Just now',
            remainingQuantity: remaining,
          };
        }
        return m;
      }));
      if (accessibility.soundEnabled) speechService.playChime('success_bell');
      showToast('Marked as taken! (Demo mode)', 'success', 'Medicine Recorded');
    }
  };

  const snoozeMedication = async (id: string, minutes: number = 15) => {
    if (isRealPatientId(patient.id) && !isDemoId(id)) {
      try {
        await medicinesApi.recordAction(id, { action: 'REMIND_LATER', notes: `Snoozed ${minutes} minutes` }, patient.id);
        setMedications((prev) => prev.map((m) => {
          if (m.id === id) {
            return { ...m, takenStatus: 'snoozed', snoozedUntil: `In ${minutes} minutes` };
          }
          return m;
        }));
        if (accessibility.soundEnabled) speechService.playChime('reminder_chime');
        showToast(`Reminder set for ${minutes} minutes from now.`, 'info', 'Medicine Snoozed');
      } catch (err) {
        console.error('[MedicinesApi] Failed to snooze medication on backend:', err);
        showToast('Failed to snooze medication on server', 'error');
      }
    } else {
      // Demo mode: update local state only
      setMedications((prev) => prev.map((m) => {
        if (m.id === id) {
          return { ...m, takenStatus: 'snoozed', snoozedUntil: `In ${minutes} minutes` };
        }
        return m;
      }));
      if (accessibility.soundEnabled) speechService.playChime('reminder_chime');
      showToast(`Reminder set for ${minutes} minutes from now. (Demo mode)`, 'info', 'Medicine Snoozed');
    }
  };

  const formatTimeTo24h = (timeStr: string): string => {
    if (!timeStr) return '08:00:00';
    const trimmed = timeStr.trim();
    if (trimmed.includes('AM') || trimmed.includes('PM')) {
      const parts = trimmed.split(' ');
      const timePart = parts[0];
      const meridiem = parts[1]?.toUpperCase();
      const [hStr, mStr] = timePart.split(':');
      let hours = parseInt(hStr, 10) || 0;
      const mins = mStr || '00';
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${mins.padStart(2, '0')}:00`;
    }
    if (trimmed.length === 5) return `${trimmed}:00`;
    return trimmed;
  };

  const updateHydrationSettings = async (settings: Partial<HydrationSettings>) => {
    const updated: HydrationSettings = { ...hydrationSettings, ...settings };

    if (isRealPatientId(patient.id)) {
      try {
        await patientsApi.updatePatient(patient.id, {
          accessibility_preferences: {
            ...(patient.accessibility_preferences || {}),
            hydration: updated,
          },
        });
        const schedTime = formatTimeTo24h(updated.startTime);
        await remindersApi.createReminder(patient.id, {
          title: `Hydration Reminder (${updated.dailyGoalGlasses} ${updated.unit || 'glasses'}/day)`,
          description: `Goal: ${updated.dailyGoalGlasses} ${updated.unit || 'glasses'} between ${updated.startTime} and ${updated.endTime} every ${updated.reminderIntervalMinutes} mins`,
          reminder_type: 'HYDRATION',
          scheduled_time: schedTime,
          recurrence_rule: `INTERVAL_MINUTES=${updated.reminderIntervalMinutes};START=${updated.startTime};END=${updated.endTime};GOAL=${updated.dailyGoalGlasses};UNIT=${updated.unit || 'glasses'}`,
          is_active: updated.enabled ?? true,
        });

        setHydrationSettings(updated);
        setPatient((prev) => ({
          ...prev,
          hydrationSettings: updated,
          accessibility_preferences: {
            ...(prev.accessibility_preferences || {}),
            hydration: updated,
          },
        }));
        setAvailablePatients((prev) => prev.map((p) => p.id === patient.id ? {
          ...p,
          hydrationSettings: updated,
          accessibility_preferences: {
            ...(p.accessibility_preferences || {}),
            hydration: updated,
          },
        } : p));
        showToast('Hydration settings saved', 'success');
      } catch (err) {
        console.error('[Hydration] Failed to save hydration settings on backend:', err);
        showToast('Failed to save hydration settings to server', 'error');
      }
    } else {
      // Demo mode: update local state only
      setHydrationSettings(updated);
      setPatient((prev) => ({
        ...prev,
        hydrationSettings: updated,
        accessibility_preferences: {
          ...(prev.accessibility_preferences || {}),
          hydration: updated,
        },
      }));
      setAvailablePatients((prev) => prev.map((p) => p.id === patient.id ? {
        ...p,
        hydrationSettings: updated,
        accessibility_preferences: {
          ...(p.accessibility_preferences || {}),
          hydration: updated,
        },
      } : p));
      showToast('Hydration settings saved (Demo mode)', 'info');
    }
  };

  const addAppointment = async (apt: Omit<Appointment, 'id'>) => {
    if (isRealPatientId(patient.id)) {
      try {
        const schedTime = formatTimeTo24h(apt.time);
        const res = await remindersApi.createReminder(patient.id, {
          title: `Appointment with Dr. ${apt.doctorName} at ${apt.hospitalName}`,
          description: `Hospital: ${apt.hospitalName}, Doctor: ${apt.doctorName}, Notes: ${apt.notes || 'Consultation'}`,
          reminder_type: 'APPOINTMENT',
          scheduled_time: schedTime,
          recurrence_rule: `ONCE;DATE=${apt.date}`,
          is_active: true,
        });
        if (res?.id) {
          const confirmedApt: Appointment = { ...apt, id: res.id };
          setAppointments((prev) => {
            const updated = [...prev, confirmedApt];
            setPatient((p) => ({ ...p, appointments: updated }));
            setAvailablePatients((prevList) => prevList.map((p) => p.id === patient.id ? { ...p, appointments: updated } : p));
            return updated;
          });
          showToast(`Appointment with Dr. ${apt.doctorName} scheduled`, 'success');
        }
      } catch (err) {
        console.error('[Appointments] Failed to schedule appointment on backend:', err);
        showToast('Failed to schedule appointment on server', 'error');
      }
    } else {
      // Demo mode: update local state only
      const tempId = `apt-${Date.now()}`;
      const newApt: Appointment = { ...apt, id: tempId };
      setAppointments((prev) => {
        const updated = [...prev, newApt];
        setPatient((p) => ({ ...p, appointments: updated }));
        setAvailablePatients((prevList) => prevList.map((p) => p.id === patient.id ? { ...p, appointments: updated } : p));
        return updated;
      });
      showToast(`Appointment with Dr. ${apt.doctorName} scheduled (Demo mode)`, 'info');
    }
  };

  const updateAppointment = async (id: string, aptData: Partial<Omit<Appointment, 'id'>>) => {
    if (isRealPatientId(patient.id) && !isDemoId(id)) {
      try {
        const payload: ReminderUpdatePayload = {};
        if (aptData.doctorName || aptData.hospitalName) {
          const doc = aptData.doctorName || 'Doctor';
          const hosp = aptData.hospitalName || 'Hospital';
          payload.title = `Appointment with Dr. ${doc} at ${hosp}`;
          payload.description = `Hospital: ${hosp}, Doctor: ${doc}, Notes: ${aptData.notes || 'Consultation'}`;
        }
        if (aptData.time) {
          payload.scheduled_time = formatTimeTo24h(aptData.time);
        }
        if (aptData.date) {
          payload.recurrence_rule = `ONCE;DATE=${aptData.date}`;
        }
        await remindersApi.updateReminder(id, payload);
        setAppointments((prev) => {
          const updated = prev.map((a) => a.id === id ? { ...a, ...aptData } : a);
          setPatient((p) => ({ ...p, appointments: updated }));
          setAvailablePatients((prevList) => prevList.map((p) => p.id === patient.id ? { ...p, appointments: updated } : p));
          return updated;
        });
        showToast('Appointment updated', 'success');
      } catch (err) {
        console.error('[Appointments] Failed to update appointment on backend:', err);
        showToast('Failed to update appointment on server', 'error');
      }
    } else {
      // Demo mode: update local state only
      setAppointments((prev) => {
        const updated = prev.map((a) => a.id === id ? { ...a, ...aptData } : a);
        setPatient((p) => ({ ...p, appointments: updated }));
        setAvailablePatients((prevList) => prevList.map((p) => p.id === patient.id ? { ...p, appointments: updated } : p));
        return updated;
      });
      showToast('Appointment updated (Demo mode)', 'info');
    }
  };

  const deleteAppointment = async (id: string) => {
    if (isRealPatientId(patient.id) && !isDemoId(id)) {
      try {
        await remindersApi.deleteReminder(id);
        setAppointments((prev) => {
          const updated = prev.filter((a) => a.id !== id);
          setPatient((p) => ({ ...p, appointments: updated }));
          setAvailablePatients((prevList) => prevList.map((p) => p.id === patient.id ? { ...p, appointments: updated } : p));
          return updated;
        });
        showToast('Appointment removed', 'info');
      } catch (err) {
        console.error('[Appointments] Failed to delete reminder on backend:', err);
        showToast('Failed to remove appointment from server', 'error');
      }
    } else {
      // Demo mode: update local state only
      setAppointments((prev) => {
        const updated = prev.filter((a) => a.id !== id);
        setPatient((p) => ({ ...p, appointments: updated }));
        setAvailablePatients((prevList) => prevList.map((p) => p.id === patient.id ? { ...p, appointments: updated } : p));
        return updated;
      });
      showToast('Appointment removed (Demo mode)', 'info');
    }
  };

  const setAdaptiveDifficulty = (gameId: GameId, diff: 'easier' | 'standard' | 'challenging') => {
    setAdaptiveDifficulties((prev) => ({ ...prev, [gameId]: diff }));
  };

  const recordGameResult = (result: Omit<GameScoreResult, 'timestamp'>) => {
    const timestamp = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullResult: GameScoreResult = { ...result, timestamp };
    
    setGameHistory((prev) => [fullResult, ...prev]);
    
    setCognitiveMetrics((prev) => {
      const newPlayedToday = prev.gamesPlayedToday + 1;
      const newMinutes = prev.weeklyActivityMinutes + Math.round(result.timeSpentSeconds / 60);
      const newScore = Math.min(100, Math.round((prev.overallScore * 3 + result.score) / 4));
      return {
        ...prev,
        gamesPlayedToday: newPlayedToday,
        sessionsCompleted: prev.sessionsCompleted + 1,
        weeklyActivityMinutes: newMinutes,
        overallScore: newScore,
        lastPlayedAt: timestamp
      };
    });

    setAdaptiveDifficulty(result.gameId, result.nextDifficultyRecommendation);
  };

  const markAlertRead = async (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, unread: false } : a));
    if (!isDemoId(id)) {
      try {
        await notificationsApi.markAsRead(id);
      } catch {}
    }
  };

  const addAlert = (alert: Omit<AlertItem, 'id' | 'time'>) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newAlert: AlertItem = {
      ...alert,
      id: `alt-${Date.now()}`,
      time
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const addStory = (story: Omit<FamilyStory, 'id' | 'recordedAt'>) => {
    const newStory: FamilyStory = {
      ...story,
      id: `story-${Date.now()}`,
      recordedAt: 'Just now'
    };
    setStories((prev) => [newStory, ...prev]);
    showToast('Voice story saved to your family memories!', 'success', 'Story Saved');
  };

  const deleteStory = (id: string) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
    showToast('Story removed', 'info');
  };

  const openSosModal = () => {
    setSosAlertSent(false);
    setIsSosModalOpen(true);
    if (accessibility.soundEnabled) {
      speechService.playChime('warning');
    }
  };

  const closeSosModal = () => {
    setIsSosModalOpen(false);
    setSosAlertSent(false);
  };

  const triggerSosAlert = async () => {
    setSosAlertSent(true);
    if (accessibility.soundEnabled) {
      speechService.playChime('reminder_chime');
    }

    if (isRealPatientId(patient.id)) {
      try {
        const res = await sosApi.triggerSOS({
          patient_id: patient.id,
          message: 'Emergency SOS requested from patient application.',
        });
        if (res?.id) {
          setActiveSosId(res.id);
        }
        showToast('Alert notification sent to caregiver.', 'error', 'SOS Help Dispatched');
      } catch (err) {
        console.error('[SOSApi] Failed to trigger backend SOS:', err);
        showToast('Failed to dispatch SOS alert to server.', 'error');
      }
    } else {
      // Demo mode: update local UI without sending fake IDs to backend
      showToast('Alert notification sent to caregiver Priya Sharma (Demo mode).', 'error', 'SOS Help Dispatched');
    }
  };

  const resolveSosAlert = async (alertId?: string) => {
    const targetId = alertId || activeSosId;
    if (targetId && !isDemoId(targetId)) {
      try {
        await sosApi.resolveSOS(targetId);
        setActiveSosId(null);
        showToast('SOS Alert marked as resolved', 'success');
      } catch {}
    } else {
      setActiveSosId(null);
      showToast('SOS Alert marked as resolved (Demo mode)', 'success');
    }
  };

  // STRICT Speech Synthesis wrapper
  const speakText = (text: string) => {
    const res = speechService.speak(text, primaryLanguage);
    if (res.status === 'in_development') {
      showToast(
        res.message || `Voice support for this language is currently under development.`,
        'warning',
        'Voice Capability'
      );
    } else if (res.status === 'unsupported' || res.status === 'error') {
      showToast(res.message || 'Speech synthesis is currently unavailable.', 'warning');
    }
  };

  const stopSpeaking = () => {
    speechService.stop();
  };

  // Process voice interactions via backend /api/v1/voice/process
  const processVoiceAssistant = async (input: { transcript?: string; audioBase64?: string; audioContentType?: string }): Promise<VoiceProcessBackendResponse | null> => {
    if (isRealPatientId(patient.id)) {
      try {
        const res = await voiceApi.processVoice({
          patient_id: patient.id,
          language: frontendToBackendLang(primaryLanguage),
          transcript_text: input.transcript,
          audio_base64: input.audioBase64,
          audio_content_type: input.audioContentType,
        });

        if (res) {
          // If backend provided TTS audio, play it directly
          if (res.audio_base64) {
            speechService.playAudioBase64(res.audio_base64);
          } else if (res.audio_url) {
            speechService.playAudioUrl(res.audio_url);
          } else if (res.reply_text) {
            speakText(res.reply_text);
          }

          // Show friendly status if TTS is unavailable or in development
          if (!res.tts_available && (res.tts_status === 'UNAVAILABLE' || res.tts_status === 'IN_DEVELOPMENT')) {
            showToast(
              res.tts_message || `Voice playback for this language is currently unavailable.`,
              'info',
              'Voice Status'
            );
          }
        }
        return res;
      } catch (err) {
        console.debug('[VoiceApi] Offline fallback voice handler', err);
        return null;
      }
    }
    // In demo mode: never send fake patient ID to backend voice service
    return null;
  };

  // Voice recognition / tap to speak with real MediaRecorder audio capture
  const startVoiceListening = async (onResult?: (text: string) => void) => {
    const langInfo = getLanguageInfo(primaryLanguage);
    if (!langInfo.capabilities.voiceInput) {
      showToast(
        langInfo.capabilities.statusNote || `Voice support for ${langInfo.name} is currently unavailable.`,
        'warning',
        'Voice Assistant'
      );
      return;
    }

    setIsListening(true);
    setVoiceTranscript('');
    currentTranscriptRef.current = '';
    audioChunksRef.current = [];

    if (accessibility.soundEnabled) {
      speechService.playChime('gentle_click');
    }

    // 1. Microphone capture via MediaRecorder (supports all 8 languages on backend)
    let stream: MediaStream | null = null;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        let mimeType = 'audio/webm;codecs=opus';
        if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else {
            mimeType = '';
          }
        }

        const options = mimeType ? { mimeType } : undefined;
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const recordedChunks = audioChunksRef.current;
          if (recordedChunks.length > 0) {
            const recordedBlob = new Blob(recordedChunks, { type: recorder.mimeType || 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Audio = (reader.result as string)?.split(',')[1];
              if (base64Audio) {
                await processVoiceAssistant({
                  audioBase64: base64Audio,
                  audioContentType: recordedBlob.type || 'audio/webm',
                  transcript: currentTranscriptRef.current || undefined,
                });
              }
            };
            reader.readAsDataURL(recordedBlob);
          }
        };

        recorder.start(100);
      } catch (mediaErr) {
        console.warn('[VoiceInput] Microphone access not permitted or unavailable:', mediaErr);
      }
    }

    // 2. Parallel SpeechRecognition for real-time visual feedback when supported
    const SpeechRecognition = (window as unknown as { SpeechRecognition: any; webkitSpeechRecognition: any }).SpeechRecognition || 
                              (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = primaryLanguage;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = async (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setVoiceTranscript(transcript);
          currentTranscriptRef.current = transcript;
          if (event.results[current].isFinal) {
            if (onResult) onResult(transcript);
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
              setIsListening(false);
              await processVoiceAssistant({ transcript });
            } else {
              stopVoiceListening();
            }
          }
        };

        recognition.onerror = () => {
          // Continue recording audio even if browser SpeechRecognition doesn't support the language
        };

        recognition.onend = () => {
          // Keep state consistent
        };

        recognition.start();
      } catch {
        if (!stream) {
          simulateVoiceInput(onResult);
        }
      }
    } else if (!stream) {
      simulateVoiceInput(onResult);
    }
  };

  const simulateVoiceInput = (onResult?: (text: string) => void) => {
    const mockPhrases = [
      'I took my morning Donepezil medicine!',
      'Can you show me the Groceries shopping game?',
      'Tell me a happy memory about Shillong.',
      'What time is my afternoon medicine?',
      'I am feeling wonderful today!'
    ];
    const phrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
    
    let charIdx = 0;
    const interval = setInterval(() => {
      charIdx += 3;
      setVoiceTranscript(phrase.substring(0, charIdx));
      if (charIdx >= phrase.length) {
        clearInterval(interval);
        setTimeout(async () => {
          setIsListening(false);
          if (onResult) onResult(phrase);
          await processVoiceAssistant({ transcript: phrase });
        }, 500);
      }
    }, 80);
  };

  const stopVoiceListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentScreen,
        navigateTo,
        screenHistory,
        goBack,
        viewMode,
        setViewMode,
        backendConnected,
        isSyncing,
        refreshData,
        caretakerLanguage,
        caretakerFontSize,
        setCaretakerLanguage,
        setCaretakerFontSize,
        patientLanguage,
        patientFontSize,
        setPatientLanguage,
        setPatientFontSize,
        accessibility: {
          ...accessibility,
          fontSize: effectiveFontSize,
        },
        updateAccessibility,
        primaryLanguage: effectivePrimaryLanguage,
        fallbackLanguage,
        setPrimaryLanguage,
        setFallbackLanguage,
        patient,
        updatePatient,
        caretaker,
        updateCaretaker,
        assignedPatients,
        activeRelationshipId,
        availablePatients,
        selectPatient,
        familyMembers,
        addFamilyMember,
        updateFamilyMember,
        deleteFamilyMember,
        medications,
        addMedication,
        updateMedication,
        deleteMedication,
        markMedicationTaken,
        snoozeMedication,
        hydrationSettings,
        updateHydrationSettings,
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        cognitiveMetrics,
        gameHistory,
        adaptiveDifficulties,
        setAdaptiveDifficulty,
        recordGameResult,
        alerts,
        markAlertRead,
        addAlert,
        dismissAlert,
        stories,
        addStory,
        deleteStory,
        isSosModalOpen,
        openSosModal,
        closeSosModal,
        triggerSosAlert,
        resolveSosAlert,
        sosAlertSent,
        isSpeaking,
        isListening,
        speakText,
        stopSpeaking,
        startVoiceListening,
        stopVoiceListening,
        processVoiceAssistant,
        voiceTranscript,
        toasts,
        showToast,
        removeToast,
        t: tBound,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
