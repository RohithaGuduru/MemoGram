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
import { LANGUAGE_LIST, getLanguageInfo, t, frontendToBackendLang } from '../../services/languageCapabilities';
import { FontSizeSetting, SupportedLanguageCode } from '../../types';
import { speechService } from '../../services/speechService';
import { authApi } from '../../api';

export const PatientSettingsScreen: React.FC = () => {
  const { 
    accessibility, 
    updateAccessibility, 
    patientLanguage,
    setPatientLanguage,
    patientFontSize,
    setPatientFontSize,
    primaryLanguage, 
    fallbackLanguage,
    setRole, 
    navigateTo, 
    patient,
    updatePatient,
    openSosModal,
    showToast,
    t 
  } = useApp();

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [activeHelpModal, setActiveHelpModal] = useState<string | null>(null);
  const [morningTime, setMorningTime] = useState('08:00 AM');
  const [eveningTime, setEveningTime] = useState('08:00 PM');
  const [hydrationAlertsEnabled, setHydrationAlertsEnabled] = useState(true);
  const [medAlertsEnabled, setMedAlertsEnabled] = useState(true);

  const currentLang = patientLanguage || primaryLanguage;
  const langInfo = getLanguageInfo(currentLang);

  const pageAudioIntro = "Settings and accessibility preferences. You can adjust text size, switch languages, test sound effects, or view help.";

  const handleLanguageChange = async (code: SupportedLanguageCode) => {
    await setPatientLanguage(code);
  };

  const handleFontSizeChange = async (size: FontSizeSetting) => {
    await setPatientFontSize(size);
    showToast(`Text size set to ${size === 'normal' ? 'Normal' : size === 'large' ? 'Large' : 'Extra Large'}`, 'info');
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
    showToast(t('settings_logout'), 'info');
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header title={t('settings_title')} audioPrompt={pageAudioIntro} showSOS />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Patient Language & Visual Accessibility Preferences Section */}
        <div className="bg-teal-50/80 dark:bg-teal-950/40 p-4 sm:p-5 rounded-3xl border border-teal-200/80 dark:border-teal-800/60 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-600 text-white mt-0.5 shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-teal-950 dark:text-teal-200">
                {t('setup_welcome_title')}
              </h2>
              <p className="text-xs text-teal-900/80 dark:text-teal-300 font-medium mt-1 leading-relaxed">
                {t('setup_welcome_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* 1. Preferred Language (8 Supported) */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
                <Globe size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  {t('preferred_language_title')}
                </h3>
                <p className="text-xs text-stone-500">
                  Current: <strong className="text-teal-700 dark:text-teal-300">{langInfo.nativeName} ({langInfo.name})</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLangModalOpen(true)}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              {t('all_options')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {LANGUAGE_LIST.map((lang) => {
              const isSelected = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-3 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 shadow-xs'
                      : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 hover:border-teal-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                        {lang.nativeName}
                      </span>
                      <span className="text-xs text-stone-400 font-medium">({lang.name})</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {lang.region}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-teal-600 text-white' : 'border border-stone-300 dark:border-stone-600'
                  }`}>
                    {isSelected && <CheckCircle2 size={13} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Text Size Preference */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
                <Type size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  {t('step_font_title')}
                </h3>
                <p className="text-xs text-stone-500">{t('text_size_subtitle')}</p>
              </div>
            </div>

            <SpeakTextButton 
              textToSpeak="Text size settings. Tap Normal, Large, or Extra Large." 
              variant="icon-only" 
              size="sm" 
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {(['normal', 'large', 'extra-large'] as FontSizeSetting[]).map((f) => {
              const isSelected = (patientFontSize || 'normal') === f;
              const label = f === 'normal' 
                ? t('font_standard') 
                : f === 'large' 
                  ? t('font_large') 
                  : t('font_extra_large');
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFontSizeChange(f)}
                  className={`py-3.5 px-2 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 bg-teal-600 text-white font-extrabold shadow-md'
                      : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold hover:border-teal-300'
                  }`}
                >
                  <span className={`block ${
                    f === 'normal' ? 'text-sm' : f === 'large' ? 'text-base' : 'text-lg'
                  }`}>
                    {label}
                  </span>
                  <span className="text-[11px] opacity-80 font-bold">Aa</span>
                </button>
              );
            })}
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
                  {t('settings_sound_cues')}
                </h3>
                <p className="text-xs text-stone-500">{t('sound_cues_desc')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateAccessibility({ soundEnabled: !accessibility.soundEnabled })}
              className={`px-4 py-2 rounded-2xl font-extrabold text-xs transition-colors cursor-pointer ${
                accessibility.soundEnabled ? 'bg-teal-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              {accessibility.soundEnabled ? t('switch_on') : t('switch_off')}
            </button>
          </div>

          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
            <button
              type="button"
              onClick={handleTestChime}
              className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={13} />
              <span>{t('test_audio_chime')}</span>
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
                {t('settings_notifications')}
              </h3>
              <p className="text-xs text-stone-500">{t('settings_notifications')}</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">{t('medication_reminders_label')}</span>
              </div>
              <button
                type="button"
                onClick={() => setMedAlertsEnabled(!medAlertsEnabled)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                  medAlertsEnabled ? 'bg-teal-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600'
                }`}
              >
                {medAlertsEnabled ? t('switch_on') : t('switch_off')}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <div className="flex items-center gap-2">
                <Droplet size={15} className="text-sky-600" />
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">{t('hydration_reminders_label')}</span>
              </div>
              <button
                type="button"
                onClick={() => setHydrationAlertsEnabled(!hydrationAlertsEnabled)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                  hydrationAlertsEnabled ? 'bg-sky-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600'
                }`}
              >
                {hydrationAlertsEnabled ? t('switch_on') : t('switch_off')}
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
                {t('settings_time_mgmt')}
              </h3>
              <p className="text-xs text-stone-500">{t('daytime_schedule_desc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
              <span className="text-stone-400 font-bold block text-[10px] uppercase">{t('morning_routine_label')}</span>
              <span className="font-extrabold text-sm text-teal-700 dark:text-teal-300 mt-0.5 block">{morningTime}</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
              <span className="text-stone-400 font-bold block text-[10px] uppercase">{t('evening_routine_label')}</span>
              <span className="font-extrabold text-sm text-teal-700 dark:text-teal-300 mt-0.5 block">{eveningTime}</span>
            </div>
          </div>
          <p className="text-[11px] text-stone-400 italic">
            {t('quiet_hours_note')}
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
                {t('settings_device_perms')}
              </h3>
              <p className="text-xs text-stone-500">{t('app_capabilities_desc')}</p>
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <div className="flex items-center gap-2">
                <Mic size={16} className="text-teal-600" />
                <span className="font-medium text-stone-800 dark:text-stone-200">{t('mic_for_voice')}</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">{t('permission_active')}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-teal-600" />
                <span className="font-medium text-stone-800 dark:text-stone-200">{t('speaker_output')}</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">{t('permission_active')}</span>
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
                {t('settings_help_support')}
              </h3>
              <p className="text-xs text-stone-500">Contact {patient.emergencyContact.name || 'Caregiver'} or trigger SOS</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => showToast(`Calling ${patient.emergencyContact.name}... (Simulated)`, 'info')}
              className="py-3 px-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 text-teal-800 dark:text-teal-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PhoneCall size={14} />
              <span>{t('call_caregiver')}</span>
            </button>

            <button
              type="button"
              onClick={openSosModal}
              className="py-3 px-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ShieldAlert size={14} />
              <span>{t('emergency_sos_btn')}</span>
            </button>
          </div>
        </div>

        {/* 8. About Memogram */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-2">
          <div className="flex items-center gap-2">
            <Info size={18} className="text-teal-600" />
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
              {t('settings_about')}
            </h3>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed font-medium">
            Memogram v1.0.0 • Cognitive Wellness & Medication Companion for elders.
          </p>
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 font-medium">
            <strong>Important Notice:</strong> {t('medical_disclaimer')}
          </div>
        </div>

        {/* 9. Terms & Privacy */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                {t('settings_terms')}
              </h3>
              <p className="text-xs text-stone-500">{t('privacy_protected')}</p>
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
            <span>{t('settings_logout')}</span>
          </button>
        </div>

      </div>

      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        currentLanguage={currentLang}
        onSelectLanguage={handleLanguageChange}
      />

      <PatientBottomNav />
    </div>
  );
};
