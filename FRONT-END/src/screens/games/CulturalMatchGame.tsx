import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  MapPin, 
  Tag 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { AdaptiveDifficultyModal } from './AdaptiveDifficultyModal';
import { speechService } from '../../services/speechService';

interface CulturalCardItem {
  pairId: string;
  name: string;
  emoji: string;
  category: string;
  region: string;
}

interface CulturalCard {
  id: string;
  pairId: string;
  name: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const REGIONS = [
  'All Regions',
  'Assam & North-East',
  'Bengal & East',
  'North India',
  'South India',
  'West India'
];

const CATEGORIES = [
  'All Categories',
  'Traditional Foods',
  'Festivals',
  'Traditional Clothing',
  'Music & Instruments',
  'Arts & Crafts'
];

const ALL_CULTURAL_ITEMS: CulturalCardItem[] = [
  // Traditional Foods
  { pairId: 'pitha', name: 'Assam Til Pitha', emoji: '🥟', category: 'Traditional Foods', region: 'Assam & North-East' },
  { pairId: 'chai', name: 'Assam Spiced Chai', emoji: '☕', category: 'Traditional Foods', region: 'Assam & North-East' },
  { pairId: 'rosogolla', name: 'Kolkata Rosogolla', emoji: '🍬', category: 'Traditional Foods', region: 'Bengal & East' },
  { pairId: 'dosa', name: 'Crispy Dosa', emoji: '🥞', category: 'Traditional Foods', region: 'South India' },
  { pairId: 'samosa', name: 'Punjab Samosa', emoji: '🥟', category: 'Traditional Foods', region: 'North India' },
  { pairId: 'modak', name: 'Steamed Modak', emoji: '🥟', category: 'Traditional Foods', region: 'West India' },

  // Festivals
  { pairId: 'bihu', name: 'Bihu Celebration', emoji: '🪔', category: 'Festivals', region: 'Assam & North-East' },
  { pairId: 'durga', name: 'Durga Puja Lotus', emoji: '🪷', category: 'Festivals', region: 'Bengal & East' },
  { pairId: 'diwali', name: 'Diwali Clay Diya', emoji: '🪔', category: 'Festivals', region: 'All Regions' },
  { pairId: 'holi', name: 'Holi Gulal Colors', emoji: '🎨', category: 'Festivals', region: 'North India' },
  { pairId: 'pongal', name: 'Pongal Harvest Pot', emoji: '🏺', category: 'Festivals', region: 'South India' },
  { pairId: 'ganesh', name: 'Ganesh Utsav', emoji: '🐘', category: 'Festivals', region: 'West India' },

  // Traditional Clothing
  { pairId: 'muga', name: 'Golden Muga Silk', emoji: '👘', category: 'Traditional Clothing', region: 'Assam & North-East' },
  { pairId: 'gamusa', name: 'Assam Gamusa Scarf', emoji: '🧣', category: 'Traditional Clothing', region: 'Assam & North-East' },
  { pairId: 'turban', name: 'Royal Turban', emoji: '👳', category: 'Traditional Clothing', region: 'North India' },
  { pairId: 'kanjeevaram', name: 'Kanjeevaram Saree', emoji: '👘', category: 'Traditional Clothing', region: 'South India' },
  { pairId: 'kurta', name: 'Cotton Kurta', emoji: '👔', category: 'Traditional Clothing', region: 'All Regions' },
  { pairId: 'dhoti', name: 'Traditional Dhoti', emoji: '👘', category: 'Traditional Clothing', region: 'Bengal & East' },

  // Music & Instruments
  { pairId: 'dhol', name: 'Bihu Dhol', emoji: '🥁', category: 'Music & Instruments', region: 'Assam & North-East' },
  { pairId: 'flute', name: 'Krishna Bansuri', emoji: '🪈', category: 'Music & Instruments', region: 'North India' },
  { pairId: 'tabla', name: 'Classical Tabla', emoji: '🪘', category: 'Music & Instruments', region: 'All Regions' },
  { pairId: 'sitar', name: 'Sitar Melody', emoji: '🎸', category: 'Music & Instruments', region: 'Bengal & East' },
  { pairId: 'veena', name: 'Saraswati Veena', emoji: '🎻', category: 'Music & Instruments', region: 'South India' },
  { pairId: 'ghungroo', name: 'Dancing Bells', emoji: '🔔', category: 'Music & Instruments', region: 'All Regions' },

  // Arts & Crafts
  { pairId: 'jaapi', name: 'Assam Jaapi Hat', emoji: '👒', category: 'Arts & Crafts', region: 'Assam & North-East' },
  { pairId: 'pot', name: 'Clay Water Pot', emoji: '🏺', category: 'Arts & Crafts', region: 'All Regions' },
  { pairId: 'madhubani', name: 'Folk Painting', emoji: '🖼️', category: 'Arts & Crafts', region: 'Bengal & East' },
  { pairId: 'kettle', name: 'Brass Tea Kettle', emoji: '🫖', category: 'Arts & Crafts', region: 'North India' },
  { pairId: 'terracotta', name: 'Terracotta Craft', emoji: '🐘', category: 'Arts & Crafts', region: 'South India' },
  { pairId: 'basket', name: 'Bamboo Basket', emoji: '🧺', category: 'Arts & Crafts', region: 'Assam & North-East' },
];

export const CulturalMatchGame: React.FC = () => {
  const { navigateTo, adaptiveDifficulties, t } = useApp();
  const difficulty = adaptiveDifficulties.cultural_match || 'standard';

  const getRegionLabel = (r: string) => {
    const map: Record<string, string> = {
      'All Regions': 'region_all',
      'Assam & North-East': 'region_northeast',
      'Bengal & East': 'region_east',
      'North India': 'region_north',
      'South India': 'region_south',
      'West India': 'region_west',
    };
    const key = map[r];
    return key ? t(key) : r;
  };

  const getCategoryLabel = (c: string) => {
    const map: Record<string, string> = {
      'All Categories': 'cat_all',
      'Traditional Foods': 'cat_foods',
      'Festivals': 'cat_festivals',
      'Traditional Clothing': 'cat_clothing',
      'Music & Instruments': 'cat_music',
      'Arts & Crafts': 'cat_crafts',
    };
    const key = map[c];
    return key ? t(key) : c;
  };

  // Level 1: 3 pairs, Level 2: 4 pairs, Level 3: 5 pairs, Level 4: 6 pairs
  const defaultLevel = difficulty === 'easier' ? 1 : difficulty === 'challenging' ? 4 : 2;
  const [level, setLevel] = useState<number>(defaultLevel);
  const pairCount = level === 1 ? 3 : level === 2 ? 4 : level === 3 ? 5 : 6;

  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');

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

  // Filter cultural items according to user region & category
  const filteredPool = useMemo(() => {
    let pool = ALL_CULTURAL_ITEMS;
    if (selectedRegion !== 'All Regions') {
      pool = pool.filter((item) => item.region === selectedRegion || item.region === 'All Regions');
    }
    if (selectedCategory !== 'All Categories') {
      pool = pool.filter((item) => item.category === selectedCategory);
    }
    // If filtered pool is too small, fallback to whole pool
    if (pool.length < pairCount) {
      pool = ALL_CULTURAL_ITEMS;
    }
    return pool;
  }, [selectedRegion, selectedCategory, pairCount]);

  const startNewGame = () => {
    const shuffledItems = [...filteredPool].sort(() => 0.5 - Math.random());
    const selectedPairs = shuffledItems.slice(0, pairCount);
    const deck: CulturalCard[] = [];

    selectedPairs.forEach((item) => {
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

    const shuffledDeck = deck.sort(() => 0.5 - Math.random());
    setCards(shuffledDeck);
    setFlippedIndices([]);
    setMatchedPairsCount(0);
    setAttempts(0);
    setMistakes(0);
    setHintsUsed(0);
    setStartTime(Date.now());
    setIsComplete(false);
  };

  useEffect(() => {
    setLevel(defaultLevel);
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, [level, selectedRegion, selectedCategory]);

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
      const card1 = newCards[firstIdx];
      const card2 = newCards[secondIdx];

      if (card1.pairId === card2.pairId) {
        // Matched!
        speechService.playChime('success_bell');
        card1.isMatched = true;
        card2.isMatched = true;
        setMatchedPairsCount((prev) => prev + 1);
        setFlippedIndices([]);

        if (matchedPairsCount + 1 === pairCount) {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          setTimeSpent(elapsed);
          const score = Math.max(50, 100 - mistakes * 8 - hintsUsed * 5);
          setFinalScore(score);
          setTimeout(() => setIsComplete(true), 600);
        }
      } else {
        // Mismatch
        speechService.playChime('warning');
        setMistakes((prev) => prev + 1);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const handlePeekAll = () => {
    setHintsUsed((prev) => prev + 1);
    setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));
    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) => (c.isMatched ? c : { ...c, isFlipped: false }))
      );
    }, 2000);
  };

  const instructionsAudio = `Cultural Memory Match. Select a region and category, then flip cards to find matching pairs of heritage symbols, traditional foods, and festivals.`;

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header 
        title={t('game_cultural_match_title')} 
        subtitle={t('game_cultural_match_desc')}
        audioPrompt={instructionsAudio}
        showBack 
        onBack={() => navigateTo('patient_games')} 
      />

      <div className="flex-1 p-4 sm:p-5 space-y-3.5 max-w-md mx-auto w-full overflow-y-auto custom-scrollbar">
        
        {/* Region & Category Selectors */}
        <div className="bg-white dark:bg-stone-850 p-3.5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-purple-900 dark:text-purple-300">
              <MapPin size={13} />
              <span>{t('region_all')}</span>
            </div>

            {/* Level Selector 1 to 4 */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-extrabold text-stone-400 mr-1">{t('level_label')}</span>
              {[1, 2, 3, 4].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`w-6 h-6 rounded-lg text-xs font-black cursor-pointer transition-all ${
                    level === lvl
                      ? 'bg-purple-600 text-white shadow-xs scale-105'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Region horizontal pill bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRegion(r)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedRegion === r
                    ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-300'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {getRegionLabel(r)}
              </button>
            ))}
          </div>

          {/* Category horizontal pill bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1 border-t border-stone-100 dark:border-stone-800">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {getCategoryLabel(c)}
              </button>
            ))}
          </div>
        </div>

        {/* Status card */}
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-3.5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>{t('score_progress', { correct: matchedPairsCount, total: pairCount })}</span>
            </span>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Attempts: {attempts} • {t('mistakes_label')}: {mistakes}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePeekAll}
              className="p-2 rounded-xl bg-white dark:bg-stone-850 text-purple-800 dark:text-purple-300 border border-purple-200 hover:bg-purple-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Peek All"
            >
              <Eye size={14} />
              <span>{t('peek_hint', { hints: hintsUsed })}</span>
            </button>
            <button
              type="button"
              onClick={startNewGame}
              className="p-2 rounded-xl bg-white dark:bg-stone-850 text-stone-600 hover:bg-stone-100 cursor-pointer"
              title="Restart"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Card Grid */}
        <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft">
          <div 
            className={`grid gap-2.5 ${
              pairCount <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4'
            }`}
          >
            {cards.map((card, idx) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className={`h-24 sm:h-26 rounded-2xl p-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none shadow-xs active:scale-95 ${
                  card.isMatched
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 opacity-80'
                    : card.isFlipped
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-2 border-purple-500 scale-102 shadow-md'
                    : 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white hover:brightness-105 border border-purple-400/50'
                }`}
              >
                {card.isFlipped || card.isMatched ? (
                  <div className="flex flex-col items-center justify-center text-center animate-fade-in">
                    <span className="text-3xl mb-1">{card.emoji}</span>
                    <span className="text-[10px] font-bold text-stone-800 dark:text-stone-100 leading-tight max-w-[80px] truncate">
                      {card.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-purple-200">
                    <Sparkles size={22} className="opacity-70 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-wider mt-1 opacity-80">
                      Memogram
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Adaptive Modal */}
      <AdaptiveDifficultyModal
        isOpen={isComplete}
        gameId="cultural_match"
        gameTitle={t('game_cultural_match_title')}
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
