import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { AdaptiveDifficultyModal } from './AdaptiveDifficultyModal';
import { speechService } from '../../services/speechService';

interface CulturalCard {
  id: string;
  pairId: string;
  name: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CULTURAL_ITEMS = [
  { pairId: 'diya', name: 'Diya Lamp', emoji: '🪔' },
  { pairId: 'tea', name: 'Assam Tea', emoji: '☕' },
  { pairId: 'lotus', name: 'Lotus Flower', emoji: '🪷' },
  { pairId: 'flute', name: 'Bamboo Flute', emoji: '🪈' },
  { pairId: 'pot', name: 'Traditional Pot', emoji: '🏺' },
  { pairId: 'drum', name: 'Folk Dhol / Tabla', emoji: '🥁' },
];

export const CulturalMatchGame: React.FC = () => {
  const { navigateTo, adaptiveDifficulties } = useApp();
  const difficulty = adaptiveDifficulties.cultural_match || 'standard';

  // 4 pairs (8 cards) if easier, 6 pairs (12 cards) if standard/challenging
  const pairCount = difficulty === 'easier' ? 4 : difficulty === 'challenging' ? 6 : 5;

  const [cards, setCards] = useState<CulturalCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const startNewGame = () => {
    const selectedPairs = CULTURAL_ITEMS.slice(0, pairCount);
    const deck: CulturalCard[] = [];

    selectedPairs.forEach((item, idx) => {
      deck.push({
        id: `${item.pairId}-a`,
        pairId: item.pairId,
        name: item.name,
        emoji: item.emoji,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: `${item.pairId}-b`,
        pairId: item.pairId,
        name: item.name,
        emoji: item.emoji,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle deck
    const shuffled = deck.sort(() => 0.5 - Math.random());
    setCards(shuffled);
    setFlippedIndices([]);
    setMatchedPairsCount(0);
    setAttempts(0);
    setMistakes(0);
    setHintsUsed(0);
    setStartTime(Date.now());
    setIsComplete(false);
  };

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || flippedIndices.length === 2) {
      return;
    }

    speechService.playChime('card_flip');

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setAttempts((prev) => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (cards[firstIdx].pairId === cards[secondIdx].pairId) {
        // MATCH!
        setTimeout(() => {
          speechService.playChime('success_bell');
          const updated = [...newCards];
          updated[firstIdx].isMatched = true;
          updated[secondIdx].isMatched = true;
          setCards(updated);
          setFlippedIndices([]);
          setMatchedPairsCount((prev) => {
            const nextCount = prev + 1;
            if (nextCount === pairCount) {
              // Game Completed!
              const elapsed = Math.round((Date.now() - startTime) / 1000);
              setTimeSpent(elapsed);
              const score = Math.max(50, 100 - (mistakes * 5) - (hintsUsed * 5));
              setFinalScore(score);
              setIsComplete(true);
            }
            return nextCount;
          });
        }, 500);
      } else {
        // NO MATCH
        setMistakes((prev) => prev + 1);
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIdx].isFlipped = false;
          resetCards[secondIdx].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 1100);
      }
    }
  };

  const handlePeekHint = () => {
    setHintsUsed((prev) => prev + 1);
    speechService.playChime('gentle_click');

    // Briefly flip all un-matched cards
    setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));
    setTimeout(() => {
      setCards((prev) => prev.map((c) => (c.isMatched ? c : { ...c, isFlipped: false })));
    }, 1200);
  };

  const audioPrompt = "Cultural Memory Match. Tap cards to turn them over and pair matching symbols like the Diya lamp, Tea cup, and Lotus flower.";

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header 
        title="Cultural Memory Match" 
        subtitle="Heritage Symbol Pairing"
        audioPrompt={audioPrompt}
        showBack 
        onBack={() => navigateTo('patient_games')} 
      />

      <div className="flex-1 p-4 sm:p-5 space-y-4 max-w-md mx-auto w-full overflow-y-auto custom-scrollbar">
        
        {/* Game Status bar */}
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-4 rounded-3xl shadow-soft flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Sparkles size={15} />
              <span>Pairs Found: {matchedPairsCount} of {pairCount}</span>
            </span>
            <p className="text-xs text-stone-500 mt-0.5">
              Attempts: {attempts} • Mistakes: {mistakes}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePeekHint}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-stone-800 hover:bg-purple-100 border border-purple-200 dark:border-purple-700 text-purple-900 dark:text-purple-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Eye size={14} />
            <span>Peek ({hintsUsed})</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className={`grid gap-3 ${pairCount <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {cards.map((card, index) => {
            const showFace = card.isFlipped || card.isMatched;

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`h-24 sm:h-28 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center p-2 text-center select-none shadow-xs transform active:scale-95 ${
                  card.isMatched
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 opacity-90 scale-[0.98]'
                    : showFace
                    ? 'border-purple-500 bg-white dark:bg-stone-800 shadow-md rotate-y-180'
                    : 'border-stone-300 dark:border-stone-700 bg-gradient-to-br from-purple-100 to-teal-50 dark:from-stone-800 dark:to-stone-850 hover:border-purple-400'
                }`}
              >
                {showFace ? (
                  <>
                    <span className="text-3xl sm:text-4xl animate-bounce">{card.emoji}</span>
                    <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300 mt-1 line-clamp-1">
                      {card.name}
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-purple-600 dark:text-purple-400">
                    <Sparkles size={24} />
                    <span className="text-[9px] font-extrabold tracking-widest uppercase mt-1 opacity-70">
                      Memogram
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Restart Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={startNewGame}
            className="w-full py-3 px-4 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={15} />
            <span>Shuffle & Restart</span>
          </button>
        </div>

      </div>

      {/* Adaptive Difficulty Modal */}
      <AdaptiveDifficultyModal
        isOpen={isComplete}
        gameId="cultural_match"
        gameTitle="Cultural Memory Match"
        score={finalScore}
        timeSpentSeconds={timeSpent}
        mistakes={mistakes}
        hintsUsed={hintsUsed}
        onPlayAgain={startNewGame}
        onExit={() => navigateTo('patient_games')}
      />

    </div>
  );
};
