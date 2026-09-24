import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isVoiceInputAvailable, getLanguageInfo } from '../../services/languageCapabilities';

interface VoiceButtonProps {
  onTranscriptReceived?: (transcript: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  label?: string;
  className?: string;
  subtext?: string;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onTranscriptReceived,
  size = 'hero',
  label = 'Tap to Speak',
  subtext,
  className = '',
}) => {
  const { 
    isListening, 
    startVoiceListening, 
    stopVoiceListening, 
    primaryLanguage, 
    showToast,
    voiceTranscript,
    t 
  } = useApp();

  const displayLabel = label || t('tap_to_speak');

  const langInfo = getLanguageInfo(primaryLanguage);
  const voiceAvailable = isVoiceInputAvailable(primaryLanguage);

  const handleToggle = () => {
    if (!voiceAvailable) {
      showToast(
        langInfo.capabilities.statusNote || `Voice support for ${langInfo.name} is currently unavailable.`,
        'warning',
        'Voice Assistant'
      );
      return;
    }

    if (isListening) {
      stopVoiceListening();
    } else {
      startVoiceListening(onTranscriptReceived);
    }
  };

  if (size === 'hero') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <button
          type="button"
          onClick={handleToggle}
          aria-label={label}
          className={`relative group flex items-center justify-center rounded-3xl p-6 transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-teal-400/50 shadow-soft-lg w-full max-w-sm ${
            !voiceAvailable
              ? 'bg-stone-100 text-stone-400 border-2 border-stone-200 hover:bg-stone-200/80 cursor-pointer'
              : isListening
              ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white scale-[1.02] ring-8 ring-rose-300/40 animate-pulse'
              : 'bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-600 text-white hover:shadow-glow hover:-translate-y-0.5'
          }`}
        >
          {/* Animated soundwaves when listening */}
          {isListening && (
            <div className="absolute inset-0 rounded-3xl border-4 border-rose-300 animate-ping opacity-30 pointer-events-none" />
          )}

          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl flex items-center justify-center ${
              isListening ? 'bg-white/20' : 'bg-white/15'
            }`}>
              {!voiceAvailable ? (
                <MicOff size={38} className="text-stone-400" />
              ) : isListening ? (
                <Mic size={38} className="text-white animate-bounce" />
              ) : (
                <Mic size={38} className="text-white" />
              )}
            </div>

            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight">
                  {!voiceAvailable ? displayLabel : isListening ? t('listening') : displayLabel}
                </span>
                {!voiceAvailable && (
                  <span className="text-xs bg-stone-300 text-stone-700 font-bold px-2 py-0.5 rounded-full">
                    Unavailable
                  </span>
                )}
              </div>
              <p className={`text-sm mt-0.5 ${isListening ? 'text-rose-100' : 'text-teal-100'}`}>
                {!voiceAvailable
                  ? (langInfo.capabilities.statusNote || `Voice in ${langInfo.name} unavailable`)
                  : isListening
                  ? 'Speak naturally now...'
                  : subtext || `Tap anytime to talk with Memogram`}
              </p>
            </div>
          </div>
        </button>

        {/* Live speech preview if listening or recently captured */}
        {isListening && (
          <div className="mt-3 w-full max-w-sm bg-white dark:bg-stone-800 rounded-2xl p-3 border border-teal-200 shadow-sm animate-fade-in text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300 mb-1">
              <Loader2 size={12} className="animate-spin text-teal-600" />
              <span>Hearing your voice:</span>
            </div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-200 italic min-h-[22px]">
              "{voiceTranscript || '...'}"
            </p>
          </div>
        )}
      </div>
    );
  }

  // Compact / Medium button
  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={displayLabel}
      className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 active:scale-95 shadow-sm ${
        !voiceAvailable
          ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-pointer'
          : isListening
          ? 'bg-rose-500 text-white animate-pulse shadow-md'
          : 'bg-teal-600 text-white hover:bg-teal-700'
      } ${className}`}
    >
      {!voiceAvailable ? (
        <>
          <MicOff size={18} />
          <span>{displayLabel}</span>
          <span className="text-[10px] bg-stone-300 text-stone-700 font-bold px-1.5 py-0.5 rounded">
            Unavailable
          </span>
        </>
      ) : isListening ? (
        <>
          <Mic size={18} className="animate-bounce" />
          <span>{t('listening')}</span>
        </>
      ) : (
        <>
          <Mic size={18} />
          <span>{displayLabel}</span>
        </>
      )}
    </button>
  );
};
