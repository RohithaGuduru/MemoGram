import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  FontSizeSetting
} from '../types';
import { 
  INITIAL_PATIENT, 
  INITIAL_CARETAKER, 
  INITIAL_FAMILY_MEMBERS, 
  INITIAL_MEDICATIONS, 
  INITIAL_COGNITIVE_METRICS,
  INITIAL_ALERTS,
  INITIAL_STORIES,
  INITIAL_GAME_HISTORY
} from '../services/mockData';
import { speechService } from '../services/speechService';
import { 
  getLanguageInfo, 
  syncLanguagesFromBackend, 
  frontendToBackendLang, 
  backendToFrontendLang 
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
  VoiceProcessBackendResponse
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
  setRole: (role: Role) => void;
  currentScreen: ScreenId;
  navigateTo: (screen: ScreenId) => void;
  screenHistory: ScreenId[];
  goBack: () => void;

  // View presentation mode (for demo)
  viewMode: 'device_frame' | 'responsive';
  setViewMode: (mode: 'device_frame' | 'responsive') => void;

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
  processVoiceAssistant: (textOrAudio: { transcript?: string; audioBase64?: string }) => Promise<VoiceProcessBackendResponse | null>;
  voiceTranscript: string;

  // Toast / System Notices
  toasts: ToastNotice[];
  showToast: (message: string, type?: ToastNotice['type'], title?: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation & Role
  const [role, setRoleState] = useState<Role>(() => {
    const savedRole = localStorage.getItem('memogram_user_role');
    if (savedRole === 'CAREGIVER' || savedRole === 'CARETAKER') return 'caretaker';
    if (savedRole === 'PATIENT') return 'patient';
    return null;
  });
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('welcome');
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>(['welcome']);

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

  // Language
  const [primaryLanguage, setPrimaryLanguageState] = useState<SupportedLanguageCode>('en-IN');
  const [fallbackLanguage, setFallbackLanguageState] = useState<SupportedLanguageCode>('hi-IN');

  // Profiles & Data
  const [patient, setPatient] = useState<PatientProfile>(INITIAL_PATIENT);
  const [caretaker, setCaretaker] = useState<CaretakerProfile>(INITIAL_CARETAKER);
  const [assignedPatients, setAssignedPatients] = useState<RelationshipBackendResponse[]>([]);
  const [activeRelationshipId, setActiveRelationshipId] = useState<string | undefined>();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(INITIAL_FAMILY_MEMBERS);
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [cognitiveMetrics, setCognitiveMetrics] = useState<CognitiveMetrics>(INITIAL_COGNITIVE_METRICS);
  const [gameHistory, setGameHistory] = useState<GameScoreResult[]>(INITIAL_GAME_HISTORY);
  const [adaptiveDifficulties, setAdaptiveDifficulties] = useState<Record<GameId, 'easier' | 'standard' | 'challenging'>>({
    groceries: 'standard',
    routine: 'standard',
    cup_shuffle: 'standard',
    cultural_match: 'standard',
    family_stories: 'standard',
  });
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [stories, setStories] = useState<FamilyStory[]>(INITIAL_STORIES);

  // SOS state
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [sosAlertSent, setSosAlertSent] = useState(false);
  const [activeSosId, setActiveSosId] = useState<string | null>(null);

  // Speech & Voice
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

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

    root.setAttribute('data-font-size', accessibility.fontSize);
    try {
      localStorage.setItem('memogram_accessibility', JSON.stringify(accessibility));
    } catch {}
  }, [accessibility]);

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
      let patientIdToLoad = patient.id;

      if (me.role === 'PATIENT' && me.patient_id) {
        patientIdToLoad = me.patient_id;
      } else if (me.role === 'CAREGIVER' || me.role === 'CARETAKER') {
        try {
          const caregiverProfile = await caretakersApi.getProfile();
          if (caregiverProfile) {
            setCaretaker((prev) => ({
              ...prev,
              name: caregiverProfile.user?.full_name || prev.name,
              email: caregiverProfile.user?.email || prev.email,
              phone: caregiverProfile.user?.phone || prev.phone,
              relationshipToPatient: caregiverProfile.relationship_with_patient || prev.relationshipToPatient,
            }));
          }

          const assigned = await caretakersApi.listAssignedPatients();
          setAssignedPatients(assigned);
          if (assigned.length > 0 && assigned[0].patient_id) {
            patientIdToLoad = assigned[0].patient_id;
            setActiveRelationshipId(assigned[0].id);
          }
        } catch (e) {
          console.debug('[AppContext] Caretaker profile load skipped', e);
        }
      }

      // 2. Fetch Patient Profile & details if patient ID is valid
      if (patientIdToLoad) {
        try {
          const patientData = await patientsApi.getPatient(patientIdToLoad);
          if (patientData) {
            const feLang = backendToFrontendLang(patientData.preferred_language || patientData.primary_language || 'as');
            const feFallback = backendToFrontendLang(patientData.fallback_language || 'en');
            
            setPrimaryLanguageState(feLang);
            setFallbackLanguageState(feFallback);

            // Hydrate font size & accessibility preferences
            const backendFontSize = patientData.font_size;
            const mappedFontSize: FontSizeSetting = 
              backendFontSize === 'large' ? 'large' :
              backendFontSize === 'extra_large' || backendFontSize === 'extra-large' ? 'extra-large' : 'normal';

            setAccessibility((prev) => ({
              ...prev,
              fontSize: mappedFontSize,
              highContrast: patientData.accessibility_preferences?.high_contrast ?? prev.highContrast,
            }));

            setPatient((prev) => ({
              ...prev,
              id: patientData.id,
              name: patientData.user?.full_name || prev.name,
              email: patientData.user?.email || prev.email,
              phone: patientData.user?.phone || prev.phone,
              gender: (patientData.gender as any) || prev.gender,
              primaryLanguage: feLang,
              fallbackLanguage: feFallback,
              accessibility_preferences: patientData.accessibility_preferences,
              emergencyContact: {
                name: patientData.emergency_contact_name || prev.emergencyContact.name,
                relationship: prev.emergencyContact.relationship,
                phone: patientData.emergency_contact_phone || prev.emergencyContact.phone,
              }
            }));
          }
        } catch (e) {
          console.debug('[AppContext] Patient detail fetch fallback to initial data', e);
        }

        // 3. Fetch Medicines for this patient
        try {
          const backendMeds = await medicinesApi.listPatientMedicines(patientIdToLoad);
          if (Array.isArray(backendMeds) && backendMeds.length > 0) {
            const mappedMeds: Medication[] = backendMeds.map((bm) => ({
              id: bm.id,
              name: bm.name,
              dosage: bm.dosage,
              scheduleTime: bm.time_of_day,
              timeCategory: bm.time_of_day.toLowerCase().includes('am') ? 'morning' : 'evening',
              takenStatus: 'pending',
              instructions: bm.instructions || 'Take with water as directed.',
              remainingQuantity: bm.remaining_quantity,
              totalQuantity: bm.total_quantity,
              photoUrl: bm.photo_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80',
            }));
            setMedications(mappedMeds);
          }
        } catch (e) {
          console.debug('[AppContext] Medicines list fallback', e);
        }

        // 4. Fetch Family Members
        try {
          const backendFamily = await familyApi.listFamilyMembers(patientIdToLoad);
          if (Array.isArray(backendFamily) && backendFamily.length > 0) {
            const mappedFamily: FamilyMember[] = backendFamily.map((bf) => ({
              id: bf.id,
              name: bf.name,
              relationship: bf.relation,
              phone: bf.phone || '',
              photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              notes: bf.notes,
            }));
            setFamilyMembers(mappedFamily);
          }
        } catch (e) {
          console.debug('[AppContext] Family list fallback', e);
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
      }
    } catch (err) {
      console.debug('[AppContext] Backend offline or unauthenticated; running in local prototype mode.', err);
      setBackendConnected(false);
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
  };

  const goBack = () => {
    speechService.stop();
    if (screenHistory.length > 1) {
      const newHistory = [...screenHistory];
      newHistory.pop();
      const prevScreen = newHistory[newHistory.length - 1];
      setScreenHistory(newHistory);
      setCurrentScreen(prevScreen);
    } else {
      if (role === 'caretaker') {
        setCurrentScreen('caretaker_dashboard');
      } else if (role === 'patient') {
        setCurrentScreen('patient_home');
      } else {
        setCurrentScreen('welcome');
      }
    }
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole === 'caretaker') {
      navigateTo('caretaker_dashboard');
    } else if (newRole === 'patient') {
      navigateTo('patient_home');
    } else {
      clearAuthTokens();
      navigateTo('welcome');
    }
  };

  const updateAccessibility = (settings: Partial<AccessibilitySettings>) => {
    setAccessibility((prev) => ({ ...prev, ...settings }));
  };

  const setPrimaryLanguage = async (lang: SupportedLanguageCode) => {
    setPrimaryLanguageState(lang);
    setPatient((prev) => ({ ...prev, primaryLanguage: lang }));

    // Persist to backend if patient profile exists
    if (patient.id) {
      try {
        await patientsApi.updatePatient(patient.id, {
          primary_language: frontendToBackendLang(lang),
        });
      } catch {}
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

  const setFallbackLanguage = async (lang: SupportedLanguageCode) => {
    setFallbackLanguageState(lang);
    setPatient((prev) => ({ ...prev, fallbackLanguage: lang }));
    if (patient.id) {
      try {
        await patientsApi.updatePatient(patient.id, {
          fallback_language: frontendToBackendLang(lang),
        });
      } catch {}
    }
  };

  const updatePatient = async (data: Partial<PatientProfile>) => {
    setPatient((prev) => ({ ...prev, ...data }));
    if (patient.id) {
      try {
        await patientsApi.updatePatient(patient.id, {
          gender: data.gender,
          emergency_contact_name: data.emergencyContact?.name,
          emergency_contact_phone: data.emergencyContact?.phone,
        });
      } catch {}
    }
    showToast('Patient profile updated', 'success');
  };

  const updateCaretaker = (data: Partial<CaretakerProfile>) => {
    setCaretaker((prev) => ({ ...prev, ...data }));
    showToast('Caregiver profile updated', 'success');
  };

  const addFamilyMember = async (member: Omit<FamilyMember, 'id'>) => {
    const tempId = `fam-${Date.now()}`;
    const newMember: FamilyMember = { ...member, id: tempId };
    setFamilyMembers((prev) => [...prev, newMember]);

    if (patient.id) {
      try {
        const res = await familyApi.addFamilyMember(patient.id, {
          name: member.name,
          relation: member.relationship,
          phone: member.phone,
          notes: member.notes,
        });
        if (res?.id) {
          setFamilyMembers((prev) => prev.map((m) => m.id === tempId ? { ...m, id: res.id } : m));
        }
      } catch (err) {
        console.debug('[FamilyApi] Fallback to local state', err);
      }
    }
    showToast(`${member.name} added to family circle`, 'success');
  };

  const updateFamilyMember = async (id: string, data: Partial<FamilyMember>) => {
    setFamilyMembers((prev) => prev.map((m) => m.id === id ? { ...m, ...data } : m));
    try {
      await familyApi.updateFamilyMember(id, {
        name: data.name,
        relation: data.relationship,
        phone: data.phone,
        notes: data.notes,
      });
    } catch {}
    showToast('Family member updated', 'success');
  };

  const deleteFamilyMember = async (id: string) => {
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
    try {
      await familyApi.deleteFamilyMember(id);
    } catch {}
    showToast('Family member removed', 'info');
  };

  const addMedication = async (med: Omit<Medication, 'id'>) => {
    const tempId = `med-${Date.now()}`;
    const newMed: Medication = { ...med, id: tempId };
    setMedications((prev) => [...prev, newMed]);

    if (patient.id) {
      try {
        const res = await medicinesApi.createMedicine(patient.id, {
          name: med.name,
          dosage: med.dosage,
          time_of_day: med.scheduleTime,
          instructions: med.instructions,
          remaining_quantity: med.remainingQuantity,
          total_quantity: med.totalQuantity,
          photo_url: med.photoUrl,
        });
        if (res?.id) {
          setMedications((prev) => prev.map((m) => m.id === tempId ? { ...m, id: res.id } : m));
        }
      } catch (err) {
        console.debug('[MedicinesApi] Fallback to local state', err);
      }
    }
    showToast(`Added ${med.name} to schedule`, 'success');
  };

  const updateMedication = async (id: string, medData: Partial<Medication>) => {
    setMedications((prev) => prev.map((m) => m.id === id ? { ...m, ...medData } : m));
    try {
      await medicinesApi.updateMedicine(id, {
        name: medData.name,
        dosage: medData.dosage,
        time_of_day: medData.scheduleTime,
        instructions: medData.instructions,
        remaining_quantity: medData.remainingQuantity,
        photo_url: medData.photoUrl,
      });
    } catch {}
    showToast('Medication details updated', 'success');
  };

  const deleteMedication = async (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    try {
      await medicinesApi.deleteMedicine(id);
    } catch {}
    showToast('Medication removed', 'info');
  };

  const markMedicationTaken = async (id: string) => {
    setMedications((prev) => prev.map((m) => {
      if (m.id === id) {
        const remaining = Math.max(0, m.remainingQuantity - 1);
        return {
          ...m,
          takenStatus: 'taken',
          takenAt: 'Just now',
          remainingQuantity: remaining
        };
      }
      return m;
    }));

    try {
      await medicinesApi.recordAction(id, { action: 'TOOK_IT' }, patient.id);
    } catch (err) {
      console.debug('[MedicinesApi] Action recorded locally', err);
    }

    if (accessibility.soundEnabled) {
      speechService.playChime('success_bell');
    }
    showToast('Marked as taken! Great job keeping up with your wellness.', 'success', 'Medicine Recorded');
  };

  const snoozeMedication = async (id: string, minutes: number = 15) => {
    setMedications((prev) => prev.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          takenStatus: 'snoozed',
          snoozedUntil: `In ${minutes} minutes`
        };
      }
      return m;
    }));

    try {
      await medicinesApi.recordAction(id, { action: 'REMIND_LATER', notes: `Snoozed ${minutes} minutes` }, patient.id);
    } catch (err) {
      console.debug('[MedicinesApi] Snooze recorded locally', err);
    }

    if (accessibility.soundEnabled) {
      speechService.playChime('reminder_chime');
    }
    showToast(`Reminder set for ${minutes} minutes from now.`, 'info', 'Medicine Snoozed');
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
    try {
      await notificationsApi.markAsRead(id);
    } catch {}
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

    try {
      const res = await sosApi.triggerSOS({
        patient_id: patient.id,
        message: 'Emergency SOS requested from patient application.',
      });
      if (res?.id) {
        setActiveSosId(res.id);
      }
    } catch (err) {
      console.debug('[SOSApi] Fallback to simulated alert dispatch', err);
    }

    showToast('Alert notification sent to caregiver Priya Sharma.', 'error', 'SOS Help Dispatched');
  };

  const resolveSosAlert = async (alertId?: string) => {
    const targetId = alertId || activeSosId;
    if (targetId) {
      try {
        await sosApi.resolveSOS(targetId);
        setActiveSosId(null);
        showToast('SOS Alert marked as resolved', 'success');
      } catch {}
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
  const processVoiceAssistant = async (input: { transcript?: string; audioBase64?: string }): Promise<VoiceProcessBackendResponse | null> => {
    try {
      const res = await voiceApi.processVoice({
        patient_id: patient.id,
        language: frontendToBackendLang(primaryLanguage),
        transcript_text: input.transcript,
        audio_base64: input.audioBase64,
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

        // Show friendly status if TTS is in development
        if (!res.tts_available && res.tts_status === 'IN_DEVELOPMENT') {
          showToast(
            res.tts_message || `Voice playback for this language is currently in development.`,
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
  };

  // Voice recognition / tap to speak
  const startVoiceListening = (onResult?: (text: string) => void) => {
    const langInfo = getLanguageInfo(primaryLanguage);
    if (!langInfo.capabilities.voiceInput) {
      showToast(
        `Voice support for ${langInfo.name} is currently under development.`,
        'warning',
        'Voice Assistant'
      );
      return;
    }

    setIsListening(true);
    setVoiceTranscript('');

    if (accessibility.soundEnabled) {
      speechService.playChime('gentle_click');
    }

    const SpeechRecognition = (window as unknown as { SpeechRecognition: any; webkitSpeechRecognition: any }).SpeechRecognition || 
                              (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = primaryLanguage;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = async (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setVoiceTranscript(transcript);
          if (event.results[current].isFinal) {
            setIsListening(false);
            if (onResult) onResult(transcript);
            await processVoiceAssistant({ transcript });
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch {
        simulateVoiceInput(onResult);
      }
    } else {
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
        accessibility,
        updateAccessibility,
        primaryLanguage,
        fallbackLanguage,
        setPrimaryLanguage,
        setFallbackLanguage,
        patient,
        updatePatient,
        caretaker,
        updateCaretaker,
        assignedPatients,
        activeRelationshipId,
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
