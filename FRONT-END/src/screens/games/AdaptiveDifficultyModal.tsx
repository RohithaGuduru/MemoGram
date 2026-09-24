import React from 'react';
import { 
  Trophy, 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  Smile, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { GameId } from '../../types';
import { gameSessionsApi, authApi } from '../../api';
import { isRealPatientId } from '../../services/demoFallback';

interface AdaptiveDifficultyModalProps {
  isOpen: boolean;
  gameId: GameId;
  gameTitle: string;
  score: number;
  timeSpentSeconds: number;
  mistakes: number;
  hintsUsed: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const AdaptiveDifficultyModal: React.FC<AdaptiveDifficultyModalProps> = ({
  isOpen,
  gameId,
  gameTitle,
  score,
  timeSpentSeconds,
  mistakes,
  hintsUsed,
  onPlayAgain,
  onExit,
}) => {
  const { setAdaptiveDifficulty, recordGameResult, adaptiveDifficulties, patient, t } = useApp();

  React.useEffect(() => {
    if (isOpen) {
      // Trigger festive celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Calculate initial adaptive difficulty recommendation
      let nextDiff: 'easier' | 'standard' | 'challenging' = 'standard';
      if (score >= 85 && mistakes === 0) {
        nextDiff = 'challenging';
      } else if (score < 60 || mistakes > 3) {
        nextDiff = 'easier';
      }

      recordGameResult({
        gameId,
        score,
        attempts: 1,
        mistakes,
        hintsUsed,
        timeSpentSeconds,
        difficulty: adaptiveDifficulties[gameId] || 'standard',
        nextDifficultyRecommendation: nextDiff,
      });

      // Async submit to Backend Session API
      (async () => {
        try {
          const gameCodeMap: Record<GameId, string> = {
            groceries: 'MEM_SHOPPING',
            routine: 'DAILY_ROUTINE',
            cup_shuffle: 'CUP_SHUFFLE',
            cultural_match: 'CULTURAL_MEMORY',
            family_stories: 'FAMILY_MEMORIES',
            memory_mosaic: 'MEMORY_MOSAIC',
            block_mind: 'BLOCK_MIND',
          };
          const gameCode = gameCodeMap[gameId] || 'MEM_SHOPPING';
          const clientSessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          
          let targetPid = patient.id;
          if (!isRealPatientId(targetPid)) {
            try {
              const me = await authApi.getMe();
              if (me && isRealPatientId(me.patient_id)) {
                targetPid = me.patient_id;
              }
            } catch {}
          }

          if (isRealPatientId(targetPid)) {
            const session = await gameSessionsApi.startSession(gameCode, {
              client_session_id: clientSessionId,
              patient_id: targetPid,
              difficulty: adaptiveDifficulties[gameId] === 'challenging' ? 3 : adaptiveDifficulties[gameId] === 'easier' ? 1 : 2,
            });

            if (session?.id) {
              const submitRes = await gameSessionsApi.submitResult(session.id, {
                total_questions: 5,
                correct_answers: Math.max(1, Math.round((score / 100) * 5)),
                incorrect_answers: mistakes,
                errors_count: mistakes,
                attempts_count: 1,
                hints_used: hintsUsed,
                total_time_ms: timeSpentSeconds * 1000,
              });

              if (submitRes?.difficulty_recommendation?.action) {
                const recAction = submitRes.difficulty_recommendation.action;
                const mappedDiff: 'easier' | 'standard' | 'challenging' = 
                  recAction === 'increase' ? 'challenging' : recAction === 'decrease' ? 'easier' : 'standard';
                setAdaptiveDifficulty(gameId, mappedDiff);
              }
            }
          }
        } catch (e) {
          console.debug('[AdaptiveDifficultyModal] Game session saved locally', e);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDiff = adaptiveDifficulties[gameId] || 'standard';
  
  // Recommend next
  let recommendedDiff: 'easier' | 'standard' | 'challenging' = 'standard';
  if (score >= 85) recommendedDiff = 'challenging';
  else if (score < 65) recommendedDiff = 'easier';

  const modalAudioPrompt = `Great job completing ${gameTitle}! You scored ${score} points in ${timeSpentSeconds} seconds.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-teal-500/40 text-stone-900 dark:text-stone-100 text-center relative">
        
        {/* Trophy Icon */}
        <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 text-amber-950 flex items-center justify-center mx-auto mb-3 shadow-lg ring-8 ring-amber-100 dark:ring-amber-950/60 animate-bounce">
          <Trophy size={36} />
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
            {t('modal_wonderful_effort')}
          </h2>
          <SpeakTextButton textToSpeak={modalAudioPrompt} variant="icon-only" size="sm" />
        </div>

        <p className="text-sm text-stone-500 font-medium mb-4">
          {t('modal_you_completed', { game: gameTitle })}
        </p>

        {/* Score & Stats Grid */}
        <div className="grid grid-cols-3 gap-2 bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 mb-5">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">{t('score_label')}</span>
            <span className="text-2xl font-black text-teal-700 dark:text-teal-300">{score}%</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">{t('time_label')}</span>
            <span className="text-2xl font-black text-stone-800 dark:text-stone-200">{timeSpentSeconds}s</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">{t('mistakes_label')}</span>
            <span className="text-2xl font-black text-stone-800 dark:text-stone-200">{mistakes}</span>
          </div>
        </div>

        {/* Adaptive Difficulty Selection */}
        <div className="bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/50 rounded-2xl p-4 mb-5 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
              <Sparkles size={14} className="text-teal-600" />
              <span>{t('next_time_adjustment')}</span>
            </span>
            <span className="text-[10px] font-semibold bg-teal-200/80 dark:bg-teal-900 text-teal-900 dark:text-teal-100 px-2 py-0.5 rounded-md">
              Adaptive
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAdaptiveDifficulty(gameId, 'easier')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adaptiveDifficulties[gameId] === 'easier'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
              }`}
            >
              {t('diff_bit_easier')}
            </button>

            <button
              type="button"
              onClick={() => setAdaptiveDifficulty(gameId, 'standard')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adaptiveDifficulties[gameId] === 'standard'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
              }`}
            >
              {t('diff_keep_same')}
            </button>

            <button
              type="button"
              onClick={() => setAdaptiveDifficulty(gameId, 'challenging')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adaptiveDifficulties[gameId] === 'challenging'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
              }`}
            >
              {t('diff_bit_harder')}
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>{t('btn_play_again')}</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="flex-1 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{t('btn_all_games')}</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};
