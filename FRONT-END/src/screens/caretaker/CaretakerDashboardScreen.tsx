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
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { CaretakerNavbar } from '../../components/layout/CaretakerNavbar';
import { DemoBanner } from '../../components/common/DemoBanner';
import { INITIAL_AI_INSIGHTS } from '../../services/mockData';
import { aiApi } from '../../api';

export const CaretakerDashboardScreen: React.FC = () => {
  const { 
    patient, 
    medications, 
    cognitiveMetrics, 
    navigateTo, 
    gameHistory 
  } = useApp();

  const [aiInsight, setAiInsight] = useState<any>(null);

  React.useEffect(() => {
    if (patient.id) {
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

  const getTrendBadge = (trend: 'improving' | 'stable' | 'needs_attention') => {
    if (trend === 'improving') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
          <TrendingUp size={12} />
          Improving
        </span>
      );
    }
    if (trend === 'stable') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
          <Activity size={12} />
          Stable
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
        <AlertCircle size={12} />
        Needs Attention
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Caretaker Header */}
      <Header />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Patient Status Greeting Bar */}
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={patient.photoUrl}
                alt={patient.name}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-teal-500/50"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-stone-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                  {patient.name} ({patient.age} yrs)
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  Active
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Last activity: {cognitiveMetrics.lastPlayedAt}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('caretaker_patient')}
            className="p-2 text-stone-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="View Patient Profile"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Mandatory Demo Activity Data Banner */}
        <DemoBanner />

        {/* 2x2 Metric Grid based on Handwritten Flow */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Card 1: Today's Activity */}
          <div 
            onClick={() => navigateTo('caretaker_cognitive')}
            className="p-4 rounded-3xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-soft hover:shadow-soft-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Today's Activity
              </span>
              <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 group-hover:scale-105 transition-transform">
                <Gamepad2 size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                {cognitiveMetrics.gamesPlayedToday}
              </span>
              <span className="text-xs font-semibold text-stone-400">/ 3 games</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              {cognitiveMetrics.sessionsCompleted} sessions completed
            </p>
          </div>

          {/* Card 2: Cognitive Time */}
          <div 
            onClick={() => navigateTo('caretaker_cognitive')}
            className="p-4 rounded-3xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-soft hover:shadow-soft-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Cognitive Time
              </span>
              <div className="p-1.5 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 group-hover:scale-105 transition-transform">
                <Clock size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                24
              </span>
              <span className="text-xs font-semibold text-stone-400">mins</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              +145 mins this week
            </p>
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
                  Medications Overview
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
              <span>Manage</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden mb-3.5">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${(takenMedsCount / medications.length) * 100}%` }}
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
                  Cognitive Overview
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
                <span>Attention & Focus</span>
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
                <span>Memory Recall</span>
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
                <span>Pattern Recognition</span>
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
                  Overall Cognitive Score:
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
                AI Insights & Observations
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
              INITIAL_AI_INSIGHTS.slice(0, 3).map((insight) => (
                <div key={insight.id} className="p-3 rounded-2xl bg-white/90 dark:bg-stone-800/80 border border-teal-100 dark:border-stone-700 text-xs shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-teal-900 dark:text-teal-200 mb-0.5">
                    <span>{insight.title}</span>
                    <span className="text-[10px] text-stone-400 font-normal">{insight.date}</span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                    {insight.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Caretaker Navigation Bar */}
      <CaretakerNavbar />
    </div>
  );
};
