import React, { useState } from 'react';
import { Globe, Check, AlertCircle, Volume2, Mic, X, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGE_LIST, isTTSAvailable, isVoiceInputAvailable } from '../../services/languageCapabilities';
import { SupportedLanguageCode } from '../../types';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({ isOpen, onClose }) => {
  const { 
    primaryLanguage, 
    fallbackLanguage, 
    setPrimaryLanguage, 
    setFallbackLanguage 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'primary' | 'fallback'>('primary');

  if (!isOpen) return null;

  const handleSelect = (code: SupportedLanguageCode) => {
    if (activeTab === 'primary') {
      setPrimaryLanguage(code);
    } else {
      setFallbackLanguage(code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[90vh] flex flex-col text-stone-900 dark:text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-xl">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Language Settings</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Choose primary & fallback languages (7 supported)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection: Primary vs Fallback */}
        <div className="flex p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl my-3">
          <button
            type="button"
            onClick={() => setActiveTab('primary')}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'primary'
                ? 'bg-white dark:bg-stone-700 text-teal-800 dark:text-teal-200 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Primary Language
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fallback')}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'fallback'
                ? 'bg-white dark:bg-stone-700 text-teal-800 dark:text-teal-200 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Fallback Language
          </button>
        </div>

        {/* Informative notice */}
        <div className="p-3 mb-2 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/40 text-xs text-stone-700 dark:text-stone-300">
          <p className="font-semibold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-teal-600" />
            <span>Voice Capability Registry</span>
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-stone-600 dark:text-stone-400">
            If voice/TTS is marked <em>In Development</em>, Memogram will not silently switch languages. Voice features will display an explicit status note.
          </p>
        </div>

        {/* Language List of exact 7 languages */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {LANGUAGE_LIST.map((lang) => {
            const isSelected = activeTab === 'primary' 
              ? primaryLanguage === lang.code 
              : fallbackLanguage === lang.code;

            const ttsOk = isTTSAvailable(lang.code);
            const voiceOk = isVoiceInputAvailable(lang.code);

            return (
              <div
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 hover:border-teal-300 dark:hover:border-teal-700 bg-white dark:bg-stone-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-stone-300 dark:border-stone-700 bg-transparent'
                    }`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-stone-900 dark:text-stone-100">
                          {lang.name}
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                          ({lang.nativeName})
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 dark:text-stone-500">
                        {lang.region} • {lang.code}
                      </p>
                    </div>
                  </div>

                  {/* Capabilities Badges */}
                  <div className="flex items-center gap-1.5">
                    {ttsOk ? (
                      <span 
                        title="Voice Audio (TTS) Active"
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium"
                      >
                        <Volume2 size={11} />
                        TTS
                      </span>
                    ) : (
                      <span 
                        title="Voice TTS in development"
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium border border-stone-200 dark:border-stone-700"
                      >
                        TTS Dev
                      </span>
                    )}

                    {voiceOk ? (
                      <span 
                        title="Speech Recognition Active"
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-medium"
                      >
                        <Mic size={11} />
                        Mic
                      </span>
                    ) : (
                      <span 
                        title="Voice recognition in development"
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-medium"
                      >
                        Mic Dev
                      </span>
                    )}
                  </div>
                </div>

                {!ttsOk && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 pl-9">
                    ⚠️ {lang.capabilities.statusNote}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-2 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
