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
  const { navigateTo, adaptiveDifficulties } = useApp();
  const difficulty = adaptiveDifficulties.cup_shuffle || 'standard';

  // Shuffle speed & rounds based on difficulty
  const shuffleRounds = difficulty === 'easier' ? 4 : difficulty === 'challenging' ? 8 : 6;
  const swapDurationMs = difficulty === 'easier' ? 650 : difficulty === 'challenging' ? 400 : 500;

  const [coinPosition, setCoinPosition] = useState<number>(1); // 0, 1, 2
  const [cupPositions, setCupPositions] = useState<number[]>([0, 1, 2]); // maps visual slot to cup ID
  const [gameState, setGameState] = useState<'initial' | 'shuffling' | 'choose' | 'revealed' | 'complete'>('initial');
  const [selectedCup, setSelectedCup] = useState<number | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [totalRounds] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  const startNewSession = () => {
    setRoundNumber(1);
    setCorrectCount(0);
    setMistakes(0);
    setStartTime(Date.now());
    prepareRound(0);
  };

  const prepareRound = (initialCoin: number = Math.floor(Math.random() * 3)) => {
    setCoinPosition(initialCoin);
    setCupPositions([0, 1, 2]);
    setSelectedCup(null);
    setGameState('initial');
  };

  useEffect(() => {
    startNewSession();
  }, [difficulty]);

  const handleStartShuffle = () => {
    speechService.playChime('gentle_click');
    setGameState('shuffling');

    let currentCoin = coinPosition;
    let swapsLeft = shuffleRounds;

    const interval = setInterval(() => {
      swapsLeft -= 1;
      
      // Randomly pick two distinct cup slots to swap
      const idx1 = Math.floor(Math.random() * 3);
      let idx2 = (idx1 + 1 + Math.floor(Math.random() * 2)) % 3;

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
        prepareRound(Math.floor(Math.random() * 3));
      } else {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        setTimeSpent(elapsed);
        const calculated = Math.max(50, Math.round(((correctCount + (isCorrect ? 1 : 0)) / totalRounds) * 100));
        setFinalScore(calculated);
        setGameState('complete');
      }
    }, 2200);
  };

  const promptAudio = gameState === 'initial' 
    ? "Watch the golden coin placed under the middle cup, then tap Start Shuffle to track it."
    : gameState === 'choose'
    ? "Where is the golden coin? Tap the cup you think is hiding it."
    : "Great concentration!";

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header 
        title="Cup Shuffle" 
        subtitle="Attention & Visual Focus"
        audioPrompt={promptAudio}
        showBack 
        onBack={() => navigateTo('patient_games')} 
      />

      <div className="flex-1 p-4 sm:p-5 space-y-4 max-w-md mx-auto w-full overflow-y-auto custom-scrollbar flex flex-col justify-between">
        
        {/* Status card */}
        <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 p-4 rounded-3xl shadow-soft">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
              <Eye size={15} className="text-teal-600" />
              <span>Round {roundNumber} of {totalRounds}</span>
            </span>
            <span className="text-xs font-semibold text-stone-500">
              Score: {correctCount}/{totalRounds}
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            {gameState === 'initial' && 'Look at the golden coin, then tap Start Shuffle.'}
            {gameState === 'shuffling' && 'Follow the cups closely with your eyes...'}
            {gameState === 'choose' && 'Tap the cup that has the golden coin!'}
            {gameState === 'revealed' && (selectedCup === coinPosition ? '🎉 You found the coin!' : '👀 The coin was in the other cup!')}
          </p>
        </div>

        {/* 3 Cups Stage Area */}
        <div className="my-auto py-8 bg-white dark:bg-stone-850 rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-soft p-6 text-center">
          
          <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end min-h-[160px] relative">
            {[0, 1, 2].map((slotIndex) => {
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
                    <div className="w-18 h-22 sm:w-20 sm:h-24 rounded-t-3xl bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 border-4 border-amber-500/80 shadow-lg flex flex-col items-center justify-start pt-2 relative">
                      <div className="w-8 h-2 bg-amber-400/60 rounded-full mb-1" />
                      <div className="w-12 h-1 bg-amber-950/40 rounded-full" />
                      <span className="text-[10px] text-amber-200/80 font-bold mt-auto pb-2">
                        #{slotIndex + 1}
                      </span>
                    </div>
                  </div>

                  {/* Golden Coin underneath */}
                  <div className="h-10 flex items-center justify-center -mt-3">
                    {isCoinHere && (gameState === 'initial' || gameState === 'revealed') ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 border-2 border-yellow-200 shadow-md flex items-center justify-center text-amber-950 font-black text-sm animate-bounce">
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
                      className="mt-2 px-3 py-1 text-xs font-bold rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 animate-pulse"
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
              className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-extrabold text-lg shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Play size={20} fill="currentColor" />
              <span>Start Shuffle</span>
            </button>
          )}

          {gameState === 'shuffling' && (
            <div className="w-full py-3.5 px-6 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-center text-sm animate-pulse">
              👀 Shuffling cups... Keep your eyes on the coin!
            </div>
          )}

          {gameState === 'choose' && (
            <div className="w-full py-3.5 px-6 rounded-2xl bg-teal-600 text-white font-bold text-center text-base shadow-md">
              👇 Tap the cup hiding the coin!
            </div>
          )}
        </div>

      </div>

      {/* Adaptive Difficulty Modal */}
      <AdaptiveDifficultyModal
        isOpen={gameState === 'complete'}
        gameId="cup_shuffle"
        gameTitle="Cup Shuffle"
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
