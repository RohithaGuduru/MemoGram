import React from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Heart, 
  Users, 
  PhoneCall, 
  Volume2, 
  Globe, 
  ShieldAlert 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { PatientBottomNav } from '../../components/layout/PatientBottomNav';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { getLanguageInfo, t } from '../../services/languageCapabilities';

export const PatientProfileScreen: React.FC = () => {
  const { patient, familyMembers, openSosModal, primaryLanguage, showToast, t } = useApp();
  const langInfo = getLanguageInfo(primaryLanguage);

  const profileSummaryAudio = `Profile for ${patient.name}. Age ${patient.age}. Emergency contact is your daughter ${patient.emergencyContact.name}. You have ${familyMembers.length} family members in your circle.`;

  const handleCallFamily = (member: any) => {
    showToast(`Calling ${member.name} (${member.relationship})... (Simulated)`, 'info', 'Family Call');
  };

  const localizedGender = patient.gender?.toLowerCase() === 'female' 
    ? t('gender_female') 
    : patient.gender?.toLowerCase() === 'male' 
      ? t('gender_male') 
      : t('gender_other');

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header title={t('nav_profile')} audioPrompt={profileSummaryAudio} showSOS />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Patient Card */}
        <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft text-center relative">
          <img
            src={patient.photoUrl}
            alt={patient.name}
            className="w-24 h-24 rounded-3xl object-cover ring-4 ring-emerald-500/40 mx-auto mb-3 shadow-md"
          />

          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
            {patient.name}
          </h2>
          <p className="text-sm text-stone-500 font-semibold mt-0.5">
            {t('age_years_old', { age: patient.age })} • {localizedGender}
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-bold flex items-center gap-1.5">
              <Globe size={14} />
              <span>{langInfo.name} ({langInfo.nativeName})</span>
            </span>

            <SpeakTextButton textToSpeak={profileSummaryAudio} variant="icon-only" size="sm" />
          </div>
        </div>

        {/* Emergency Caregiver Card */}
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800 p-4 sm:p-5 rounded-3xl shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <ShieldAlert size={16} />
              <span>{t('primary_emergency_contact')}</span>
            </span>
            <button
              type="button"
              onClick={openSosModal}
              className="text-xs font-extrabold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
            >
              {t('open_sos')}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 mt-3">
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">{patient.emergencyContact.phone}</p>
            </div>

            <button
              type="button"
              onClick={() => handleCallFamily(patient.emergencyContact)}
              className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <PhoneCall size={15} />
              <span>{t('call_action')}</span>
            </button>
          </div>
        </div>

        {/* Family Circle Cards */}
        <div className="bg-white dark:bg-stone-850 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-teal-600" />
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {t('family_circle')}
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-semibold">{t('family_members_count', { count: familyMembers.length })}</span>
          </div>

          <div className="space-y-2.5">
            {familyMembers.map((fam) => (
              <div 
                key={fam.id}
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={fam.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                    alt={fam.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-stone-200"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">{fam.name}</h4>
                    <p className="text-xs text-stone-500">{fam.relationship}</p>
                    {fam.notes && <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">"{fam.notes}"</p>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCallFamily(fam)}
                  className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200/80 shadow-xs"
                  aria-label={`Call ${fam.name}`}
                >
                  <PhoneCall size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      <PatientBottomNav />
    </div>
  );
};
