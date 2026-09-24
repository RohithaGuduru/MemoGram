import React from 'react';
import { ArrowLeft, Bell, ShieldAlert, User, Settings, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SpeakTextButton } from './SpeakTextButton';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSOS?: boolean;
  showProfile?: boolean;
  showSettings?: boolean;
  subtitle?: string;
  audioPrompt?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  showSOS = false,
  showProfile = true,
  showSettings = true,
  subtitle,
  audioPrompt,
}) => {
  const { 
    role, 
    patient, 
    caretaker, 
    navigateTo, 
    goBack, 
    openSosModal, 
    alerts,
    t 
  } = useApp();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  const unreadAlerts = alerts.filter((a) => a.unread).length;

  return (
    <header className="px-4 py-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 sticky top-0 z-30 flex items-center justify-between gap-2 shadow-xs">
      
      {/* Left: Back button OR Logo */}
      <div className="flex items-center gap-2.5">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-all active:scale-95 flex items-center justify-center min-w-[40px] min-h-[40px]"
            aria-label={t('btn_back') || 'Go Back'}
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div 
            onClick={() => navigateTo(role === 'caretaker' ? 'caretaker_dashboard' : 'patient_home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 flex items-center justify-center text-white font-black text-base shadow-sm group-hover:scale-105 transition-transform">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-teal-900 dark:text-teal-200 leading-tight">
                Memogram
              </span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold tracking-wider uppercase">
                {role === 'caretaker' ? t('caretaker_portal') : `Companion for ${patient.name}`}
              </span>
            </div>
          </div>
        )}

        {/* Title display when in sub-screens */}
        {title && showBack && (
          <div className="flex items-center gap-1.5 ml-1">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
            {audioPrompt && (
              <SpeakTextButton 
                textToSpeak={audioPrompt} 
                variant="icon-only" 
                size="sm" 
              />
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Large SOS button for Patient */}
        {role === 'patient' && showSOS && (
          <button
            type="button"
            onClick={openSosModal}
            className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-transform active:scale-95 animate-pulse"
            aria-label="SOS Emergency Help"
          >
            <ShieldAlert size={16} />
            <span>{t('sos_help')}</span>
          </button>
        )}

        {/* Caregiver view: Quick Patient Switcher / Info */}
        {role === 'caretaker' && (
          <div 
            onClick={() => navigateTo('caretaker_patient')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-stone-800 border border-teal-200 dark:border-stone-700 text-teal-900 dark:text-teal-200 text-xs font-semibold cursor-pointer hover:bg-teal-100"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{t('patient_label_header', { name: patient.name })}</span>
          </div>
        )}

        {/* Profile Avatar / Quick Link */}
        {showProfile && (
          <button
            type="button"
            onClick={() => navigateTo(role === 'caretaker' ? 'caretaker_profile' : 'patient_profile')}
            className="relative p-1 rounded-full border-2 border-teal-500/40 hover:border-teal-500 transition-colors"
            aria-label="Profile"
          >
            <img
              src={role === 'caretaker' ? caretaker.photoUrl : patient.photoUrl}
              alt="Profile"
              className="w-7 h-7 rounded-full object-cover"
            />
          </button>
        )}
      </div>
    </header>
  );
};
