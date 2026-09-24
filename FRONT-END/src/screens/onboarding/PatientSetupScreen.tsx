import React, { useState } from 'react';
import { Globe, Type, Check, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGE_LIST, t, frontendToBackendLang, backendToFrontendLang } from '../../services/languageCapabilities';
import { SupportedLanguageCode, FontSizeSetting } from '../../types';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { patientsApi, authApi } from '../../api';
import { isRealPatientId } from '../../services/demoFallback';
import { getAccessToken } from '../../api/client';

export const PatientSetupScreen: React.FC = () => {
  const { 
    patientLanguage, 
    fallbackLanguage, 
    setPatientLanguage, 
    patientFontSize, 
    setPatientFontSize, 
    updatePatient, 
    patient, 
    navigateTo, 
    showToast 
  } = useApp();

  // Default to existing saved preference, or 'as-IN' and 'normal' if unset
  const [selectedLang, setSelectedLang] = useState<SupportedLanguageCode>(patientLanguage || 'as-IN');
  const [selectedFontSize, setSelectedFontSize] = useState<FontSizeSetting>(patientFontSize || 'normal');
  const [isSaving, setIsSaving] = useState(false);

  const handleLanguageChange = (code: SupportedLanguageCode) => {
    setSelectedLang(code);
  };

  const handleFontSizeChange = (size: FontSizeSetting) => {
    setSelectedFontSize(size);
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      // 1. Resolve real patient ID
      let targetPatientId = patient.id;
      if (!isRealPatientId(targetPatientId) && getAccessToken()) {
        try {
          const me = await authApi.getMe();
          if (me && isRealPatientId(me.patient_id)) {
            targetPatientId = me.patient_id;
          }
        } catch {}
      }

      const backendLangCode = frontendToBackendLang(selectedLang);

      if (isRealPatientId(targetPatientId)) {
        // Real mode: Save patient selections to the backend
        try {
          await patientsApi.updatePatient(targetPatientId, {
            primary_language: backendLangCode,
            preferred_language: backendLangCode,
            font_size: selectedFontSize === 'normal' ? 'normal' : selectedFontSize,
            accessibility_preferences: {
              ...(patient.accessibility_preferences || {}),
              preferences_configured: true,
              fontSize: selectedFontSize,
            },
          });

          // After saving successfully, load saved values back from the backend to verify persistence
          const verifiedPatient = await patientsApi.getPatient(targetPatientId);
          if (verifiedPatient) {
            const confirmedLang = backendToFrontendLang(
              verifiedPatient.preferred_language || verifiedPatient.primary_language || backendLangCode
            );
            const confirmedBackendFont = verifiedPatient.font_size;
            const confirmedFontSize: FontSizeSetting = 
              confirmedBackendFont === 'large' ? 'large' :
              confirmedBackendFont === 'extra-large' || confirmedBackendFont === 'extra_large' ? 'extra-large' : 'normal';

            setPatientLanguage(confirmedLang);
            setPatientFontSize(confirmedFontSize);

            updatePatient({
              id: targetPatientId,
              primaryLanguage: confirmedLang,
              fontSize: confirmedFontSize,
              accessibility_preferences: verifiedPatient.accessibility_preferences,
            });
          } else {
            setPatientLanguage(selectedLang);
            setPatientFontSize(selectedFontSize);
            updatePatient({
              id: targetPatientId,
              primaryLanguage: selectedLang,
              fontSize: selectedFontSize,
            });
          }

          showToast('Preferences saved successfully!', 'success');
        } catch (apiErr: any) {
          console.error('[PatientSetup] Backend preference save error:', apiErr);
          setPatientLanguage(selectedLang);
          setPatientFontSize(selectedFontSize);
          updatePatient({
            primaryLanguage: selectedLang,
            fontSize: selectedFontSize,
          });
          showToast('Preferences saved locally.', 'warning');
        }
      } else {
        // Demo mode: local state update only with clear demo feedback
        setPatientLanguage(selectedLang);
        setPatientFontSize(selectedFontSize);
        updatePatient({
          primaryLanguage: selectedLang,
          fontSize: selectedFontSize,
          accessibility_preferences: {
            ...(patient.accessibility_preferences || {}),
            preferences_configured: true,
            fontSize: selectedFontSize,
          },
        });
        showToast('Preferences saved (Demo mode)!', 'success');
      }

      // Mark setup completed in localStorage
      try {
        localStorage.setItem('memogram_patient_setup_completed', 'true');
      } catch {}

      // Navigate to Patient Welcome / Patient Dashboard
      navigateTo('patient_home');
    } finally {
      setIsSaving(false);
    }
  };

  const introAudio = "Welcome to Memogram. Please choose your preferred language and reading text size.";

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 overflow-y-auto custom-scrollbar">
      
      {/* Top Header Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
              M
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                Memogram Setup
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                Personalize your experience
              </p>
            </div>
          </div>
          <SpeakTextButton textToSpeak={introAudio} variant="icon-only" size="sm" />
        </div>

        {/* Welcome Notice */}
        <div className="bg-teal-50/80 dark:bg-teal-950/40 p-4 rounded-3xl border border-teal-200/80 dark:border-teal-800/60 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-teal-600 text-white mt-0.5">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-teal-950 dark:text-teal-200">
                {t('setup_welcome_title', selectedLang, fallbackLanguage)}
              </h2>
              <p className="text-xs text-teal-900/80 dark:text-teal-300 font-medium mt-1 leading-relaxed">
                {t('setup_welcome_desc', selectedLang, fallbackLanguage)}
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Language Selection (8 Memogram Languages) */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Globe size={20} className="text-teal-600 dark:text-teal-400" />
            <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
              {t('preferred_language_title', selectedLang, fallbackLanguage)}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {LANGUAGE_LIST.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 shadow-xs'
                      : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 hover:border-teal-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                        {lang.nativeName}
                      </span>
                      <span className="text-xs text-stone-400 font-medium">({lang.name})</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {lang.region}
                    </p>
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-teal-600 text-white' : 'border border-stone-300 dark:border-stone-600'
                  }`}>
                    {isSelected && <Check size={14} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Font/Text Size Preference */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <Type size={20} className="text-teal-600 dark:text-teal-400" />
            <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
              {t('step_font_title', selectedLang, fallbackLanguage)}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {(['normal', 'large', 'extra-large'] as FontSizeSetting[]).map((f) => {
              const isSelected = selectedFontSize === f;
              const label = f === 'normal' 
                ? t('font_standard', selectedLang, fallbackLanguage) 
                : f === 'large' 
                  ? t('font_large', selectedLang, fallbackLanguage) 
                  : t('font_extra_large', selectedLang, fallbackLanguage);

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
                  <span className="text-xs opacity-80 font-bold">Aa</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 pb-2">
        <button
          type="button"
          onClick={handleSaveAndContinue}
          disabled={isSaving}
          className="w-full py-4 px-6 rounded-3xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-extrabold text-base shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>{t('continue_to_home', selectedLang, fallbackLanguage)}</span>
          <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
};
