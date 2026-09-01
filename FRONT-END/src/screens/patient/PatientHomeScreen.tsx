import React, { useState } from 'react';
import { 
  Smile, 
  Gamepad2, 
  Pill, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Volume2, 
  ShieldAlert, 
  ArrowRight,
  ChevronRight,
  Heart,
  MessageSquareQuote,
  Droplet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { PatientBottomNav } from '../../components/layout/PatientBottomNav';
import { VoiceButton } from '../../components/common/VoiceButton';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { CORE_GAMES } from '../../services/mockData';
import { t } from '../../services/languageCapabilities';
import { speechService } from '../../services/speechService';

export const PatientHomeScreen: React.FC = () => {
  const { 
    patient, 
    medications, 
    markMedicationTaken, 
    snoozeMedication, 
    navigateTo, 
    openSosModal, 
    primaryLanguage, 
    fallbackLanguage,
    processVoiceAssistant,
    showToast 
  } = useApp();

  const [spokenResponse, setSpokenResponse] = useState<string | null>(null);

  const greetingTitle = `Hello, ${patient.name}!`;
  const howAreYou = t('how_are_you', primaryLanguage, fallbackLanguage);
  const todaysMedsTitle = t('todays_medicines', primaryLanguage, fallbackLanguage);
  const letsPlayTitle = t('lets_play_game', primaryLanguage, fallbackLanguage);

  const fullGreetingPrompt = `${greetingTitle} ${howAreYou} Tap the microphone anytime to speak with me, or choose a game below!`;

  const handleVoiceTranscript = async (transcript: string) => {
    // 1. Try Backend Voice Gateway
    try {
      const backendRes = await processVoiceAssistant({ transcript });
      if (backendRes?.reply_text) {
        setSpokenResponse(backendRes.reply_text);
        if (backendRes.intent === 'NEXT_GAME') {
          setTimeout(() => navigateTo('game_groceries'), 2500);
        }
        return;
      }
    } catch (e) {
      console.debug('[PatientHomeScreen] Backend voice interaction fallback', e);
    }

    // 2. Fallback conversational logic
    let responseText = "I heard you clearly! I am right here with you, Arun.";
    const lower = transcript.toLowerCase();

    if (lower.includes('medicine') || lower.includes('pill') || lower.includes('donepezil') || lower.includes('vitamin')) {
      responseText = "Your morning Donepezil tablet is already taken. Your next medicine is Vitamin D3 at 1:00 PM with lunch.";
    } else if (lower.includes('game') || lower.includes('grocery') || lower.includes('shopping') || lower.includes('play')) {
      responseText = "Wonderful idea! Let's play the Groceries Shopping memory game together.";
      setTimeout(() => navigateTo('game_groceries'), 2500);
    } else if (lower.includes('memory') || lower.includes('shillong') || lower.includes('story') || lower.includes('family')) {
      responseText = "I love hearing about your trip to Shillong Peak with Priya holding the yellow pinwheel!";
    } else if (lower.includes('how are you') || lower.includes('doing')) {
      responseText = "I am doing wonderful, thank you for asking! It is always a pleasure spending the day with you.";
    }

    setSpokenResponse(responseText);
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Patient Header with SOS */}
      <Header showSOS showBack={false} />

      <div className="flex-1 p-4 sm:p-5 space-y-5 overflow-y-auto custom-scrollbar">
        
        {/* Friendly Hero Greeting */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white p-5 sm:p-6 rounded-3xl shadow-soft-lg relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {greetingTitle}
                </h1>
                <span className="text-2xl animate-wiggle">👋</span>
              </div>
              <p className="text-base sm:text-lg text-teal-100 font-medium mt-1">
                {howAreYou}
              </p>
            </div>

            <SpeakTextButton 
              textToSpeak={fullGreetingPrompt} 
              variant="pill" 
              size="sm" 
            />
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-teal-100">
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles size={14} className="text-amber-300" />
              <span>Today is a bright, beautiful day</span>
            </span>
            <span className="bg-white/15 px-2.5 py-0.5 rounded-full font-bold">
              2 Games Played
            </span>
          </div>
        </div>

        {/* Large Primary Voice Interaction Card */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border-2 border-teal-200/80 dark:border-stone-800 shadow-soft text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              Voice Assistant
            </span>
          </div>

          <VoiceButton onTranscriptReceived={handleVoiceTranscript} size="hero" />

          {/* AI Response Card if recently spoken */}
          {spokenResponse && (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-stone-800 border border-teal-200 text-left text-xs sm:text-sm animate-fade-in">
              <div className="flex items-center justify-between mb-1 text-teal-800 dark:text-teal-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>Memogram Voice Companion:</span>
                </span>
                <SpeakTextButton textToSpeak={spokenResponse} variant="icon-only" size="sm" />
              </div>
              <p className="text-stone-700 dark:text-stone-200 font-medium leading-relaxed">
                "{spokenResponse}"
              </p>
            </div>
          )}

          {/* "I'd like to tell you..." Prompts */}
          <div className="pt-2 text-left">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquareQuote size={14} className="text-teal-600" />
              <span>I'd like to tell you...</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                '💊 I took my medicine',
                '🛒 Play groceries game',
                '☕ I had breakfast',
                '📖 Tell a Shillong story'
              ].map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleVoiceTranscript(phrase)}
                  className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-teal-50 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Hydration Reminder Widget */}
        <div className="bg-sky-50/90 dark:bg-sky-950/40 p-4 sm:p-5 rounded-3xl border-2 border-sky-300/80 dark:border-sky-800/60 shadow-soft flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Droplet size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-sky-950 dark:text-sky-100">
                {t('drink_water_title', primaryLanguage, fallbackLanguage)}
              </h3>
              <p className="text-xs text-sky-900/80 dark:text-sky-300 font-medium">
                {t('drink_water_prompt', primaryLanguage, fallbackLanguage)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              speechService.playChime('success_bell');
              showToast(t('water_completed_confirmation', primaryLanguage, fallbackLanguage), 'success', 'Hydration');
            }}
            className="py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-transform cursor-pointer flex-shrink-0"
          >
            <span>{t('i_drank_water', primaryLanguage, fallbackLanguage)}</span>
          </button>
        </div>

        {/* Section: Let's Play a Game! */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <Gamepad2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  {letsPlayTitle}
                </h2>
                <p className="text-xs text-stone-500">5 fun games for your mind</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('patient_games')}
              className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1"
            >
              <span>See all 5</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Game Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {CORE_GAMES.slice(0, 2).map((game) => (
              <div
                key={game.id}
                onClick={() => navigateTo(`game_${game.id}` as any)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-98 ${game.colorScheme.bg} ${game.colorScheme.border}`}
              >
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${game.colorScheme.badge} uppercase`}>
                  {game.category}
                </span>
                <h3 className={`font-extrabold text-sm mt-1.5 ${game.colorScheme.text}`}>
                  {game.name}
                </h3>
                <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                  {game.shortDescription}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-teal-800 dark:text-teal-300">
                  <span>Play</span>
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-xs">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Today's Medicines Checklist */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                <Pill size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  {todaysMedsTitle}
                </h2>
                <p className="text-xs text-stone-500">Listen, snooze or mark as taken</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('patient_meds')}
              className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Medicines Checklist with large action buttons */}
          <div className="space-y-3">
            {medications.slice(0, 3).map((med) => {
              const isTaken = med.takenStatus === 'taken';
              const medReadText = `${med.name}. Dosage: ${med.dosage}. Scheduled for ${med.scheduleTime}. Special instructions: ${med.instructions}`;

              return (
                <div
                  key={med.id}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    isTaken 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
                      : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                          {med.name}
                        </h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                          {med.dosage}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                        <span className="flex items-center gap-1 font-bold text-teal-700 dark:text-teal-300">
                          <Clock size={13} />
                          {med.scheduleTime}
                        </span>
                        <span>•</span>
                        <span>{isTaken ? `Taken at ${med.takenAt || '9:05 AM'}` : 'Pending'}</span>
                      </div>
                    </div>

                    {/* Listen Button */}
                    <SpeakTextButton 
                      textToSpeak={medReadText} 
                      variant="icon-only" 
                      size="sm" 
                    />
                  </div>

                  {/* Instructions */}
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 font-medium">
                    {med.instructions}
                  </p>

                  {/* Actions: Listen / Remind me later / Took it */}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-stone-200/60 dark:border-stone-700">
                    {!isTaken ? (
                      <>
                        <button
                          type="button"
                          onClick={() => markMedicationTaken(med.id)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-transform"
                        >
                          <CheckCircle2 size={16} />
                          <span>Took it</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => snoozeMedication(med.id, 15)}
                          className="py-2.5 px-3 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-300 transition-colors"
                        >
                          Remind later
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 py-1 bg-emerald-100/70 dark:bg-emerald-950/60 rounded-xl">
                        <CheckCircle2 size={15} />
                        <span>Completed for today</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Large SOS Help Trigger Button */}
        <div className="pt-2 pb-4">
          <button
            type="button"
            onClick={openSosModal}
            className="w-full py-4 px-6 rounded-3xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-extrabold text-lg sm:text-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-3 transition-all"
          >
            <ShieldAlert size={26} />
            <span>SOS HELP — NEED ASSISTANCE</span>
          </button>
          <p className="text-center text-xs text-stone-400 mt-2 font-medium">
            Tap anytime if you need help from your caregiver Priya
          </p>
        </div>

      </div>

      {/* Patient Bottom Navigation */}
      <PatientBottomNav />
    </div>
  );
};
