import { SupportedLanguageCode } from '../types';
import { getLanguageInfo, isTTSAvailable, isVoiceInputAvailable } from './languageCapabilities';

export interface TTSResult {
  status: 'started' | 'unsupported' | 'in_development' | 'error';
  message?: string;
}

class SpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private audioContext: AudioContext | null = null;
  private listeners: Set<(speaking: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Warm up voices
      window.speechSynthesis.onvoiceschanged = () => {
        // voices loaded
      };
    }
  }

  public subscribeSpeaking(callback: (speaking: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.isSpeaking);
    return () => this.listeners.delete(callback);
  }

  private notify(speaking: boolean) {
    this.isSpeaking = speaking;
    this.listeners.forEach(cb => cb(speaking));
  }

  public getVoiceSupportStatus(langCode: SupportedLanguageCode): {
    canListen: boolean;
    canSpeak: boolean;
    reasonText?: string;
  } {
    const langInfo = getLanguageInfo(langCode);
    const hasTTS = isTTSAvailable(langCode);
    const hasVoiceInput = isVoiceInputAvailable(langCode);

    if (!hasTTS || !hasVoiceInput) {
      return {
        canListen: hasTTS,
        canSpeak: hasVoiceInput,
        reasonText: `Voice support for ${langInfo.name} is currently under development.`
      };
    }

    return {
      canListen: true,
      canSpeak: true,
      reasonText: `Voice support active for ${langInfo.name}.`
    };
  }

  /**
   * Speak text with STRICT language checking.
   * NEVER fallback to English or Hindi if another language was selected.
   */
  public speak(
    text: string, 
    langCode: SupportedLanguageCode,
    onEnd?: () => void
  ): TTSResult {
    const langInfo = getLanguageInfo(langCode);

    // 1. Check capability registry
    if (!langInfo.capabilities.tts) {
      const msg = `Voice support for ${langInfo.name} is currently under development.`;
      console.warn(`[SpeechService] Blocked TTS: ${msg}`);
      return {
        status: 'in_development',
        message: msg
      };
    }

    // 2. Check browser Web Speech API availability
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return {
        status: 'unsupported',
        message: 'Speech synthesis is not supported on this browser.'
      };
    }

    try {
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode; // Strict BCP-47 tag (e.g., 'hi-IN' or 'en-IN')
      utterance.rate = 0.88; // Gentle, slightly slower pacing for senior clarity
      utterance.pitch = 1.05; // Friendly, warm pitch

      // Check if browser has an appropriate matching voice for this language
      const isRegional = langCode !== 'en-IN' && langCode !== 'hi-IN';
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const matchingVoice = voices.find(v => 
          v.lang === langCode || 
          v.lang.replace('_', '-').toLowerCase().startsWith(langCode.split('-')[0].toLowerCase())
        );

        if (matchingVoice) {
          utterance.voice = matchingVoice;
        } else if (isRegional) {
          // STRICT RULE: DO NOT switch to English/Hindi voice for regional languages.
          return {
            status: 'in_development',
            message: `Speech synthesis for ${langInfo.name} is currently unavailable on this device.`
          };
        }
      } else if (isRegional) {
        // If voices list is empty or unsupported on this device, never allow browser default English/Hindi voice
        return {
          status: 'in_development',
          message: `Speech synthesis for ${langInfo.name} is currently unavailable on this device.`
        };
      }

      utterance.onstart = () => {
        this.notify(true);
      };

      utterance.onend = () => {
        this.notify(false);
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.error('[SpeechService] TTS error:', e);
        this.notify(false);
        this.currentUtterance = null;
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);

      return {
        status: 'started'
      };
    } catch (err) {
      console.error('[SpeechService] Speak exception:', err);
      this.notify(false);
      return {
        status: 'error',
        message: 'Failed to synthesize speech.'
      };
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.notify(false);
  }

  public playAudioBase64(base64Data: string, onEnd?: () => void): void {
    try {
      this.stop();
      const mime = base64Data.startsWith('data:') ? '' : 'data:audio/wav;base64,';
      const audio = new Audio(`${mime}${base64Data}`);
      
      this.notify(true);
      audio.onended = () => {
        this.notify(false);
        if (onEnd) onEnd();
      };
      audio.onerror = (e) => {
        console.error('[SpeechService] Backend audio playback error:', e);
        this.notify(false);
      };
      audio.play().catch((err) => {
        console.warn('[SpeechService] Autoplay blocked or error:', err);
        this.notify(false);
      });
    } catch (err) {
      console.error('[SpeechService] Play audio base64 error:', err);
      this.notify(false);
    }
  }

  public playAudioUrl(url: string, onEnd?: () => void): void {
    try {
      this.stop();
      const audio = new Audio(url);
      this.notify(true);
      audio.onended = () => {
        this.notify(false);
        if (onEnd) onEnd();
      };
      audio.onerror = (e) => {
        console.error('[SpeechService] Backend audio URL error:', e);
        this.notify(false);
      };
      audio.play().catch((err) => {
        console.warn('[SpeechService] Play audio url failed:', err);
        this.notify(false);
      });
    } catch (err) {
      console.error('[SpeechService] Play audio url error:', err);
      this.notify(false);
    }
  }

  // Senior-friendly audio chimes and cues using Web Audio API
  public playChime(type: 'gentle_click' | 'success_bell' | 'celebration' | 'reminder_chime' | 'card_flip' | 'warning'): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;

      if (type === 'gentle_click') {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'success_bell') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          if (!this.audioContext) return;
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.15, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.45);
        });
      } else if (type === 'celebration') {
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((freq, i) => {
          if (!this.audioContext) return;
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.2, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.5);
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.55);
        });
      } else if (type === 'card_flip') {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.06);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'reminder_chime') {
        const notes = [587.33, 880]; // D5, A5
        notes.forEach((freq, i) => {
          if (!this.audioContext) return;
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.18);
          gain.gain.setValueAtTime(0.15, now + i * 0.18);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.6);
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.start(now + i * 0.18);
          osc.stop(now + i * 0.18 + 0.65);
        });
      } else if (type === 'warning') {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Audio not supported or blocked by user gesture
    }
  }
}

export const speechService = new SpeechService();
