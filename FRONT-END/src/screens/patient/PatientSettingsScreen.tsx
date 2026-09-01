import React, { useState } from 'react';
import { 
  Globe, 
  Type, 
  Volume2, 
  Moon, 
  Sun, 
  Bell, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  Info, 
  FileText, 
  LogOut, 
  ChevronRight, 
  Sparkles,
  Mic,
  PhoneCall,
  ShieldAlert,
  Droplet,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { PatientBottomNav } from '../../components/layout/PatientBottomNav';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { LanguageSelectorModal } from '../../components/common/LanguageSelectorModal';
import { getLanguageInfo, t, frontendToBackendLang } from '../../services/languageCapabilities';
import { FontSizeSetting } from '../../types';
import { speechService } from '../../services/speechService';
import { authApi } from '../../api';

export const PatientSettingsScreen: React.FC = () => {
  const { 
    accessibility, 
    updateAccessibility, 
    primaryLanguage, 
    fallbackLanguage,
    setRole, 
    navigateTo, 
    patient,
    updatePatient,
    openSosModal,
    showToast 
  } = useApp();

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [activeHelpModal, setActiveHelpModal] = useState<string | null>(null);
  const [morningTime, setMorningTime] = useState('08:00 AM');
  const [eveningTime, setEveningTime] = useState('08:00 PM');
  const [hydrationAlertsEnabled, setHydrationAlertsEnabled] = useState(true);
  const [medAlertsEnabled, setMedAlertsEnabled] = useState(true);

  const langInfo = getLanguageInfo(primaryLanguage);

  const pageAudioIntro = "Settings and accessibility preferences. You can adjust text size, switch languages, test sound effects, or view help.";

  const handleFontSizeChange = async (size: FontSizeSetting) => {
    updateAccessibility({ fontSize: size });
    showToast(`Text size set to ${size === 'normal' ? 'Standard' : size === 'large' ? 'Large' : 'Extra Large'}`, 'info');
    
    // Save to backend if connected
    try {
      const { patientsApi } = await import('../../api');
      if (patient.id) {
        await patientsApi.updatePatient(patient.id, {
          font_size: size === 'normal' ? 'medium' : size,
        });
      }
    } catch {}
  };

  const handleTestChime = () => {
    speechService.playChime('success_bell');
    showToast('Testing gentle audio chime', 'info', 'Audio Test');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    setRole(null);
    navigateTo('welcome');
    showToast(t('settings_logout', primaryLanguage, fallbackLanguage), 'info');
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header title={t('settings_title', primaryLanguage, fallbackLanguage)} audioPrompt={pageAudioIntro} showSOS />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* 1. Language Preference */}
        <div 
          onClick={() => setIsLangModalOpen(true)}
          className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft flex items-center justify-between cursor-pointer hover:border-teal-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
              <Globe size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {t('step_language_title', primaryLanguage, fallbackLanguage)}
              </h3>
              <p className="text-xs text-stone-500">
                Current: <strong className="text-teal-700 dark:text-teal-300">{langInfo.nativeName} ({langInfo.name})</strong>
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-stone-400" />
        </div>

        {/* 2. Text / Font Size Preference */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
                <Type size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  {t('step_font_title', primaryLanguage, fallbackLanguage)}
                </h3>
                <p className="text-xs text-stone-500">Make letters larger and easier to read</p>
              </div>
            </div>

            <SpeakTextButton 
              textToSpeak="Text size settings. Tap Standard, Large, or Extra Large." 
              variant="icon-only" 
              size="sm" 
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {(['normal', 'large', 'extra-large'] as FontSizeSetting[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => handleFontSizeChange(f)}
                className={`py-3.5 px-2 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  accessibility.fontSize === f
                    ? 'border-teal-600 bg-teal-600 text-white font-extrabold shadow-md'
                    : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold hover:border-teal-300'
                }`}
              >
                <span className={`block ${
                  f === 'normal' ? 'text-sm' : f === 'large' ? 'text-base' : 'text-lg'
                }`}>
                  {f === 'normal' ? t('font_standard', primaryLanguage, fallbackLanguage) : f === 'large' ? t('font_large', primaryLanguage, fallbackLanguage) : t('font_extra_large', primaryLanguage, fallbackLanguage)}
                </span>
                <span className="text-[11px] opacity-80 font-bold">Aa</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Sound & Audio Cues */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
                <Volume2 size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  {t('settings_sound_cues', primaryLanguage, fallbackLanguage)}
                </h3>
                <p className="text-xs text-stone-500">Gentle chimes when you take medicine or complete games</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateAccessibility({ soundEnabled: !accessibility.soundEnabled })}
              className={`px-4 py-2 rounded-2xl font-extrabold text-xs transition-colors cursor-pointer ${
                accessibility.soundEnabled ? 'bg-teal-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              {accessibility.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
            <button
              type="button"
              onClick={handleTestChime}
              className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1"
            >
              <Sparkles size={13} />
              <span>Test Audio Chime</span>
            </button>
          </div>
        </div>

        {/* 4. Notifications & Hydration Alerts */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {t('settings_notifications', primaryLanguage, fallbackLanguage)}
              </h3>
              <p className="text-xs text-stone-500">Scheduled reminders for medicines and water</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">Medication Reminders</span>
              </div>
              <button
                type="button"
                onClick={() => setMedAlertsEnabled(!medAlertsEnabled)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                  medAlertsEnabled ? 'bg-teal-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600'
                }`}
              >
                {medAlertsEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <div className="flex items-center gap-2">
                <Droplet size={15} className="text-sky-600" />
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">Hydration Reminders</span>
              </div>
              <button
                type="button"
                onClick={() => setHydrationAlertsEnabled(!hydrationAlertsEnabled)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                  hydrationAlertsEnabled ? 'bg-sky-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600'
                }`}
              >
                {hydrationAlertsEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* 5. Time Management & Daily Routine */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {t('settings_time_mgmt', primaryLanguage, fallbackLanguage)}
              </h3>
              <p className="text-xs text-stone-500">Daytime schedule and resting hours</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
              <span className="text-stone-400 font-bold block text-[10px] uppercase">Morning Routine</span>
              <span className="font-extrabold text-sm text-teal-700 dark:text-teal-300 mt-0.5 block">{morningTime}</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
              <span className="text-stone-400 font-bold block text-[10px] uppercase">Evening Routine</span>
              <span className="font-extrabold text-sm text-teal-700 dark:text-teal-300 mt-0.5 block">{eveningTime}</span>
            </div>
          </div>
          <p className="text-[11px] text-stone-400 italic">
            Quiet resting hours are active from 10:00 PM to 7:00 AM.
          </p>
        </div>

        {/* 6. Device Permissions */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {t('settings_device_perms', primaryLanguage, fallbackLanguage)}
              </h3>
              <p className="text-xs text-stone-500">App capabilities on this device</p>
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <div className="flex items-center gap-2">
                <Mic size={16} className="text-teal-600" />
                <span className="font-medium text-stone-800 dark:text-stone-200">Microphone for Voice Input</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">Active</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-teal-600" />
                <span className="font-medium text-stone-800 dark:text-stone-200">Audio Speaker Output</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">Active</span>
            </div>
          </div>
        </div>

        {/* 7. Help & Caregiver Contact */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
              <HelpCircle size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {t('settings_help_support', primaryLanguage, fallbackLanguage)}
              </h3>
              <p className="text-xs text-stone-500">Contact {patient.emergencyContact.name || 'Caregiver'} or trigger SOS</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => showToast(`Calling ${patient.emergencyContact.name}... (Simulated)`, 'info')}
              className="py-3 px-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 text-teal-800 dark:text-teal-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
            >
              <PhoneCall size={14} />
              <span>Call Caregiver</span>
            </button>

            <button
              type="button"
              onClick={openSosModal}
              className="py-3 px-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
            >
              <ShieldAlert size={14} />
              <span>Emergency SOS</span>
            </button>
          </div>
        </div>

        {/* 8. About Memogram */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-2">
          <div className="flex items-center gap-2">
            <Info size={18} className="text-teal-600" />
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
              {t('settings_about', primaryLanguage, fallbackLanguage)}
            </h3>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed font-medium">
            Memogram v1.0.0 • Cognitive Wellness & Medication Companion for elders.
          </p>
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 font-medium">
            <strong>Important Notice:</strong> Memogram activities and games are cognitive exercises for daily engagement. They do not constitute a medical diagnosis or medical device.
          </div>
        </div>

        {/* 9. Terms & Privacy */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                {t('settings_terms', primaryLanguage, fallbackLanguage)}
              </h3>
              <p className="text-xs text-stone-500">Your health data is protected & confidential</p>
            </div>
          </div>
          <CheckCircle2 size={18} className="text-teal-600" />
        </div>

        {/* 10. Logout */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3.5 px-6 rounded-3xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            <span>{t('settings_logout', primaryLanguage, fallbackLanguage)}</span>
          </button>
        </div>

      </div>

      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />

      <PatientBottomNav />
    </div>
  );
};
