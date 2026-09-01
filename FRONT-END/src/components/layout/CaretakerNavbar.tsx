import React from 'react';
import { LayoutDashboard, Pill, UserCheck, Brain, FileText, Settings, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScreenId } from '../../types';

export const CaretakerNavbar: React.FC = () => {
  const { currentScreen, navigateTo } = useApp();

  const navItems: { screen: ScreenId; label: string; icon: React.ComponentType<any> }[] = [
    { screen: 'caretaker_dashboard', label: 'Overview', icon: LayoutDashboard },
    { screen: 'caretaker_medications', label: 'Meds', icon: Pill },
    { screen: 'caretaker_cognitive', label: 'Cognitive', icon: Brain },
    { screen: 'caretaker_reports', label: 'Reports', icon: FileText },
    { screen: 'caretaker_patient', label: 'Patient', icon: UserCheck },
    { screen: 'caretaker_settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav 
      aria-label="Caretaker navigation"
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
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all min-w-[50px] ${
              isActive
                ? 'text-teal-700 dark:text-teal-300 font-bold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              isActive ? 'bg-teal-100 dark:bg-teal-950/80 scale-110' : ''
            }`}>
              <Icon size={20} className={isActive ? 'text-teal-700 dark:text-teal-300' : 'text-stone-500 dark:text-stone-400'} />
            </div>

            <span className="text-[11px] mt-0.5 tracking-tight leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
