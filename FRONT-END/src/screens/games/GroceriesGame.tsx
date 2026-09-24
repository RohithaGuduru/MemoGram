import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Check, 
  HelpCircle, 
  ArrowRight, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  EyeOff, 
  Eye, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { AdaptiveDifficultyModal } from './AdaptiveDifficultyModal';
import { speechService } from '../../services/speechService';

interface GroceryItem {
  id: string;
  name: string;
  emoji: string;
  category: string;
}

const ALL_STORE_ITEMS: GroceryItem[] = [
  { id: 'item-milk', name: 'Fresh Milk', emoji: '🥛', category: 'Dairy' },
  { id: 'item-bread', name: 'Whole Wheat Bread', emoji: '🍞', category: 'Bakery' },
  { id: 'item-apple', name: 'Red Apple', emoji: '🍎', category: 'Fruits' },
  { id: 'item-rice', name: 'Basmati Rice', emoji: '🍚', category: 'Grains' },
  { id: 'item-tomato', name: 'Juicy Tomato', emoji: '🍅', category: 'Vegetables' },
  { id: 'item-banana', name: 'Yellow Banana', emoji: '🍌', category: 'Fruits' },
  { id: 'item-egg', name: 'Farm Eggs', emoji: '🥚', category: 'Dairy' },
  { id: 'item-tea', name: 'Assam Tea', emoji: '☕', category: 'Beverages' },
  { id: 'item-carrot', name: 'Crisp Carrot', emoji: '🥕', category: 'Vegetables' },
  { id: 'item-honey', name: 'Pure Honey', emoji: '🍯', category: 'Sweet' },
];

