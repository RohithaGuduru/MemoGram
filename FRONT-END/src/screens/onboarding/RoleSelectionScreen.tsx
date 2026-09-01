import React from 'react';
import { Users, HeartHandshake, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { Header } from '../../components/common/Header';
import { t } from '../../services/languageCapabilities';

export const RoleSelectionScreen: React.FC = () => {
  const { navigateTo, primaryLanguage, fallbackLanguage } = useApp();

  const title = t('role_question', primaryLanguage, fallbackLanguage);
  const audioPrompt = `${title}. Please choose whether you are a Caretaker supporting a loved one, or a Patient enjoying daily brain wellness and reminders.`;

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header with Back */}
      <Header showBack onBack={() => navigateTo('welcome')} />

      <div className="my-auto py-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 leading-tight">
            {title}
          </h1>
          <SpeakTextButton 
            textToSpeak={audioPrompt} 
            variant="icon-only" 
            size="md" 
          />
        </div>

        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mb-8">
          Select your journey to personalize your experience.
        </p>

        {/* Option 1: Caretaker */}
        <div className="space-y-4">
          <div
            onClick={() => navigateTo('caretaker_auth')}
            className="group p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-850 border-2 border-stone-200/90 dark:border-stone-800 hover:border-teal-500 dark:hover:border-teal-500 shadow-soft hover:shadow-soft-lg transition-all duration-200 cursor-pointer active:scale-[0.99] relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <HeartHandshake size={32} />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                    Caretaker
                  </h2>
                  <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight size={18} />
                  </div>
                </div>

                <p className="text-sm text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  I manage medication schedules, monitor daily cognitive wellness trends, and support my elder.
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-teal-800 dark:text-teal-300">
                  <span className="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/40">
                    📊 Cognitive Trends
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/40">
                    💊 Medication Alerts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Patient */}
          <div
            onClick={() => navigateTo('patient_auth')}
            className="group p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-850 border-2 border-stone-200/90 dark:border-stone-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-soft hover:shadow-soft-lg transition-all duration-200 cursor-pointer active:scale-[0.99] relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Users size={32} />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    Patient / Elder
                  </h2>
                  <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight size={18} />
                  </div>
                </div>

                <p className="text-sm text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  I want to play fun memory games, hear my medicine reminders, and speak with voice assistance.
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40">
                    🎙️ Voice First
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40">
                    🎮 5 Memory Games
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40">
                    🆘 1-Tap Help
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-stone-400 dark:text-stone-500 pt-4">
        You can switch or experience both roles at any time in this prototype.
      </div>
    </div>
  );
};
