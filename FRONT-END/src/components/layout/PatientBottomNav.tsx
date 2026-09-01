import React from 'react';
import { Home, Pill, Gamepad2, Bell, User, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScreenId } from '../../types';
import { t } from '../../services/languageCapabilities';

export const PatientBottomNav: React.FC = () => {
  const { currentScreen, navigateTo, alerts, primaryLanguage, fallbackLanguage } = useApp();

  const unreadAlertsCount = alerts.filter((a) => a.unread).length;

  const navItems: { screen: ScreenId; label: string; icon: React.ComponentType<any> }[] = [
    { screen: 'patient_home', label: t('nav_home', primaryLanguage, fallbackLanguage), icon: Home },
    { screen: 'patient_meds', label: t('nav_medicines', primaryLanguage, fallbackLanguage), icon: Pill },
    { screen: 'patient_games', label: t('nav_games', primaryLanguage, fallbackLanguage), icon: Gamepad2 },
    { screen: 'patient_alerts', label: t('nav_alerts', primaryLanguage, fallbackLanguage), icon: Bell },
    { screen: 'patient_profile', label: t('nav_profile', primaryLanguage, fallbackLanguage), icon: User },
    { screen: 'patient_settings', label: t('nav_settings', primaryLanguage, fallbackLanguage), icon: Settings },
  ];

  return (
    <nav 
      aria-label="Patient navigation"
      className="sticky bottom-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 px-2 py-1.5 z-40 shadow-lg flex items-center justify-around"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.screen;

        return (
          <button
            key={item.screen}
            type="button"
            onClick={() => navigateTo(item.screen)}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all relative min-w-[52px] ${
              isActive
                ? 'text-teal-700 dark:text-teal-300 font-bold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              isActive ? 'bg-teal-100 dark:bg-teal-950/80 scale-110' : ''
            }`}>
              <Icon size={22} className={isActive ? 'text-teal-700 dark:text-teal-300' : 'text-stone-500 dark:text-stone-400'} />
            </div>

            <span className="text-[11px] mt-0.5 tracking-tight leading-none">
              {item.label}
            </span>

            {/* Unread Alert badge */}
            {item.screen === 'patient_alerts' && unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs animate-bounce">
                {unreadAlertsCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