export const GroceriesGame: React.FC = () => {
  const { navigateTo, adaptiveDifficulties, t } = useApp();
  const difficulty = adaptiveDifficulties.groceries || 'standard';

  const getItemName = (item: GroceryItem) => {
    const key = 'item_' + item.id.replace('item-', '');
    const localized = t(key);
    return localized !== key ? localized : item.name;
  };

  // Levels 1 to 5:
  // Level 1: 2 items + 4 distractors
  // Level 2: 2 items + 6 distractors
  // Level 3: 3 items + 5 distractors
  // Level 4: 3 items + 7 distractors
  // Level 5: 4 items + 6 distractors
  const defaultLevel = difficulty === 'easier' ? 1 : difficulty === 'challenging' ? 5 : 3;
  const [level, setLevel] = useState<number>(defaultLevel);

  const targetCount = level <= 2 ? 2 : level <= 4 ? 3 : 4;
  const shelfCount = level === 1 ? 6 : (level === 2 || level === 3) ? 8 : 10;

  const [targetItems, setTargetItems] = useState<GroceryItem[]>([]);
  const [displayedStoreItems, setDisplayedStoreItems] = useState<GroceryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'memorize' | 'select' | 'complete'>('memorize');
  const [countdown, setCountdown] = useState(8);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHintList, setShowHintList] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);

  // Initialize randomized shopping list & market shelf
  const startNewGame = () => {
    const shuffled = [...ALL_STORE_ITEMS].sort(() => 0.5 - Math.random());
    const selectedTargets = shuffled.slice(0, targetCount);
    
    // Distractors: other items from store up to shelfCount
    const distractors = shuffled.slice(targetCount, shelfCount);
    const shelfItems = [...selectedTargets, ...distractors].sort(() => 0.5 - Math.random());

    setTargetItems(selectedTargets);
    setDisplayedStoreItems(shelfItems);
    setSelectedIds([]);
    setGameState('memorize');
    setCountdown(level <= 2 ? 10 : level <= 4 ? 8 : 6);
    setStartTime(Date.now());
    setHintsUsed(0);
    setShowHintList(false);
    setMistakesCount(0);
  };

  useEffect(() => {
    setLevel(defaultLevel);
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, [level]);

  // Memorization countdown timer
  useEffect(() => {
    if (gameState === 'memorize') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState('select');
      }
    }
  }, [gameState, countdown]);

  const handleToggleItem = (id: string) => {
    speechService.playChime('gentle_click');
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleUseHint = () => {
    setHintsUsed((prev) => prev + 1);
    setShowHintList(true);
    setTimeout(() => setShowHintList(false), 3000);
  };

  const handleFinishShopping = () => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    setTimeSpent(elapsed);

    // Calculate accuracy & mistakes
    const targetIds = targetItems.map((t) => t.id);
    let correctPicks = 0;
    let wrongPicks = 0;

    selectedIds.forEach((id) => {
      if (targetIds.includes(id)) {
        correctPicks += 1;
      } else {
        wrongPicks += 1;
      }
    });

    const missedCount = targetIds.filter((id) => !selectedIds.includes(id)).length;
    const totalMistakes = wrongPicks + missedCount;
    setMistakesCount(totalMistakes);

    const calculatedScore = Math.max(
      40,
      Math.round(((correctPicks / targetCount) * 100) - (wrongPicks * 10) - (hintsUsed * 5))
    );
    setFinalScore(calculatedScore);

    setGameState('complete');
  };

  const memorizeAudio = `Shopping list to remember: ${targetItems.map((t) => getItemName(t)).join(', ')}. Look closely and remember them.`;
  const selectAudio = "The shopping list is now hidden! Select the items from the shelf that were on your list.";

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Game Header */}
      <Header 
        title={t('game_groceries_title')} 
        subtitle={t('game_groceries_desc')}
        audioPrompt={gameState === 'memorize' ? memorizeAudio : selectAudio}
        showBack 
        onBack={() => navigateTo('patient_games')} 
      />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Level Selector Bar */}
        <div className="max-w-md mx-auto flex items-center justify-between bg-white dark:bg-stone-850 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-soft">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
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
                      ? 'bg-emerald-600 text-white shadow-xs scale-105'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[11px] font-bold text-stone-500">
            {targetCount} items • {shelfCount - targetCount} distractors
          </span>
        </div>

        {/* Game State 1: Memorization Phase */}
        {gameState === 'memorize' && (
          <div className="space-y-4 max-w-md mx-auto animate-fade-in">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 p-5 rounded-3xl text-center shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles size={16} />
                  <span>{t('groceries_step1_memorize')}</span>
                </span>
                <span className="text-xs font-black bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-3 py-1 rounded-full animate-pulse">
                  ⏱️ {countdown}s
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-2">
                {t('groceries_remember_items', { count: targetCount })}
              </h2>
              <p className="text-xs text-stone-500 mb-4">
                {t('groceries_memorize_desc')}
              </p>

              {/* Items Card Display */}
              <div className="grid grid-cols-2 gap-2.5">
                {targetItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 shadow-xs animate-float"
                  >
                    <span className="text-3xl">{item.emoji}</span>
                    <div className="text-left">
                      <p className="font-extrabold text-sm text-stone-900 dark:text-stone-100">{getItemName(item)}</p>
                      <p className="text-[10px] text-stone-400 font-semibold">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGameState('select')}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>{t('groceries_btn_start_shopping')}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Game State 2: Selection / Recall Phase */}
        {gameState === 'select' && (
          <div className="space-y-4 max-w-md mx-auto animate-fade-in">
            <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                    {t('groceries_find_items')}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {t('groceries_selected_count', { selected: selectedIds.length, total: targetCount })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleUseHint}
                  className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye size={14} />
                  <span>{t('peek_hint', { hints: hintsUsed })}</span>
                </button>
              </div>

              {/* Temporary Hint Peek */}
              {showHintList && (
                <div className="p-3 my-2 rounded-2xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 text-amber-950 dark:text-amber-100 text-xs font-semibold animate-fade-in">
                  <span>{t('list_reminder')} </span>
                  {targetItems.map((tItem) => `${getItemName(tItem)} ${tItem.emoji}`).join(', ')}
                </div>
              )}

              {/* Store Shelf Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                {displayedStoreItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-150 flex items-center justify-between select-none ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 shadow-sm scale-[1.02]'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/80 hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="text-left">
                          <p className="font-bold text-xs text-stone-900 dark:text-stone-100 leading-tight">
                            {getItemName(item)}
                          </p>
                          <p className="text-[10px] text-stone-400">{item.category}</p>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700'
                      }`}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={startNewGame}
                className="py-3 px-4 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>{t('btn_play_again')}</span>
              </button>

              <button
                type="button"
                onClick={handleFinishShopping}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle2 size={18} />
                <span>{t('groceries_btn_finish')} ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Adaptive Difficulty Modal */}
      <AdaptiveDifficultyModal
        isOpen={gameState === 'complete'}
        gameId="groceries"
        gameTitle={t('game_groceries_title')}
        score={finalScore}
        timeSpentSeconds={timeSpent}
        mistakes={mistakesCount}
        hintsUsed={hintsUsed}
        onPlayAgain={startNewGame}
        onExit={() => navigateTo('patient_games')}
      />

    </div>
  );
};
