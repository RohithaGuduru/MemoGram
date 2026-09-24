import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  Play 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { AdaptiveDifficultyModal } from './AdaptiveDifficultyModal';
import { speechService } from '../../services/speechService';

export const CupShuffleGame: React.FC = () => {
  const { navigateTo, adaptiveDifficulties, t } = useApp();
  const difficulty = adaptiveDifficulties.cup_shuffle || 'standard';

  // Map difficulty to Level 1–5:
  // Level 1: 2 cups, slow
  // Level 2: 3 cups, slow
  // Level 3: 3 cups, medium speed
  // Level 4: 4 cups, medium-fast
  // Level 5: 4 cups, fast
  const defaultLevel = difficulty === 'easier' ? 1 : difficulty === 'challenging' ? 4 : 3;
  const [level, setLevel] = useState<number>(defaultLevel);

  const numCups = level === 1 ? 2 : (level === 2 || level === 3) ? 3 : 4;
  const swapDurationMs = 
    level === 1 ? 700 : 
    level === 2 ? 620 : 
    level === 3 ? 500 : 
    level === 4 ? 400 : 320;
  const shuffleRounds = 
    level === 1 ? 4 : 
    level === 2 ? 5 : 
    level === 3 ? 6 : 
    level === 4 ? 7 : 9;

  const [coinPosition, setCoinPosition] = useState<number>(0);
  const [cupPositions, setCupPositions] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'initial' | 'shuffling' | 'choose' | 'revealed' | 'complete'>('initial');
  const [selectedCup, setSelectedCup] = useState<number | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [totalRounds] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  const prepareRound = (initialCoin: number = Math.floor(Math.random() * numCups)) => {
    setCoinPosition(initialCoin);
    setCupPositions(Array.from({ length: numCups }, (_, i) => i));
    setSelectedCup(null);
    setGameState('initial');
  };

  const startNewSession = () => {
    setRoundNumber(1);
    setCorrectCount(0);
    setMistakes(0);
    setStartTime(Date.now());
    prepareRound(Math.floor(Math.random() * numCups));
  };

  useEffect(() => {
    setLevel(defaultLevel);
  }, [difficulty]);

  useEffect(() => {
    startNewSession();
  }, [level]);

  const handleStartShuffle = () => {
    speechService.playChime('gentle_click');
    setGameState('shuffling');

    let currentCoin = coinPosition;
    let swapsLeft = shuffleRounds;

    const interval = setInterval(() => {
      swapsLeft -= 1;
      
      // Randomly pick two distinct cup slots to swap
      const idx1 = Math.floor(Math.random() * numCups);
      let idx2 = (idx1 + 1 + Math.floor(Math.random() * (numCups - 1))) % numCups;

      setCupPositions((prev) => {
        const next = [...prev];
        const temp = next[idx1];
        next[idx1] = next[idx2];
        next[idx2] = temp;
        return next;
      });

      // Track coin if swapped
      if (currentCoin === idx1) currentCoin = idx2;
      else if (currentCoin === idx2) currentCoin = idx1;

      speechService.playChime('card_flip');

      if (swapsLeft <= 0) {
        clearInterval(interval);
        setCoinPosition(currentCoin);
        setTimeout(() => {
          setGameState('choose');
        }, 400);
      }
    }, swapDurationMs);
  };

  const handlePickCup = (slotIndex: number) => {
    if (gameState !== 'choose') return;
    setSelectedCup(slotIndex);
    setGameState('revealed');

    const isCorrect = slotIndex === coinPosition;

    if (isCorrect) {
      speechService.playChime('success_bell');
      setCorrectCount((prev) => prev + 1);
    } else {
      speechService.playChime('warning');
      setMistakes((prev) => prev + 1);
    }

    // Advance to next round or complete
    setTimeout(() => {
      if (roundNumber < totalRounds) {
        setRoundNumber((r) => r + 1);
        prepareRound(Math.floor(Math.random() * numCups));
      } else {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        setTimeSpent(elapsed);
        const calculated = Math.max(50, Math.round(((correctCount + (isCorrect ? 1 : 0)) / totalRounds) * 100));
        setFinalScore(calculated);
        setGameState('complete');
      }
    }, 2200);
  };

  const instructionsAudio = `Cup Shuffle. Watch the wooden cups closely as they swap places and follow which cup contains the golden coin. There are ${numCups} cups in this round.`;

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header 
        title={t('game_cup_shuffle_title')} 
        subtitle={t('game_cup_shuffle_desc')}
        audioPrompt={instructionsAudio}
        showBack 
        onBack={() => navigateTo('patient_games')} 
      />

      <div className="flex-1 p-4 sm:p-5 space-y-4 max-w-md mx-auto w-full flex flex-col justify-between overflow-y-auto custom-scrollbar">
        
        {/* Top Status & Level Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between bg-white dark:bg-stone-850 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-soft">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                {t('level_label')}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`w-7 h-7 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      level === lvl
                        ? 'bg-teal-600 text-white shadow-xs scale-105'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={startNewSession}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
              title="Reset Round"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-3.5 rounded-2xl shadow-soft">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>{t('cup_shuffle_round_status', { round: roundNumber, total: totalRounds, cups: numCups })}</span>
              </span>
              <span className="text-xs font-semibold text-stone-500">
                {t('score_progress', { correct: correctCount, total: totalRounds })}
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              {gameState === 'initial' && t('cup_shuffle_hint_initial')}
              {gameState === 'shuffling' && t('cup_shuffle_hint_shuffling')}
              {gameState === 'choose' && t('cup_shuffle_hint_choose')}
              {gameState === 'revealed' && (selectedCup === coinPosition ? t('cup_shuffle_found') : t('cup_shuffle_missed'))}
            </p>
          </div>
        </div>

        {/* Cups Stage Area (Supports 2, 3, or 4 cups) */}
        <div className="my-auto py-8 bg-white dark:bg-stone-850 rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-soft p-4 sm:p-6 text-center">
          
          <div 
            className="grid gap-2 sm:gap-3 items-end min-h-[160px] relative justify-center"
            style={{ gridTemplateColumns: `repeat(${numCups}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: numCups }).map((_, slotIndex) => {
              const isCoinHere = coinPosition === slotIndex;
              const isSelected = selectedCup === slotIndex;
              const isLifted = (gameState === 'initial' && isCoinHere) || gameState === 'revealed';

              return (
                <div 
                  key={slotIndex}
                  onClick={() => handlePickCup(slotIndex)}
                  className={`flex flex-col items-center justify-end cursor-pointer transition-all duration-300 ${
                    gameState === 'choose' ? 'hover:-translate-y-2 active:scale-95' : ''
                  }`}
                >
                  {/* The Cup Object */}
                  <div className={`transition-all duration-300 transform ${
                    isLifted ? '-translate-y-12' : 'translate-y-0'
                  }`}>
                    <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-t-3xl bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 border-4 border-amber-500/80 shadow-lg flex flex-col items-center justify-start pt-2 relative">
                      <div className="w-6 sm:w-8 h-2 bg-amber-400/60 rounded-full mb-1" />
                      <div className="w-10 sm:w-12 h-1 bg-amber-950/40 rounded-full" />
                      <span className="text-[10px] text-amber-200/80 font-bold mt-auto pb-2">
                        #{slotIndex + 1}
                      </span>
                    </div>
                  </div>

                  {/* Golden Coin underneath */}
                  <div className="h-10 flex items-center justify-center -mt-3">
                    {isCoinHere && (gameState === 'initial' || gameState === 'revealed') ? (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 border-2 border-yellow-200 shadow-md flex items-center justify-center text-amber-950 font-black text-sm animate-bounce">
                        🪙
                      </div>
                    ) : (
                      <div className="w-8 h-2 bg-stone-200 dark:bg-stone-700 rounded-full opacity-60" />
                    )}
                  </div>

                  {/* Choose Indicator */}
                  {gameState === 'choose' && (
                    <button
                      type="button"
                      className="mt-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 animate-pulse cursor-pointer"
                    >
                      Pick
                    </button>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Controls */}
        <div className="pt-2">
          {gameState === 'initial' && (
            <button
              type="button"
              onClick={handleStartShuffle}
              className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-base shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <Play size={20} fill="currentColor" />
              <span>{t('cup_shuffle_start_btn')}</span>
            </button>
          )}

          {gameState === 'shuffling' && (
            <div className="py-4 px-6 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold text-center text-sm flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-500 animate-ping" />
              <span>{t('cup_shuffle_hint_shuffling')}</span>
            </div>
          )}

          {gameState === 'choose' && (
            <div className="py-4 px-6 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 text-teal-800 dark:text-teal-200 font-extrabold text-center text-sm animate-pulse">
              {t('cup_shuffle_hint_choose')}
            </div>
          )}

          {gameState === 'revealed' && (
            <div className="py-4 px-6 rounded-2xl bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 font-extrabold text-center text-sm">
              {selectedCup === coinPosition ? t('cup_shuffle_found') : t('cup_shuffle_missed')}
            </div>
          )}
        </div>

      </div>

      {/* Adaptive Modal */}
      <AdaptiveDifficultyModal
        isOpen={gameState === 'complete'}
        gameId="cup_shuffle"
        gameTitle={t('game_cup_shuffle_title')}
        score={finalScore}
        timeSpentSeconds={timeSpent}
        mistakes={mistakes}
        hintsUsed={0}
        onPlayAgain={startNewSession}
        onExit={() => navigateTo('patient_games')}
      />

    </div>
  );
};
