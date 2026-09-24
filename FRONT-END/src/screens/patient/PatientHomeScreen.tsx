import React, { useState } from 'react';
import { 
  Gamepad2, 
  Pill, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ShieldAlert, 
  ChevronRight, 
  MessageSquareQuote,
  Droplet,
  Footprints
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
    hydrationSettings,
    updatePatient,
    showToast,
    t 
  } = useApp();

  const [spokenResponse, setSpokenResponse] = useState<string | null>(null);

  // 4. Upcoming medicine: ONLY the current/next relevant medication
  const upcomingMedicine = medications.find((m) => m.takenStatus === 'pending') || (medications.length > 0 ? medications[0] : null);

  // 5. Hydration: Use patient's configured hydration goal
  const activeHydration = patient.hydrationSettings 
    || patient.accessibility_preferences?.hydration 
    || hydrationSettings;
  const hydrationGoalAmount = activeHydration.dailyGoalGlasses ?? activeHydration.dailyGoal ?? 8;
  const isLitres = activeHydration.unit === 'litres';
  const hydrationUnitLabel = isLitres ? 'L' : 'glasses';
  const hydrationConsumedToday = patient.waterConsumedToday ?? (isLitres ? 1.5 : 5);
  const hydrationPercent = Math.min(100, Math.round((hydrationConsumedToday / hydrationGoalAmount) * 100));

  const handleDrinkWater = () => {
    const increment = isLitres ? 0.25 : 1;
    const newConsumed = Math.round((hydrationConsumedToday + increment) * 100) / 100;
    updatePatient({ waterConsumedToday: newConsumed });
    speechService.playChime('success_bell');
    showToast(t('water_completed_confirmation'), 'success', 'Hydration');
  };

  // 6. Step Count: Today's steps / 3,000
  const stepsToday = patient.stepsToday ?? 1840;
  const stepsGoal = 3000;
  const stepsPercent = Math.min(100, Math.round((stepsToday / stepsGoal) * 100));

  const greetingTitle = t('greeting_hello', { name: patient.name });
  const howAreYou = t('how_are_you');
  const todaysMedsTitle = t('todays_medicines');
  const letsPlayTitle = t('lets_play_game');

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
              <span>{t('today_bright_day')}</span>
            </span>
            <span className="bg-white/15 px-2.5 py-0.5 rounded-full font-bold">
              {t('games_played_count', { count: 2 })}
            </span>
          </div>
        </div>

        {/* Large Primary Voice Interaction Card */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border-2 border-teal-200/80 dark:border-stone-800 shadow-soft text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              {t('voice_assistant')}
            </span>
          </div>

          <VoiceButton onTranscriptReceived={handleVoiceTranscript} size="hero" />

          {/* AI Response Card if recently spoken */}
          {spokenResponse && (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-stone-800 border border-teal-200 text-left text-xs sm:text-sm animate-fade-in">
              <div className="flex items-center justify-between mb-1 text-teal-800 dark:text-teal-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>{t('voice_companion')}</span>
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
              <span>{t('id_like_to_tell')}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: t('quick_phrase_meds'), text: 'I took my medicine' },
                { label: t('quick_phrase_game'), text: 'Play groceries game' },
                { label: t('quick_phrase_breakfast'), text: 'I had breakfast' },
                { label: t('quick_phrase_story'), text: 'Tell a Shillong story' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleVoiceTranscript(item.text)}
                  className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-teal-50 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Let's play a game! */}
        <button
          type="button"
          onClick={() => navigateTo('patient_games')}
          className="w-full p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white shadow-soft hover:shadow-soft-lg flex items-center justify-between gap-4 transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Gamepad2 size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                {t('lets_play_game')}
              </h2>
              <p className="text-xs sm:text-sm text-amber-100 font-medium mt-0.5">
                {t('games_subtext')}
              </p>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:translate-x-1 transition-transform">
            <ChevronRight size={20} className="text-white" />
          </div>
        </button>

        {/* Section 4: Upcoming Medicine */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                <Pill size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  {t('upcoming_medicine')}
                </h2>
                <p className="text-xs text-stone-500">
                  {upcomingMedicine ? t('scheduled_for', { time: upcomingMedicine.scheduleTime }) : t('no_meds_scheduled')}
                </p>
              </div>
            </div>

            {upcomingMedicine && (
              <SpeakTextButton
                textToSpeak={`Upcoming medicine: ${upcomingMedicine.name}, dosage ${upcomingMedicine.dosage} at ${upcomingMedicine.scheduleTime}. ${upcomingMedicine.instructions}`}
                variant="icon-only"
                size="sm"
              />
            )}
          </div>

          {upcomingMedicine ? (
            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-stone-800/60 border-2 border-teal-200 dark:border-teal-800/80 space-y-3.5">
              <div className="flex items-start gap-3.5">
                {upcomingMedicine.photoUrl ? (
                  <img
                    src={upcomingMedicine.photoUrl}
                    alt={upcomingMedicine.name}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-teal-500/30 shadow-xs flex-shrink-0"
                  />
                ) : (
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Pill size={32} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg text-stone-900 dark:text-stone-100 truncate">
                      {upcomingMedicine.name}
                    </h3>
                    {upcomingMedicine.medicineType && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                        {upcomingMedicine.medicineType}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 mt-0.5">
                    {t('dosage_label')} <span className="font-bold text-teal-800 dark:text-teal-300">{upcomingMedicine.dosage}</span>
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                    <Clock size={13} className="text-teal-600 dark:text-teal-400" />
                    <span className="font-bold text-stone-700 dark:text-stone-300">{upcomingMedicine.scheduleTime}</span>
                    <span>•</span>
                    <span className={upcomingMedicine.takenStatus === 'taken' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                      {upcomingMedicine.takenStatus === 'taken' ? t('status_taken') : t('status_pending')}
                    </span>
                  </div>

                  {upcomingMedicine.instructions && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 italic bg-white/80 dark:bg-stone-900/60 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800">
                      "{upcomingMedicine.instructions}"
                    </p>
                  )}
                </div>
              </div>

              {/* Actions: "I Took It" and "Remind Later" */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => markMedicationTaken(upcomingMedicine.id)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform cursor-pointer"
                >
                  <CheckCircle2 size={18} />
                  <span>{t('i_took_it')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => snoozeMedication(upcomingMedicine.id, 15)}
                  className="py-3 px-4 rounded-2xl bg-stone-200 dark:bg-stone-750 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  {t('remind_me_later')}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 text-center text-xs text-stone-500">
              {t('no_meds_scheduled')}
            </div>
          )}
        </div>

        {/* Section 5: Hydration */}
        <div className="bg-sky-50/90 dark:bg-sky-950/40 p-5 rounded-3xl border-2 border-sky-300/80 dark:border-sky-800/60 shadow-soft space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <Droplet size={26} />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-sky-950 dark:text-sky-100">
                  {t('drink_water_title')}
                </h3>
                <p className="text-xs text-sky-900/80 dark:text-sky-300 font-medium">
                  {t('drink_water_prompt')}
                </p>
              </div>
            </div>

            <SpeakTextButton 
              textToSpeak={`Hydration: ${hydrationConsumedToday} of ${hydrationGoalAmount} ${hydrationUnitLabel} consumed today. Stay hydrated!`} 
              variant="icon-only" 
              size="sm" 
            />
          </div>

          <div className="bg-white/90 dark:bg-stone-850 p-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                {t('todays_progress')}
              </span>
              <span className="text-xs font-extrabold text-sky-700 dark:text-sky-300">
                {hydrationPercent}% {t('of_goal')}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-sky-950 dark:text-sky-100">
                {hydrationConsumedToday}
              </span>
              <span className="text-sm font-bold text-stone-500 dark:text-stone-400">
                / {hydrationGoalAmount} {hydrationUnitLabel}
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-sky-150 dark:bg-stone-700 overflow-hidden">
              <div 
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${hydrationPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleDrinkWater}
            className="w-full py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform cursor-pointer"
          >
            <Droplet size={18} />
            <span>{t('i_drank_water')} (+1 {isLitres ? '0.25L' : 'glass'})</span>
          </button>
        </div>

        {/* Section 6: Step Count */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <Footprints size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                  {t('step_count_title')}
                </h3>
                <p className="text-xs text-stone-500">
                  {t('step_count_desc')}
                </p>
              </div>
            </div>

            <SpeakTextButton 
              textToSpeak={`Step count: ${stepsToday.toLocaleString()} steps taken out of 3,000 daily goal.`} 
              variant="icon-only" 
              size="sm" 
            />
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('todays_steps')}
              </span>
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                {stepsPercent}% {t('of_daily_goal')}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-stone-900 dark:text-stone-100">
                {stepsToday.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-stone-400 dark:text-stone-500">
                / 3,000
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stepsPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Large SOS Help Trigger Button */}
        <div className="pt-2 pb-4">
          <button
            type="button"
            onClick={openSosModal}
            className="w-full py-4 px-6 rounded-3xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-extrabold text-lg sm:text-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            <ShieldAlert size={26} />
            <span>{t('sos_need_assistance')}</span>
          </button>
          <p className="text-center text-xs text-stone-400 mt-2 font-medium">
            {t('sos_tap_hint')}
          </p>
        </div>

      </div>

      {/* Patient Bottom Navigation */}
      <PatientBottomNav />
    </div>
  );
};
