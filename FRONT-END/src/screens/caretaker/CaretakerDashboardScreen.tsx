import React, { useState } from 'react';
import { 
  Brain, 
  Pill, 
  Gamepad2, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  UserCheck, 
  Plus,
  CalendarCheck,
  ChevronRight,
  Droplets,
  Footprints
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { CaretakerNavbar } from '../../components/layout/CaretakerNavbar';
import { DemoBanner } from '../../components/common/DemoBanner';
import { INITIAL_AI_INSIGHTS } from '../../services/mockData';
import { isRealPatientId } from '../../services/demoFallback';
import { aiApi } from '../../api';

export const CaretakerDashboardScreen: React.FC = () => {
  const { 
    patient, 
    medications, 
    cognitiveMetrics, 
    navigateTo, 
    gameHistory,
    hydrationSettings,
    availablePatients,
    selectPatient,
    t
  } = useApp();

  const [aiInsight, setAiInsight] = useState<any>(() => 
    isRealPatientId(patient.id) ? null : {
      observations: INITIAL_AI_INSIGHTS.map((i) => i.description)
    }
  );

  React.useEffect(() => {
    if (patient.id) {
      if (!isRealPatientId(patient.id)) {
        setAiInsight({
          observations: INITIAL_AI_INSIGHTS.map((i) => i.description)
        });
        return;
      }
      (async () => {
        try {
          const res = await aiApi.getLatestInsights(patient.id);
          if (res) setAiInsight(res);
        } catch (e) {
          console.debug('[CaretakerDashboard] Using cached AI insights', e);
        }
      })();
    }
  }, [patient.id]);

  const takenMedsCount = medications.filter((m) => m.takenStatus === 'taken').length;
  const pendingMeds = medications.filter((m) => m.takenStatus !== 'taken');
  const nextMed = pendingMeds[0] || medications[0];

  // 1. Games completed today out of exactly 7 finalized MEMOGRAM games
  const todayGameIds = new Set(
    gameHistory
      .filter((h) => {
        const ts = h.timestamp?.toLowerCase() || '';
        return ts.includes('today') || ts.includes(new Date().toISOString().slice(0, 10));
      })
      .map((h) => h.gameId)
  );
  const gamesCompletedToday = todayGameIds.size > 0 
    ? todayGameIds.size 
    : (cognitiveMetrics.gamesPlayedToday ?? 0);
  const sessionsCompletedToday = cognitiveMetrics.sessionsCompleted ?? todayGameIds.size;

  // 2. Cognitive time for currently selected patient
  const cognitiveTimeToday = cognitiveMetrics.cognitiveTimeTodayMinutes ?? 0;
  const weeklyActivityMinutes = cognitiveMetrics.weeklyActivityMinutes ?? 0;

  // 3. Hydration progress and configured goal for currently selected patient
  const activeHydration = patient.hydrationSettings 
    || patient.accessibility_preferences?.hydration 
    || hydrationSettings;
  const hydrationGoalAmount = activeHydration.dailyGoalGlasses ?? activeHydration.dailyGoal ?? 8;
  const isLitres = activeHydration.unit === 'litres';
  const hydrationUnitLabel = isLitres ? 'L' : 'glasses';
  const hydrationConsumedToday = patient.waterConsumedToday ?? 0;
  const hydrationPercent = Math.min(100, Math.round((hydrationConsumedToday / hydrationGoalAmount) * 100));

  // 4. Steps taken for currently selected patient (goal = 3,000 steps per day)
  const DAILY_STEP_GOAL = 3000;
  const stepsToday = patient.stepsToday ?? cognitiveMetrics.stepsToday ?? 0;
  const stepsPercent = Math.min(100, Math.round((stepsToday / DAILY_STEP_GOAL) * 100));

  const getTrendBadge = (trend: 'improving' | 'stable' | 'needs_attention') => {
    if (trend === 'improving') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
          <TrendingUp size={12} />
          {t('trend_improving') || 'Improving'}
        </span>
      );
    }
    if (trend === 'stable') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
          <Activity size={12} />
          {t('trend_stable') || 'Stable'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
        <AlertCircle size={12} />
        {t('trend_needs_attention') || 'Needs Attention'}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Caretaker Header */}
      <Header />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Patient Status Greeting Bar with Patient Switcher */}
        {!patient.id ? (
          <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-dashed border-teal-300 dark:border-teal-700 shadow-soft text-center space-y-3">
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
              No Patient Assigned Yet
            </h2>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Get started by adding or connecting with your loved one in Patient Setup.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('caretaker_setup')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-teal-600 text-white text-xs font-bold shadow-sm hover:bg-teal-700 transition"
            >
              <span>{t('add_patient_title')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="relative">
                {patient.photoUrl ? (
                  <img
                    src={patient.photoUrl}
                    alt={patient.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-teal-500/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-black text-base flex items-center justify-center ring-2 ring-teal-500/50">
                    {patient.name ? patient.name.slice(0, 2).toUpperCase() : 'PT'}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-stone-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                    {patient.name} {patient.age ? `(${patient.age} yrs)` : ''}
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                    Active
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Last activity: {cognitiveMetrics.lastPlayedAt || 'Today'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {availablePatients && availablePatients.length > 1 && (
                <select
                  value={patient.id}
                  onChange={(e) => selectPatient(e.target.value)}
                  className="text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 py-1.5 px-2.5 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-colors"
                  aria-label="Switch Patient"
                >
                  {availablePatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => navigateTo('caretaker_patient')}
                className="p-2 text-stone-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                aria-label="View Patient Profile"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Mandatory Demo Activity Data Banner */}
        <DemoBanner />

        {/* 2x2 Metric Grid based on Handwritten Flow: Today's Activity */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Card 1: Games */}
          <div 
            onClick={() => navigateTo('caretaker_cognitive')}
            className="p-4 rounded-3xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-soft hover:shadow-soft-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('games_played_today')}
              </span>
              <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 group-hover:scale-105 transition-transform">
                <Gamepad2 size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                {gamesCompletedToday}
              </span>
              <span className="text-xs font-semibold text-stone-400">/ 7 games</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              {sessionsCompletedToday} sessions completed
            </p>
          </div>

          {/* Card 2: Cognitive Time */}
          <div 
            onClick={() => navigateTo('caretaker_cognitive')}
            className="p-4 rounded-3xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-soft hover:shadow-soft-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('minutes_active')}
              </span>
              <div className="p-1.5 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 group-hover:scale-105 transition-transform">
                <Clock size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                {cognitiveTimeToday}
              </span>
              <span className="text-xs font-semibold text-stone-400">mins</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              +{weeklyActivityMinutes} mins this week
            </p>
          </div>

          {/* Card 3: Hydration */}
          <div 
            className="p-4 rounded-3xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-soft hover:shadow-soft-lg transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('hydration_today')}
              </span>
              <div className="p-1.5 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 group-hover:scale-105 transition-transform">
                <Droplets size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                {hydrationConsumedToday}
              </span>
              <span className="text-xs font-semibold text-stone-400">
                / {hydrationGoalAmount} {hydrationUnitLabel}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              {hydrationPercent}% of daily goal
            </p>
            <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden mt-2">
              <div 
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${hydrationPercent}%` }}
              />
            </div>
          </div>

          {/* Card 4: Steps Taken */}
          <div 
            className="p-4 rounded-3xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-soft hover:shadow-soft-lg transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('step_activity')}
              </span>
              <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                <Footprints size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                {stepsToday.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-stone-400">
                / 3,000
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              {stepsPercent}% of daily goal
            </p>
            <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden mt-2">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stepsPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Today's Medication Status */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                <Pill size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  {t('med_adherence')}
                </h3>
                <p className="text-xs text-stone-500">
                  {takenMedsCount} of {medications.length} doses completed today
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('caretaker_medications')}
              className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1"
            >
              <span>{t('btn_edit') || 'Manage'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden mb-3.5">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${medications.length > 0 ? Math.round((takenMedsCount / medications.length) * 100) : 0}%` }}
            />
          </div>

          {/* Next upcoming medicine */}
          {nextMed && (
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${nextMed.takenStatus === 'taken' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <div>
                  <p className="font-bold text-xs text-stone-900 dark:text-stone-100">
                    {nextMed.name} ({nextMed.dosage})
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {nextMed.scheduleTime} • {nextMed.remainingQuantity} pills remaining
                  </p>
                </div>
              </div>

              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                nextMed.takenStatus === 'taken' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {nextMed.takenStatus === 'taken' ? 'Taken' : 'Pending'}
              </span>
            </div>
          )}
        </div>

        {/* Card 4: Cognitive Overview (Attention, Memory, Pattern Recognition, Overall Score) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                <Brain size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  {t('cognitive_engagement')}
                </h3>
                <p className="text-xs text-stone-500">
                  Activity tracking & pattern index
                </p>
              </div>
            </div>

            {getTrendBadge(cognitiveMetrics.trend)}
          </div>

          {/* Metric Bars */}
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                <span>{t('domain_focus')}</span>
                <span className="text-teal-700 dark:text-teal-300">{cognitiveMetrics.attention} / 100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800">
                <div 
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${cognitiveMetrics.attention}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                <span>{t('domain_memory')}</span>
                <span className="text-emerald-700 dark:text-emerald-300">{cognitiveMetrics.memory} / 100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800">
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${cognitiveMetrics.memory}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                <span>{t('domain_routine')}</span>
                <span className="text-purple-700 dark:text-purple-300">{cognitiveMetrics.patternRecognition} / 100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800">
                <div 
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${cognitiveMetrics.patternRecognition}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-stone-800 dark:text-stone-200">
                  {t('overall_score')}:
                </span>
                <span className="text-lg font-black text-teal-700 dark:text-teal-300 ml-1.5">
                  {cognitiveMetrics.overallScore}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('caretaker_cognitive')}
                className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline"
              >
                Deep Analytics →
              </button>
            </div>
          </div>

          <p className="text-[10px] text-stone-400 mt-3 italic leading-normal">
            * These insights track engagement and activity patterns and are not a clinical diagnosis.
          </p>
        </div>

        {/* Card 5: AI Insights (Supportive, non-diagnostic observations) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-stone-850 dark:to-stone-850 border border-teal-200/80 dark:border-stone-800 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-teal-600 text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-teal-950 dark:text-teal-200">
                {t('ai_wellness_insights')}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Supportive wellness patterns
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {aiInsight?.observations && aiInsight.observations.length > 0 ? (
              aiInsight.observations.slice(0, 3).map((obs: string, idx: number) => (
                <div key={idx} className="p-3 rounded-2xl bg-white/90 dark:bg-stone-800/80 border border-teal-100 dark:border-stone-700 text-xs shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-teal-900 dark:text-teal-200 mb-0.5">
                    <span>Observation {idx + 1}</span>
                    <span className="text-[10px] text-stone-400 font-normal">Recent</span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                    {obs}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl bg-white/70 dark:bg-stone-800/60 border border-teal-50 dark:border-stone-700 text-xs text-center">
                <p className="text-stone-500 dark:text-stone-400 font-medium">
                  No behavioral observations recorded yet. AI insights will appear here as the patient interacts with MEMOGRAM.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Caretaker Navigation Bar */}
      <CaretakerNavbar />
    </div>
  );
};
