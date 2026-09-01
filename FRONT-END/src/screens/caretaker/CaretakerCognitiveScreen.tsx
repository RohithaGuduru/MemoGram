import React, { useState } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  CheckCircle2,
  Calendar,
  Gamepad2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { CaretakerNavbar } from '../../components/layout/CaretakerNavbar';
import { DemoBanner } from '../../components/common/DemoBanner';
import { CORE_GAMES, WEEKLY_ANALYTICS_DATA, DEMO_DATA_DISCLAIMER } from '../../services/mockData';
import { GameId } from '../../types';
import { metricsApi } from '../../api';

export const CaretakerCognitiveScreen: React.FC = () => {
  const { cognitiveMetrics, gameHistory, patient } = useApp();
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('all');
  const [historyPoints, setHistoryPoints] = useState<any[] | null>(null);

  React.useEffect(() => {
    if (patient.id) {
      (async () => {
        try {
          const res = await metricsApi.getPerformanceHistory(patient.id, 'week');
          if (res?.data_points && res.data_points.length > 0) {
            setHistoryPoints(res.data_points);
          }
        } catch (e) {
          console.debug('[CaretakerCognitiveScreen] Using default trend data', e);
        }
      })();
    }
  }, [patient.id]);

  const filteredHistory = selectedGameFilter === 'all' 
    ? gameHistory 
    : gameHistory.filter((h) => h.gameId === selectedGameFilter);

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header title="Cognitive Overview & Trends" showBack />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Demo Data Notice */}
        <DemoBanner />

        {/* Big Overall Index Score Card */}
        <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white p-5 rounded-3xl shadow-soft-lg relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-teal-200">
                Cognitive Engagement Index
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">
                  {cognitiveMetrics.overallScore}
                </span>
                <span className="text-sm text-teal-200 font-semibold">/ 100</span>
              </div>
              <p className="text-xs text-teal-100 mt-1 font-medium">
                Overall pattern index (Calculated across all 5 cognitive games)
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md text-teal-100 border border-white/15">
              <Brain size={32} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15 text-xs">
            <div>
              <span className="text-teal-200 text-[11px] block">Weekly Active</span>
              <span className="font-bold text-base">{cognitiveMetrics.weeklyActivityMinutes}m</span>
            </div>
            <div>
              <span className="text-teal-200 text-[11px] block">Sessions</span>
              <span className="font-bold text-base">{cognitiveMetrics.sessionsCompleted} total</span>
            </div>
            <div>
              <span className="text-teal-200 text-[11px] block">Weekly Trend</span>
              <span className="font-bold text-base text-emerald-300">↗ +6%</span>
            </div>
          </div>
        </div>

        {/* Core Metric Dimension Breakdown */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center justify-between">
            <span>Cognitive Dimension Scores</span>
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">Target: 70+</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Attention */}
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-stone-800 dark:text-stone-200">Attention & Visual Tracking</span>
                <span className="text-teal-700 dark:text-teal-300 font-extrabold">{cognitiveMetrics.attention}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${cognitiveMetrics.attention}%` }} />
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">Evaluated in Cup Shuffle & Shopping List recall</p>
            </div>

            {/* Memory Recall */}
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-stone-800 dark:text-stone-200">Short-Term Working Memory</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">{cognitiveMetrics.memory}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cognitiveMetrics.memory}%` }} />
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">Evaluated in Cultural Memory Match & Groceries</p>
            </div>

            {/* Pattern Recognition & Executive */}
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-stone-800 dark:text-stone-200">Pattern Recognition & Sequence</span>
                <span className="text-purple-700 dark:text-purple-300 font-extrabold">{cognitiveMetrics.patternRecognition}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${cognitiveMetrics.patternRecognition}%` }} />
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">Evaluated in Daily Routine In Sequence</p>
            </div>
          </div>
        </div>

        {/* 7-Day Performance Trend Chart (SVG Sparkline) */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                7-Day Activity Trendline
              </h3>
              <p className="text-xs text-stone-500">Daily average score progression</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              ↗ Steady Growth
            </span>
          </div>

          {/* Simple Clean Bar / Column Trend */}
          <div className="flex items-end justify-between h-32 pt-4 px-2">
            {WEEKLY_ANALYTICS_DATA.days.map((day, idx) => {
              const score = WEEKLY_ANALYTICS_DATA.cognitiveScores[idx];
              const heightPercent = (score / 100) * 100;
              const isLatest = idx === WEEKLY_ANALYTICS_DATA.days.length - 1;

              return (
                <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-[10px] font-bold text-stone-500">{score}</span>
                  <div className="w-6 sm:w-8 h-20 bg-stone-100 dark:bg-stone-800 rounded-t-xl overflow-hidden flex items-end">
                    <div 
                      className={`w-full rounded-t-xl transition-all ${
                        isLatest 
                          ? 'bg-teal-600 animate-pulse' 
                          : 'bg-teal-400/80 dark:bg-teal-500/70 hover:bg-teal-500'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold ${isLatest ? 'text-teal-700 dark:text-teal-300 font-extrabold' : 'text-stone-400'}`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Game Session Logs & Filters */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
              Detailed Session History
            </h3>
            <span className="text-xs text-stone-400">{filteredHistory.length} recorded</span>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedGameFilter('all')}
              className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all ${
                selectedGameFilter === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              All Games
            </button>
            {CORE_GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGameFilter(g.id)}
                className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all ${
                  selectedGameFilter === g.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Log Items */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {filteredHistory.map((item, idx) => {
              const gameMeta = CORE_GAMES.find((g) => g.id === item.gameId);
              return (
                <div key={idx} className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {gameMeta?.name || item.gameId}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold uppercase">
                        {item.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-500 mt-1 text-[11px]">
                      <span>{item.timestamp}</span>
                      <span>•</span>
                      <span>⏱️ {item.timeSpentSeconds}s</span>
                      <span>•</span>
                      <span>Mistakes: {item.mistakes}</span>
                      <span>•</span>
                      <span>Hints: {item.hintsUsed}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-teal-700 dark:text-teal-300">
                      {item.score}%
                    </span>
                    <span className="block text-[10px] text-emerald-600 font-semibold">
                      Passed
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Required Non-Diagnostic Medical Statement */}
        <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          <p className="font-bold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-500" />
            <span>Important Medical Disclaimer</span>
          </p>
          <p>{DEMO_DATA_DISCLAIMER.nonDiagnosticDisclaimer}</p>
        </div>

      </div>

      <CaretakerNavbar />
    </div>
  );
};
