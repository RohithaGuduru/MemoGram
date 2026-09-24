import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Globe, Moon, Sun, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useApp } from '../../context/AppContext';
import { getLanguageInfo } from '../../services/languageCapabilities';
import { LanguageSelectorModal } from '../common/LanguageSelectorModal';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const { 
    viewMode, 
    setViewMode, 
    role, 
    primaryLanguage, 
    accessibility, 
    updateAccessibility 
  } = useApp();

  const [currentTime, setCurrentTime] = useState('9:41');
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) return;
    const update = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [isNative]);

  const langInfo = getLanguageInfo(primaryLanguage);

  if (isNative) {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col bg-warm-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-sans selection:bg-teal-200">
        <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar bg-warm-50 dark:bg-stone-900">
          {children}
        </div>
        <LanguageSelectorModal
          isOpen={isLangModalOpen}
          onClose={() => setIsLangModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-teal-200">
      
      {/* Top Demo Presentation Bar */}
      <header className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 py-2 flex items-center justify-between z-40 sticky top-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
              M
            </div>
            <span className="font-extrabold text-base tracking-tight text-teal-900 dark:text-teal-200 hidden sm:inline">
              Memogram
            </span>
          </div>

          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hidden md:inline">
            Prototype Demo
          </span>
        </div>

        {/* Quick controls for Demo Evaluation */}
        <div className="flex items-center gap-2">
          {/* Language Selector Button */}
          <button
            type="button"
            onClick={() => setIsLangModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-teal-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 transition-colors"
            title="Change primary/fallback language"
          >
            <Globe size={14} className="text-teal-600 dark:text-teal-400" />
            <span>{langInfo.name}</span>
            <span className="text-[10px] text-stone-400 font-normal">({langInfo.code})</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => updateAccessibility({ theme: accessibility.theme === 'dark' ? 'light' : 'dark' })}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {accessibility.theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
          </button>

          {/* View Mode Toggle (Mobile Frame vs Full Responsive) */}
          <div className="hidden lg:flex items-center bg-stone-200/80 dark:bg-stone-800 p-0.5 rounded-full border border-stone-300 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setViewMode('device_frame')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
                viewMode === 'device_frame'
                  ? 'bg-white dark:bg-teal-700 text-teal-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              title="Mobile Device Frame"
            >
              <Smartphone size={13} />
              <span>Mobile View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('responsive')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
                viewMode === 'responsive'
                  ? 'bg-white dark:bg-teal-700 text-teal-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
              title="Responsive Width"
            >
              <Monitor size={13} />
              <span>Responsive</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-0 sm:p-4 lg:p-6 overflow-x-hidden">
        {viewMode === 'device_frame' ? (
          <div className="w-full max-w-[430px] min-h-[100dvh] sm:min-h-[844px] sm:max-h-[920px] bg-warm-50 dark:bg-stone-900 sm:rounded-[48px] shadow-2xl sm:border-[10px] border-stone-800 dark:border-stone-700 overflow-hidden flex flex-col relative transition-all">
            
            {/* Phone Bezel Speaker / Dynamic Island on Desktop */}
            <div className="hidden sm:flex items-center justify-center pt-3 pb-1 bg-warm-50 dark:bg-stone-900 z-30">
              <div className="w-24 h-4 bg-stone-900 dark:bg-stone-800 rounded-full flex items-center justify-end px-2">
                <div className="w-2.5 h-2.5 bg-stone-700 rounded-full" />
              </div>
            </div>

            {/* Mobile Status Bar */}
            <div className="flex items-center justify-between px-6 pt-2 pb-1 text-xs font-semibold text-stone-700 dark:text-stone-300 z-30 bg-warm-50/90 dark:bg-stone-900/90 select-none">
              <span>{currentTime}</span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span>5G</span>
                <span>📶</span>
                <span>🔋 98%</span>
              </div>
            </div>

            {/* App Scrollable Content */}
            <div className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar bg-warm-50 dark:bg-stone-900">
              {children}
            </div>

            {/* Home Indicator bar */}
            <div className="hidden sm:flex justify-center pb-2 pt-1 bg-warm-50 dark:bg-stone-900 z-30">
              <div className="w-32 h-1 bg-stone-400 dark:bg-stone-600 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl min-h-[85vh] bg-warm-50 dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto flex flex-col">
              {children}
            </div>
          </div>
        )}
      </main>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </div>
  );
};
