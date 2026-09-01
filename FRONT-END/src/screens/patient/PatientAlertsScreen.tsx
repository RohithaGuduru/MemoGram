import React from 'react';
import { 
  Bell, 
  Pill, 
  Gamepad2, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  Volume2, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { PatientBottomNav } from '../../components/layout/PatientBottomNav';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { t } from '../../services/languageCapabilities';

export const PatientAlertsScreen: React.FC = () => {
  const { alerts, markAlertRead, dismissAlert, navigateTo, primaryLanguage, fallbackLanguage } = useApp();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'medication_reminder': return <Pill size={20} className="text-teal-600" />;
      case 'missed_medication': return <ShieldAlert size={20} className="text-rose-600" />;
      case 'game_reminder': return <Gamepad2 size={20} className="text-amber-600" />;
      default: return <Sparkles size={20} className="text-emerald-600" />;
    }
  };

  const pageIntroAudio = `Here are your recent reminders and notifications. You have ${alerts.length} notifications.`;

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header title={t('nav_alerts', primaryLanguage, fallbackLanguage)} audioPrompt={pageIntroAudio} showSOS />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Intro */}
        <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700">
              <Bell size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                {t('settings_notifications', primaryLanguage, fallbackLanguage)}
              </h2>
              <p className="text-xs text-stone-500">
                {alerts.filter((a) => a.unread).length} unread updates
              </p>
            </div>
          </div>

          <SpeakTextButton textToSpeak={pageIntroAudio} variant="pill" size="sm" />
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.map((alert) => {
            const alertAudio = `${alert.title}. ${alert.message} Received at ${alert.time}.`;

            return (
              <div
                key={alert.id}
                onClick={() => markAlertRead(alert.id)}
                className={`p-4 rounded-3xl border-2 transition-all shadow-soft flex flex-col gap-2 ${
                  alert.unread
                    ? 'border-teal-500 bg-white dark:bg-stone-850 ring-2 ring-teal-500/20'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-2xl bg-stone-100 dark:bg-stone-750 flex-shrink-0 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                          {alert.title}
                        </h3>
                        {alert.unread && (
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                        )}
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-300 font-medium mt-1 leading-relaxed">
                        {alert.message}
                      </p>

                      <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 font-semibold mt-2">
                        <Clock size={12} />
                        {alert.time}
                      </span>
                    </div>
                  </div>

                  <SpeakTextButton textToSpeak={alertAudio} variant="icon-only" size="sm" />
                </div>

                {/* Quick Action Button */}
                {alert.actionScreen && (
                  <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-750 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo(alert.actionScreen as any);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Open</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      <PatientBottomNav />
    </div>
  );
};
