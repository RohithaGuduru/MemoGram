import React from 'react';
import { 
  HelpCircle, 
  Mic, 
  Volume2, 
  ShieldAlert, 
  HeartHandshake, 
  Sparkles, 
  Smile, 
  PhoneCall 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { PatientBottomNav } from '../../components/layout/PatientBottomNav';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';

export const PatientHelpScreen: React.FC = () => {
  const { openSosModal } = useApp();

  const helpIntroAudio = "Memogram Help Guide. You can speak anytime using the microphone button or listen to any text by tapping the speaker icon.";

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header title="Help & Voice Guide" audioPrompt={helpIntroAudio} showSOS />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Intro Banner */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700">
              <HelpCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                How Memogram Helps You
              </h2>
              <p className="text-xs text-stone-500">Easy tips for talking, listening & games</p>
            </div>
          </div>

          <SpeakTextButton textToSpeak={helpIntroAudio} variant="pill" size="sm" />
        </div>

        {/* Tip 1: Voice First */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <Mic size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  1. Speak Instead of Typing
                </h3>
                <p className="text-xs text-stone-500">Tap the large microphone to talk</p>
              </div>
            </div>

            <SpeakTextButton 
              textToSpeak="Tip 1. Tap the large microphone on your home screen to speak naturally about your medicine, games, or daily feelings." 
              variant="icon-only" 
              size="sm" 
            />
          </div>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
            Whenever you see the green or red microphone button, tap it once and speak. Memogram will listen and reply warmly.
          </p>
        </div>

        {/* Tip 2: Listen Everywhere */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Volume2 size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  2. Listen to Any Text (🔊)
                </h3>
                <p className="text-xs text-stone-500">Hear medicine instructions and questions</p>
              </div>
            </div>

            <SpeakTextButton 
              textToSpeak="Tip 2. Tap the Listen speaker button on any medicine card or game to hear it read aloud clearly." 
              variant="icon-only" 
              size="sm" 
            />
          </div>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
            Every screen has a speaker button next to the title and every medicine has its own Listen button so you never need to struggle reading small text.
          </p>
        </div>

        {/* Tip 3: Emergency SOS */}
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800 p-5 rounded-3xl shadow-soft space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-rose-900 dark:text-rose-200">
                  3. Immediate Help (SOS)
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-400">Always available in top header</p>
              </div>
            </div>

            <SpeakTextButton 
              textToSpeak="Tip 3. If you ever feel dizzy, confused, or need immediate assistance, tap the red SOS HELP button." 
              variant="icon-only" 
              size="sm" 
            />
          </div>

          <p className="text-xs sm:text-sm text-rose-950 dark:text-rose-200 font-medium leading-relaxed">
            Tap the red SOS button at any time. It will immediately confirm and send an alert notification to your caregiver Priya.
          </p>

          <button
            type="button"
            onClick={openSosModal}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <ShieldAlert size={16} />
            <span>Test SOS Help Dialog</span>
          </button>
        </div>

      </div>

      <PatientBottomNav />
    </div>
  );
};
