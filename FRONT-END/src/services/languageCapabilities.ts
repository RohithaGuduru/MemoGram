import { LanguageInfo, SupportedLanguageCode } from '../types';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguageCode, LanguageInfo> = {
  'as-IN': {
    code: 'as-IN',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    script: 'Bengali-Assamese',
    region: 'Assam, Northeast India',
    capabilities: {
      text: true,
      voiceInput: true,
      tts: true,
      ttsVoiceAvailable: true,
      statusNote: 'Voice input (Sarvam Saaras v3) & speech synthesis (Indic Parler-TTS) active.',
    }
  },
  'brx-IN': {
    code: 'brx-IN',
    name: 'Bodo',
    nativeName: 'बड़ो',
    script: 'Devanagari',
    region: 'Bodoland, Assam',
    capabilities: {
      text: true,
      voiceInput: true,
      tts: true,
      ttsVoiceAvailable: true,
      statusNote: 'Voice input (Sarvam Saaras v3) & speech synthesis (Indic Parler-TTS) active.',
    }
  },
  'mni-IN': {
    code: 'mni-IN',
    name: 'Manipuri / Meitei',
    nativeName: 'মৈতৈ / Meiteilon',
    script: 'Meitei Mayek / Bengali',
    region: 'Manipur, Northeast India',
    capabilities: {
      text: true,
      voiceInput: true,
      tts: true,
      ttsVoiceAvailable: true,
      statusNote: 'Voice input (Sarvam Saaras v3) & speech synthesis (Indic Parler-TTS) active.',
    }
  },
  'trp-IN': {
    code: 'trp-IN',
    name: 'Kokborok',
    nativeName: 'ককবোরক',
    script: 'Bengali / Roman',
    region: 'Tripura, Northeast India',
    capabilities: {
      text: true,
      voiceInput: false,
      tts: false,
      ttsVoiceAvailable: false,
      statusNote: 'Voice support for Kokborok is currently unavailable.',
    }
  },
  'lus-IN': {
    code: 'lus-IN',
    name: 'Mizo',
    nativeName: 'Mizo ṭawng',
    script: 'Roman',
    region: 'Mizoram, Northeast India',
    capabilities: {
      text: true,
      voiceInput: false,
      tts: false,
      ttsVoiceAvailable: false,
      statusNote: 'Voice support for Mizo is currently unavailable.',
    }
  },
  'kha-IN': {
    code: 'kha-IN',
    name: 'Khasi',
    nativeName: 'Ka Ktien Khasi',
    script: 'Latin',
    region: 'Meghalaya, Northeast India',
    capabilities: {
      text: true,
      voiceInput: false,
      tts: false,
      ttsVoiceAvailable: false,
      statusNote: 'Voice support for Khasi is currently unavailable.',
    }
  },
  'hi-IN': {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिंदी',
    script: 'Devanagari',
    region: 'India (National)',
    capabilities: {
      text: true,
      voiceInput: true,
      tts: true,
      ttsVoiceAvailable: true,
      statusNote: 'Full text, voice input & speech synthesis active.',
    }
  },
  'en-IN': {
    code: 'en-IN',
    name: 'English (India)',
    nativeName: 'English',
    script: 'Latin',
    region: 'India & Global',
    capabilities: {
      text: true,
      voiceInput: true,
      tts: true,
      ttsVoiceAvailable: true,
      statusNote: 'Full text, voice input & speech synthesis active.',
    }
  }
};

export function frontendToBackendLang(code: string): string {
  switch (code) {
    case 'as-IN': return 'as';
    case 'brx-IN': return 'brx';
    case 'mni-IN': return 'mni';
    case 'trp-IN': return 'kokborok';
    case 'lus-IN': return 'mizo';
    case 'kha-IN': return 'kha';
    case 'hi-IN': return 'hi';
    case 'en-IN': return 'en';
    default: return code.split('-')[0].toLowerCase();
  }
}

