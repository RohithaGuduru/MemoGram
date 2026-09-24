import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Share2, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Heart, 
  Activity, 
  Brain, 
  Pill,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { CaretakerNavbar } from '../../components/layout/CaretakerNavbar';
import { DemoBanner } from '../../components/common/DemoBanner';
import { DEMO_DATA_DISCLAIMER, WEEKLY_ANALYTICS_DATA } from '../../services/mockData';
import { isRealPatientId } from '../../services/demoFallback';
import { reportsApi } from '../../api';

const getDemoWeeklyReport = () => ({
  period_start: 'Mon',
  period_end: 'Sun (Demo Week)',
  medication_adherence_rate: 93,
  total_sessions_completed: WEEKLY_ANALYTICS_DATA.summaryReport.totalSessions,
  average_accuracy: 77,
  positive_highlights: WEEKLY_ANALYTICS_DATA.summaryReport.highlightStrengths,
  gentle_encouragements: WEEKLY_ANALYTICS_DATA.summaryReport.gentleEncouragements,
  observations: [
    'Cognitive engagement is stable across daily routine tasks.',
    'Reaction times in Pattern Match have improved over the past 7 days.'
  ]
});

export const CaretakerReportsScreen: React.FC = () => {
  const { patient, caretaker, showToast, t } = useApp();
  const [weeklyReport, setWeeklyReport] = useState<any>(() => 
    isRealPatientId(patient.id) ? null : getDemoWeeklyReport()
  );
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (patient.id) {
      if (!isRealPatientId(patient.id)) {
        setWeeklyReport(getDemoWeeklyReport());
        return;
      }
      (async () => {
        setIsLoading(true);
        try {
          const res = await reportsApi.getWeeklyReport(patient.id);
          if (res) setWeeklyReport(res);
        } catch (e) {
          console.debug('[CaretakerReportsScreen] Using cached report data', e);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [patient.id]);

  const handleShare = () => {
    showToast('Weekly summary report exported as PDF (Simulated)', 'success', 'Export Ready');
  };

  const periodText = weeklyReport?.period_start && weeklyReport?.period_end
    ? `${weeklyReport.period_start} – ${weeklyReport.period_end}`
    : 'Current Week';

  const adherenceText = weeklyReport?.medication_adherence_rate !== undefined
    ? `${weeklyReport.medication_adherence_rate}%`
    : '--';

  const totalSessionsText = weeklyReport?.total_sessions_completed !== undefined
    ? `${weeklyReport.total_sessions_completed} sessions`
    : '0 sessions';

  const avgAccuracyText = weeklyReport?.average_accuracy !== undefined
    ? `${weeklyReport.average_accuracy} / 100`
    : '--';

  const positiveHighlights: string[] = (weeklyReport?.positive_highlights && weeklyReport.positive_highlights.length > 0)
    ? weeklyReport.positive_highlights
    : ['Cognitive routines active'];

  const gentleEncouragements: string[] = (weeklyReport?.gentle_encouragements && weeklyReport.gentle_encouragements.length > 0)
    ? weeklyReport.gentle_encouragements
    : ['Continue daily morning game sessions'];

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header title={t('nav_reports')} showBack />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Demo Notice */}
        <DemoBanner />

        {/* Top Report Summary Card */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                Weekly Synthesis
              </span>
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">
                {periodText}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Patient: <strong className="text-stone-800 dark:text-stone-200">{patient.name}</strong> • Caretaker: {caretaker.name}
              </p>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200/80 flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs"
              title="Share / Export Report"
            >
              <Share2 size={16} />
              <span>Export</span>
            </button>
          </div>

          {/* 3 Summary Stats */}
          <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-center">
            <div className="p-2.5 rounded-2xl bg-teal-50/70 dark:bg-stone-800 border border-teal-100 dark:border-stone-700">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Meds Taken</span>
              <span className="text-lg font-black text-teal-700 dark:text-teal-300">
                {adherenceText}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-stone-800 border border-emerald-100 dark:border-stone-700">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Games Played</span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                {totalSessionsText}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-purple-50/70 dark:bg-stone-800 border border-purple-100 dark:border-stone-700">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Cognitive Index</span>
              <span className="text-lg font-black text-purple-700 dark:text-purple-300">
                {avgAccuracyText}
              </span>
            </div>
          </div>
        </div>

        {/* Highlights & Improvements */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                Performance Improvements
              </h3>
              <p className="text-xs text-stone-500">Key positive observations this week</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {positiveHighlights.map((item: string, idx: number) => (
              <div key={idx} className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-stone-800/60 border border-emerald-200/60 dark:border-stone-700 text-stone-800 dark:text-stone-200 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span className="font-medium leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Areas that may need encouragement */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Heart size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                Areas for Gentle Encouragement
              </h3>
              <p className="text-xs text-stone-500">Supportive suggestions for caregiver</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {gentleEncouragements.map((item: string, idx: number) => (
              <div key={idx} className="p-3 rounded-2xl bg-amber-50/60 dark:bg-stone-800/60 border border-amber-200/60 dark:border-stone-700 text-stone-800 dark:text-stone-200 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span className="font-medium leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights & Observations Section */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-stone-850 dark:to-stone-850 p-5 rounded-3xl border border-teal-200/80 dark:border-stone-800 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-teal-600 text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-teal-950 dark:text-teal-200">
                Weekly AI Wellness Digest
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">Non-diagnostic behavioral synthesis</p>
            </div>
          </div>

          <div className="space-y-2">
            {weeklyReport?.observations && weeklyReport.observations.length > 0 ? (
              weeklyReport.observations.map((obs: string, idx: number) => (
                <div key={idx} className="p-3 rounded-2xl bg-white dark:bg-stone-800 border border-teal-100 dark:border-stone-700 text-xs">
                  <p className="font-bold text-teal-900 dark:text-teal-200 mb-0.5">Observation {idx + 1}</p>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed font-medium">{obs}</p>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-teal-100 dark:border-stone-700 text-xs text-center">
                <p className="text-stone-500 dark:text-stone-400 font-medium">
                  No automated weekly digest available yet. Complete more cognitive sessions to generate behavioral synthesis.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Non diagnostic note */}
        <p className="text-center text-[10px] text-stone-400 italic px-2">
          {DEMO_DATA_DISCLAIMER.nonDiagnosticDisclaimer}
        </p>

      </div>

      <CaretakerNavbar />
    </div>
  );
};
