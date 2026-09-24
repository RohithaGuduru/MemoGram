import React, { useState } from 'react';
import { 
  Pill, 
  Clock, 
  CheckCircle2, 
  Droplet,
  CalendarCheck,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { PatientBottomNav } from '../../components/layout/PatientBottomNav';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { t } from '../../services/languageCapabilities';
import { speechService } from '../../services/speechService';

export const PatientMedsScreen: React.FC = () => {
  const { 
    medications, 
    markMedicationTaken, 
    snoozeMedication, 
    patient, 
    showToast,
    t 
  } = useApp();

  const [waterGlasses, setWaterGlasses] = useState(4);
  const [waterAcknowledged, setWaterAcknowledged] = useState(false);

  const totalTaken = medications.filter((m) => m.takenStatus === 'taken').length;
  const pageAudioIntro = `Here are your medicines and hydration reminders for today, ${patient.name}. You have completed ${totalTaken} of ${medications.length} medicines.`;

  const handleDrinkWater = () => {
    setWaterGlasses(prev => prev + 1);
    setWaterAcknowledged(true);
    speechService.playChime('success_bell');
    showToast(t('water_completed_confirmation'), 'success', 'Hydration');
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header title={t('nav_medicines')} audioPrompt={pageAudioIntro} showSOS />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Progress summary banner */}
        <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
              <CalendarCheck size={26} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                {t('todays_medicines')}
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                {t('doses_taken_count', { taken: totalTaken, total: medications.length })}
              </p>
            </div>
          </div>

          <SpeakTextButton 
            textToSpeak={pageAudioIntro} 
            variant="pill" 
            size="sm" 
          />
        </div>

        {/* Distinct Hydration / Water Reminder Card */}
        <div className="bg-sky-50/90 dark:bg-sky-950/40 p-5 rounded-3xl border-2 border-sky-300/80 dark:border-sky-800/60 shadow-soft space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <Droplet size={26} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-sky-950 dark:text-sky-100">
                  {t('drink_water_title')}
                </h3>
                <p className="text-xs text-sky-900/80 dark:text-sky-300 font-medium mt-0.5">
                  {t('drink_water_prompt')}
                </p>
              </div>
            </div>

            <SpeakTextButton
              textToSpeak={t('drink_water_prompt')}
              variant="icon-only"
              size="sm"
            />
          </div>

          <div className="pt-2 border-t border-sky-200/80 dark:border-sky-800/60">
            <button
              type="button"
              onClick={handleDrinkWater}
              className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
            >
              <span>{t('i_drank_water')}</span>
            </button>
          </div>
        </div>

        {/* Medication Cards List */}
        <div className="space-y-4">
          {medications.map((med) => {
            const isTaken = med.takenStatus === 'taken';
            const medReadText = `${med.name}. Dosage: ${med.dosage}. Scheduled for ${med.scheduleTime}. Special instructions: ${med.instructions}.`;

            return (
              <div
                key={med.id}
                className={`p-5 rounded-3xl border-2 transition-all shadow-soft ${
                  isTaken
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-800 hover:border-teal-400'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {med.photoUrl ? (
                      <img
                        src={med.photoUrl}
                        alt={med.name}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-stone-200 dark:ring-stone-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center flex-shrink-0">
                        <Pill size={32} />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100">
                          {med.name}
                        </h3>
                        {med.medicineType && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                            {med.medicineType}
                          </span>
                        )}
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                          {med.dosage}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-500 font-semibold">
                        <span className="flex items-center gap-1 text-teal-700 dark:text-teal-300 font-bold">
                          <Clock size={14} />
                          {med.scheduleTime}
                        </span>
                        <span>•</span>
                        <span>{isTaken ? `${t('status_taken')} (${med.takenAt || '9:05 AM'})` : t('status_pending')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Audio Listen */}
                  <SpeakTextButton 
                    textToSpeak={medReadText} 
                    variant="icon-only" 
                    size="md" 
                  />
                </div>

                {/* Instructions Box */}
                <div className="mt-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-100 dark:border-stone-700 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block mb-0.5">
                    {t('instructions_label')}
                  </span>
                  {med.instructions}
                </div>

                {/* Big Senior-Friendly Action Buttons */}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
                  {!isTaken ? (
                    <>
                      <button
                        type="button"
                        onClick={() => markMedicationTaken(med.id)}
                        className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <CheckCircle2 size={20} />
                        <span>{t('took_it')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => snoozeMedication(med.id, 15)}
                        className="py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-sm transition-colors cursor-pointer"
                      >
                        {t('remind_me_later')}
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 text-sm font-extrabold text-emerald-800 dark:text-emerald-300 py-2.5 bg-emerald-100/80 dark:bg-emerald-950/60 rounded-2xl">
                      <CheckCircle2 size={18} />
                      <span>{t('medicine_taken_confirmation')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <PatientBottomNav />
    </div>
  );
};
