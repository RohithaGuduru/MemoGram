import React from 'react';
import { Sparkles, Heart, Brain, ArrowRight, ShieldCheck, Smile } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { t } from '../../services/languageCapabilities';

export const WelcomeScreen: React.FC = () => {
  const { navigateTo, primaryLanguage, fallbackLanguage } = useApp();

  const welcomeTitle = t('welcome_greeting', primaryLanguage, fallbackLanguage);
  const welcomeDesc = t('welcome_desc', primaryLanguage, fallbackLanguage);
  const getStartedText = t('get_started', primaryLanguage, fallbackLanguage);

  const fullPromptToRead = `${welcomeTitle}. ${welcomeDesc} Tap Get Started to begin.`;

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-b from-teal-50/70 via-warm-50 to-warm-100/60 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 text-stone-800 dark:text-stone-100 relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-teal-200/40 dark:bg-teal-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-100/50 dark:bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Speech button */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-teal-700/20">
            M
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-teal-900 dark:text-teal-200">
            Memogram
          </span>
        </div>

        <SpeakTextButton 
          textToSpeak={fullPromptToRead} 
          variant="pill" 
          size="sm" 
        />
      </div>

      {/* Hero Illustration / Graphic */}
      <div className="my-auto py-6 flex flex-col items-center text-center z-10">
        <div className="relative mb-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-teal-500/20 via-emerald-400/20 to-amber-300/20 dark:from-teal-900/40 dark:to-stone-800 flex items-center justify-center shadow-soft-lg ring-8 ring-white/60 dark:ring-stone-800/60 animate-float">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg">
              <Brain size={44} className="text-white" />
            </div>
          </div>
          
          <div className="absolute -bottom-2 -right-2 p-2.5 bg-amber-400 text-amber-950 rounded-2xl shadow-md animate-bounce">
            <Smile size={22} />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight leading-tight mb-3">
          {welcomeTitle}
        </h1>

        <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-md leading-relaxed font-normal mb-6">
          {welcomeDesc}
        </p>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs text-xs font-semibold text-stone-700 dark:text-stone-300">
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/80 dark:bg-stone-850 border border-teal-200/60 dark:border-stone-800 shadow-xs">
            <Sparkles size={16} className="text-teal-600" />
            <span>Brain Wellness</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/80 dark:bg-stone-850 border border-teal-200/60 dark:border-stone-800 shadow-xs">
            <Heart size={16} className="text-rose-500" />
            <span>Med Reminders</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/80 dark:bg-stone-850 border border-teal-200/60 dark:border-stone-800 shadow-xs">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Caregiver Peace</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/80 dark:bg-stone-850 border border-teal-200/60 dark:border-stone-800 shadow-xs">
            <Smile size={16} className="text-amber-500" />
            <span>Senior Friendly</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pt-4 z-10">
        <button
          type="button"
          onClick={() => navigateTo('role_selection')}
          className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-lg sm:text-xl shadow-lg shadow-teal-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          <span>{getStartedText}</span>
          <ArrowRight size={22} />
        </button>

        <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-3 font-medium">
          8 Northeast & Indian Languages Supported • Voice Ready
        </p>
      </div>

    </div>
  );
};