export function backendToFrontendLang(code: string): SupportedLanguageCode {
  const norm = code.toLowerCase().split('-')[0];
  switch (norm) {
    case 'as': return 'as-IN';
    case 'brx': return 'brx-IN';
    case 'mni': return 'mni-IN';
    case 'kokborok':
    case 'trp': return 'trp-IN';
    case 'mizo':
    case 'lus': return 'lus-IN';
    case 'khasi':
    case 'kha': return 'kha-IN';
    case 'hi': return 'hi-IN';
    case 'en': return 'en-IN';
    default: return 'en-IN';
  }
}

export async function syncLanguagesFromBackend(): Promise<void> {
  try {
    const { languagesApi } = await import('../api/languages');
    const backendLangs = await languagesApi.listLanguages();
    if (Array.isArray(backendLangs) && backendLangs.length > 0) {
      backendLangs.forEach((bl) => {
        const feCode = backendToFrontendLang(bl.language_code);
        if (SUPPORTED_LANGUAGES[feCode]) {
          const ttsAvail = bl.capabilities?.tts?.available ?? false;
          const sttAvail = bl.capabilities?.stt?.available ?? false;
          SUPPORTED_LANGUAGES[feCode].capabilities.tts = ttsAvail;
          SUPPORTED_LANGUAGES[feCode].capabilities.ttsVoiceAvailable = ttsAvail;
          SUPPORTED_LANGUAGES[feCode].capabilities.voiceInput = sttAvail;
          if (sttAvail && ttsAvail) {
            SUPPORTED_LANGUAGES[feCode].capabilities.statusNote = `Full text, voice input & speech synthesis active.`;
          } else if (sttAvail) {
            SUPPORTED_LANGUAGES[feCode].capabilities.statusNote = `Voice input active for ${bl.display_name}. Speech playback unavailable.`;
          } else if (ttsAvail) {
            SUPPORTED_LANGUAGES[feCode].capabilities.statusNote = `Speech playback active for ${bl.display_name}. Voice input unavailable.`;
          } else {
            SUPPORTED_LANGUAGES[feCode].capabilities.statusNote = `Voice support for ${bl.display_name} is currently unavailable.`;
          }
        }
      });
    }
  } catch (err) {
    // Fallback to static verified capability registry
    console.debug('[LanguageCapabilities] Backend language registry offline, using local registry.');
  }
}

export const LANGUAGE_LIST = Object.values(SUPPORTED_LANGUAGES);

export function getLanguageInfo(code: SupportedLanguageCode): LanguageInfo {
  return SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES['en-IN'];
}

export function isTTSAvailable(code: SupportedLanguageCode): boolean {
  return !!SUPPORTED_LANGUAGES[code]?.capabilities.tts;
}

export function isVoiceInputAvailable(code: SupportedLanguageCode): boolean {
  return !!SUPPORTED_LANGUAGES[code]?.capabilities.voiceInput;
}

export function getVoiceStatusMessage(code: SupportedLanguageCode): string {
  const lang = getLanguageInfo(code);
  if (!lang.capabilities.voiceInput && !lang.capabilities.tts) {
    return `Voice support for ${lang.name} is currently unavailable.`;
  } else if (!lang.capabilities.voiceInput) {
    return `Voice input for ${lang.name} is currently unavailable.`;
  } else if (!lang.capabilities.tts) {
    return `Voice playback for ${lang.name} is currently unavailable.`;
  }
  return `Voice support active for ${lang.name}.`;
}

import { UI_TRANSLATIONS } from './translations';
export { UI_TRANSLATIONS };

export function t(
  key: string,
  lang: SupportedLanguageCode = 'en-IN',
  fallback: SupportedLanguageCode = 'en-IN',
  params?: Record<string, string | number>
): string {
  const trans = UI_TRANSLATIONS[key];
  let text = key;

  if (trans) {
    if (trans[lang]) {
      text = trans[lang];
    } else if (trans[fallback]) {
      text = trans[fallback];
    } else if (trans['en-IN']) {
      text = trans['en-IN'];
    }
  }

  if (params && typeof text === 'string') {
    Object.entries(params).forEach(([paramKey, val]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
    });
  }

  return text;
}

