import React, { useState, useEffect } from 'react';
import { 
  ListOrdered, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { AdaptiveDifficultyModal } from './AdaptiveDifficultyModal';
import { speechService } from '../../services/speechService';

interface RoutineStep {
  id: string;
  order: number;
  title: string;
  emoji: string;
  description: string;
}

const CANONICAL_STEPS: RoutineStep[] = [
  { id: 'step-wake', order: 1, title: 'Wake Up & Stretch', emoji: '🌅', description: 'Begin the day with a gentle stretch and open the windows.' },
  { id: 'step-brush', order: 2, title: 'Brush Teeth & Freshen Up', emoji: '🪥', description: 'Wash face and brush teeth with warm water.' },
  { id: 'step-breakfast', order: 3, title: 'Eat Morning Breakfast & Chai', emoji: '☕', description: 'Enjoy warm Assam chai and toast or fresh fruits.' },
  { id: 'step-meds', order: 4, title: 'Take Morning Medicine', emoji: '💊', description: 'Take the 9:00 AM Donepezil tablet with water.' },
  { id: 'step-walk', order: 5, title: 'Gentle Walk in Garden', emoji: '🌿', description: 'Step outside for fresh morning air and sunshine.' },
];

export const RoutineSequenceGame: React.FC = () => {
  const { navigateTo, adaptiveDifficulties } = useApp();
  const difficulty = adaptiveDifficulties.routine || 'standard';

  // 4 steps if easier, 5 if standard/challenging
  const activeCount = difficulty === 'easier' ? 4 : 5;

  const [currentList, setCurrentList] = useState<RoutineStep[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const startNewGame = () => {
    const subset = CANONICAL_STEPS.slice(0, activeCount);
    // Shuffle ensuring it's not already solved
    let shuffled = [...subset].sort(() => 0.5 - Math.random());
    while (shuffled.every((item, i) => item.order === i + 1)) {
      shuffled = [...subset].sort(() => 0.5 - Math.random());
    }

    setCurrentList(shuffled);
    setStartTime(Date.now());
    setAttempts(0);
    setMistakes(0);
    setIsComplete(false);
    setValidationErrors([]);
  };

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    speechService.playChime('gentle_click');
    const updated = [...currentList];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setCurrentList(updated);
    setValidationErrors([]);
  };

  const moveDown = (index: number) => {
    if (index === currentList.length - 1) return;
    speechService.playChime('gentle_click');
    const updated = [...currentList];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setCurrentList(updated);
    setValidationErrors([]);
  };

  const handleCheckSequence = () => {
    setAttempts((prev) => prev + 1);
    const errors: string[] = [];

    currentList.forEach((item, index) => {
      if (item.order !== index + 1) {
        errors.push(item.id);
      }
    });

    if (errors.length === 0) {
      // Perfect sequence!
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setTimeSpent(elapsed);
      const score = Math.max(50, 100 - (mistakes * 10) - (attempts * 5));
      setFinalScore(score);
      setIsComplete(true);
    } else {
      speechService.playChime('warning');
      setMistakes((prev) => prev + 1);
      setValidationErrors(errors);
    }
  };

  const instructionsAudio = "Arrange these everyday morning activities in their natural chronological order from first to last using the up and down arrows.";

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header 
        title="Daily Routine in Sequence" 
        subtitle="Executive Function Activity"
        audioPrompt={instructionsAudio}
        showBack 
        onBack={() => navigateTo('patient_games')} 
      />

      <div className="flex-1 p-4 sm:p-5 space-y-4 max-w-md mx-auto w-full overflow-y-auto custom-scrollbar">
        
        {/* Intro instructions card */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-3xl shadow-soft">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles size={15} />
              <span>Arrange from Morning to Afternoon</span>
            </span>
            <span className="text-xs font-semibold text-stone-500">
              {currentList.length} Steps
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            Use the <strong>Up (▲)</strong> and <strong>Down (▼)</strong> arrows to put them in the order you do them naturally.
          </p>
        </div>

        {/* Validation Error Banner */}
        {validationErrors.length > 0 && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-900 dark:text-rose-200 text-xs font-semibold animate-fade-in flex items-center gap-2">
            <span>⚠️ A few items are not in natural order yet. Try adjusting highlighted cards!</span>
          </div>
        )}

        {/* Routine Steps Draggable / Reorderable Cards */}
        <div className="space-y-2.5">
          {currentList.map((item, index) => {
            const hasError = validationErrors.includes(item.id);

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 shadow-xs ${
                  hasError
                    ? 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/40'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 font-black text-sm flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>

                  <span className="text-2xl sm:text-3xl">{item.emoji}</span>

                  <div className="text-left">
                    <p className="font-bold text-sm text-stone-900 dark:text-stone-100 leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Up / Down Controls */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      index === 0
                        ? 'text-stone-300 border-stone-200 bg-stone-50 dark:bg-stone-800 cursor-not-allowed'
                        : 'text-stone-700 dark:text-stone-200 border-stone-300 hover:bg-amber-100 dark:hover:bg-amber-900'
                    }`}
                    aria-label="Move Up"
                  >
                    <ArrowUp size={16} />
                  </button>

                  <button
                    type="button"
                    disabled={index === currentList.length - 1}
                    onClick={() => moveDown(index)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      index === currentList.length - 1
                        ? 'text-stone-300 border-stone-200 bg-stone-50 dark:bg-stone-800 cursor-not-allowed'
                        : 'text-stone-700 dark:text-stone-200 border-stone-300 hover:bg-amber-100 dark:hover:bg-amber-900'
                    }`}
                    aria-label="Move Down"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={startNewGame}
            className="py-3 px-4 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleCheckSequence}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-extrabold text-base shadow-md shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <CheckCircle2 size={18} />
            <span>Check My Sequence</span>
          </button>
        </div>

      </div>

      {/* Adaptive Difficulty Modal */}
      <AdaptiveDifficultyModal
        isOpen={isComplete}
        gameId="routine"
        gameTitle="Daily Routine in Sequence"
        score={finalScore}
        timeSpentSeconds={timeSpent}
        mistakes={mistakes}
        hintsUsed={0}
        onPlayAgain={startNewGame}
        onExit={() => navigateTo('patient_games')}
      />

    </div>
  );
};
