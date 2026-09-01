import React from 'react';
import { Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isTTSAvailable, getLanguageInfo } from '../../services/languageCapabilities';

interface SpeakTextButtonProps {
  textToSpeak: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'pill' | 'filled' | 'icon-only';
  className?: string;
}

export const SpeakTextButton: React.FC<SpeakTextButtonProps> = ({
  textToSpeak,
  label = 'Listen',
  size = 'md',
  variant = 'subtle',
  className = '',
}) => {
  const { speakText, isSpeaking, stopSpeaking, primaryLanguage, showToast } = useApp();
  const langInfo = getLanguageInfo(primaryLanguage);
  const ttsAvailable = isTTSAvailable(primaryLanguage);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ttsAvailable) {
      showToast(
        `Voice support for ${langInfo.name} is currently under development.`,
        'warning',
        'Audio Unavailable'
      );
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(textToSpeak);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 min-h-[36px]',
    md: 'px-3.5 py-1.5 text-sm gap-2 min-h-[44px]',
    lg: 'px-5 py-2.5 text-base gap-2.5 min-h-[52px]'
  }[size];

  const iconSizes = {
    sm: 16,
    md: 19,
    lg: 22
  }[size];

  if (variant === 'icon-only') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={ttsAvailable ? `Listen in ${langInfo.name}` : `Voice support for ${langInfo.name} under development`}
        className={`inline-flex items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 active:scale-95 ${
          !ttsAvailable
            ? 'bg-stone-100 text-stone-400 hover:bg-stone-200 cursor-pointer'
            : isSpeaking
            ? 'bg-teal-600 text-white animate-pulse shadow-md'
            : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/80 shadow-sm'
        } ${size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'} ${className}`}
        aria-label={`Read aloud: ${textToSpeak.slice(0, 40)}`}
      >
        {!ttsAvailable ? (
          <VolumeX size={iconSizes} />
        ) : isSpeaking ? (
          <Volume2 size={iconSizes} className="animate-bounce" />
        ) : (
          <Volume2 size={iconSizes} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={ttsAvailable ? `Listen: ${textToSpeak}` : `Voice support for ${langInfo.name} is currently under development.`}
      className={`inline-flex items-center font-medium rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 active:scale-95 ${sizeClasses} ${
        !ttsAvailable
          ? 'bg-stone-100 text-stone-400 border border-stone-200 hover:bg-stone-200 cursor-pointer'
          : isSpeaking
          ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700'
          : variant === 'filled'
          ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
          : variant === 'pill'
          ? 'bg-white text-teal-800 border-2 border-teal-200 hover:border-teal-400 shadow-sm'
          : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80'
      } ${className}`}
    >
      {!ttsAvailable ? (
        <>
          <VolumeX size={iconSizes} className="text-stone-400 flex-shrink-0" />
          <span>{label}</span>
          <span className="text-[10px] uppercase tracking-wider bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded-full font-bold ml-0.5">
            Dev
          </span>
        </>
      ) : isSpeaking ? (
        <>
          <Volume2 size={iconSizes} className="animate-bounce flex-shrink-0" />
          <span>Speaking...</span>
        </>
      ) : (
        <>
          <Volume2 size={iconSizes} className="text-teal-600 flex-shrink-0" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
