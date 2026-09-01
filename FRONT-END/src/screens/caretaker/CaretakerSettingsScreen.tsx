import React, { useState } from 'react';
import { 
  Bell, 
  Volume2, 
  Globe, 
  Moon, 
  Sun, 
  Type, 
  Clock, 
  Shield, 
  HelpCircle, 
  Info, 
  FileCheck, 
  LogOut, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { CaretakerNavbar } from '../../components/layout/CaretakerNavbar';
import { LanguageSelectorModal } from '../../components/common/LanguageSelectorModal';
import { getLanguageInfo } from '../../services/languageCapabilities';
import { FontSizeSetting } from '../../types';
import { authApi } from '../../api';

export const CaretakerSettingsScreen: React.FC = () => {
  const { 
    accessibility, 
    updateAccessibility, 
    primaryLanguage, 
    setRole, 
    navigateTo, 
    showToast 
  } = useApp();

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const langInfo = getLanguageInfo(primaryLanguage);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    setRole(null);
    navigateTo('welcome');
    showToast('Logged out of Caretaker session', 'info');
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header title="Caretaker Settings" showBack />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Section 1: Accessibility & Display Preferences */}
        <div className="bg-white dark:bg-stone-850 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-teal-100 text-teal-700">
              <Sparkles size={16} />
            </div>
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              Accessibility & Appearance
            </h3>
          </div>

          {/* Language Item */}
          <div 
            onClick={() => setIsLangModalOpen(true)}
            className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-teal-50 dark:hover:bg-stone-800 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-teal-600" />
              <div>
                <p className="font-bold text-xs text-stone-900 dark:text-stone-100">Language System</p>
                <p className="text-[11px] text-stone-500">{langInfo.name} ({langInfo.nativeName})</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-stone-400" />
          </div>

          {/* Font Size */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Type size={18} className="text-teal-600" />
                <span className="font-bold text-xs text-stone-900 dark:text-stone-100">Display Text Size</span>
              </div>
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 capitalize">
                {accessibility.fontSize}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['normal', 'large', 'extra-large'] as FontSizeSetting[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => updateAccessibility({ fontSize: f })}
                  className={`py-2 text-xs rounded-xl border font-bold transition-all ${
                    accessibility.fontSize === f
                      ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                      : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {f === 'normal' ? 'Normal' : f === 'large' ? 'Large' : 'XL'}
                </button>
              ))}
            </div>
          </div>

          {/* Dark / Light Theme Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
            <div className="flex items-center gap-3">
              {accessibility.theme === 'dark' ? <Moon size={18} className="text-teal-600" /> : <Sun size={18} className="text-teal-600" />}
              <div>
                <p className="font-bold text-xs text-stone-900 dark:text-stone-100">Theme Mode</p>
                <p className="text-[11px] text-stone-500">{accessibility.theme === 'dark' ? 'Dark theme' : 'Warm light theme'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateAccessibility({ theme: accessibility.theme === 'dark' ? 'light' : 'dark' })}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200"
            >
              Toggle
            </button>
          </div>

          {/* Sound & Audio Cues */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-teal-600" />
              <div>
                <p className="font-bold text-xs text-stone-900 dark:text-stone-100">Audio Chimes & Feedback</p>
                <p className="text-[11px] text-stone-500">{accessibility.soundEnabled ? 'Enabled' : 'Muted'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateAccessibility({ soundEnabled: !accessibility.soundEnabled })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                accessibility.soundEnabled ? 'bg-teal-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600'
              }`}
            >
              {accessibility.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Section 2: Management & Permissions */}
        <div className="bg-white dark:bg-stone-850 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-2 text-xs">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-stone-500 mb-2">
            System & Support
          </h3>

          <div 
            onClick={() => showToast('Push notifications enabled for all medication schedules', 'success')}
            className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-teal-600" />
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">Notifications & Push Alerts</p>
                <p className="text-[11px] text-stone-500">Active on this device</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </div>

          <div 
            onClick={() => showToast('Microphone & Audio permissions granted for Memogram', 'success')}
            className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-teal-600" />
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">Device Permissions</p>
                <p className="text-[11px] text-stone-500">Microphone & Speech API ready</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </div>

          <div 
            onClick={() => showToast('Memogram v1.0.0 Prototype — Designed for senior cognitive wellness.', 'info', 'About Memogram')}
            className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Info size={18} className="text-teal-600" />
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">About Memogram</p>
                <p className="text-[11px] text-stone-500">Version 1.0.0 Prototype</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </div>

          <div 
            onClick={() => showToast('Terms and Non-diagnostic healthcare guidelines', 'info')}
            className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileCheck size={18} className="text-teal-600" />
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">Terms & Conditions</p>
                <p className="text-[11px] text-stone-500">Privacy policy & wellness terms</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>

      </div>

      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />

      <CaretakerNavbar />
    </div>
  );
};
