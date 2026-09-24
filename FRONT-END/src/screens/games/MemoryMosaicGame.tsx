import React, { useState, useEffect } from 'react';
import { 
  Puzzle, 
  RotateCw, 
  CheckCircle2, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Sparkles, 
  HelpCircle,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { AdaptiveDifficultyModal } from './AdaptiveDifficultyModal';
import { speechService } from '../../services/speechService';

interface MosaicPiece {
  id: string;
  shape: 'square' | 'triangle' | 'quarter_circle' | 'diamond' | 'rect';
  color: string;
  rotation: number; // 0, 90, 180, 270
  label: string;
}

interface TargetSlot {
  slotId: string;
  row: number;
  col: number;
  expectedPieceId: string;
  expectedRotation: number;
  hintShape: 'square' | 'triangle' | 'quarter_circle' | 'diamond' | 'rect';
  color: string;
}

interface MosaicTarget {
  id: string;
  name: string;
  theme: string;
  gridRows: number;
  gridCols: number;
  pieces: MosaicPiece[];
  slots: TargetSlot[];
}

const MOSAIC_PATTERNS: Record<number, MosaicTarget[]> = {
  // Level 1: 3-4 pieces, simple house / sailboat, 0 deg rotation
  1: [
    {
      id: 'house-1',
      name: 'Cozy Village Home',
      theme: 'Architecture',
      gridRows: 2,
      gridCols: 2,
      pieces: [
        { id: 'p-roof-1', shape: 'triangle', color: 'bg-rose-500', rotation: 0, label: 'Red Roof' },
        { id: 'p-roof-2', shape: 'triangle', color: 'bg-rose-500', rotation: 0, label: 'Red Chimney' },
        { id: 'p-wall-1', shape: 'square', color: 'bg-amber-400', rotation: 0, label: 'Warm Wall' },
        { id: 'p-door', shape: 'rect', color: 'bg-teal-600', rotation: 0, label: 'Teal Door' },
      ],
      slots: [
        { slotId: 's-0-0', row: 0, col: 0, expectedPieceId: 'p-roof-1', expectedRotation: 0, hintShape: 'triangle', color: 'rose' },
        { slotId: 's-0-1', row: 0, col: 1, expectedPieceId: 'p-roof-2', expectedRotation: 0, hintShape: 'triangle', color: 'rose' },
        { slotId: 's-1-0', row: 1, col: 0, expectedPieceId: 'p-wall-1', expectedRotation: 0, hintShape: 'square', color: 'amber' },
        { slotId: 's-1-1', row: 1, col: 1, expectedPieceId: 'p-door', expectedRotation: 0, hintShape: 'rect', color: 'teal' },
      ]
    },
    {
      id: 'boat-1',
      name: 'Brahmaputra Sailboat',
      theme: 'Riverside',
      gridRows: 2,
      gridCols: 2,
      pieces: [
        { id: 'b-sail-1', shape: 'triangle', color: 'bg-sky-500', rotation: 0, label: 'Sky Sail' },
        { id: 'b-sun', shape: 'quarter_circle', color: 'bg-amber-400', rotation: 0, label: 'Golden Sun' },
        { id: 'b-hull-1', shape: 'rect', color: 'bg-emerald-600', rotation: 0, label: 'Boat Hull L' },
        { id: 'b-hull-2', shape: 'triangle', color: 'bg-emerald-600', rotation: 0, label: 'Boat Hull R' },
      ],
      slots: [
        { slotId: 's-0-0', row: 0, col: 0, expectedPieceId: 'b-sail-1', expectedRotation: 0, hintShape: 'triangle', color: 'sky' },
        { slotId: 's-0-1', row: 0, col: 1, expectedPieceId: 'b-sun', expectedRotation: 0, hintShape: 'quarter_circle', color: 'amber' },
        { slotId: 's-1-0', row: 1, col: 0, expectedPieceId: 'b-hull-1', expectedRotation: 0, hintShape: 'rect', color: 'emerald' },
        { slotId: 's-1-1', row: 1, col: 1, expectedPieceId: 'b-hull-2', expectedRotation: 0, hintShape: 'triangle', color: 'emerald' },
      ]
    }
  ],
  // Level 2: 5-6 pieces, some rotation
  2: [
    {
      id: 'flower-1',
      name: 'Spring Lotus Blossom',
      theme: 'Nature',
      gridRows: 3,
      gridCols: 2,
      pieces: [
        { id: 'f-p1', shape: 'triangle', color: 'bg-pink-500', rotation: 0, label: 'Pink Petal Top' },
        { id: 'f-p2', shape: 'triangle', color: 'bg-pink-500', rotation: 90, label: 'Pink Petal Side' },
        { id: 'f-center', shape: 'square', color: 'bg-amber-400', rotation: 0, label: 'Golden Center' },
        { id: 'f-p3', shape: 'quarter_circle', color: 'bg-pink-400', rotation: 180, label: 'Soft Petal' },
        { id: 'f-stem', shape: 'rect', color: 'bg-emerald-600', rotation: 0, label: 'Green Stem' },
        { id: 'f-leaf', shape: 'triangle', color: 'bg-emerald-500', rotation: 0, label: 'Green Leaf' },
      ],
      slots: [
        { slotId: 's-0-0', row: 0, col: 0, expectedPieceId: 'f-p1', expectedRotation: 0, hintShape: 'triangle', color: 'pink' },
        { slotId: 's-0-1', row: 0, col: 1, expectedPieceId: 'f-p2', expectedRotation: 90, hintShape: 'triangle', color: 'pink' },
        { slotId: 's-1-0', row: 1, col: 0, expectedPieceId: 'f-center', expectedRotation: 0, hintShape: 'square', color: 'amber' },
        { slotId: 's-1-1', row: 1, col: 1, expectedPieceId: 'f-p3', expectedRotation: 180, hintShape: 'quarter_circle', color: 'pink' },
        { slotId: 's-2-0', row: 2, col: 0, expectedPieceId: 'f-stem', expectedRotation: 0, hintShape: 'rect', color: 'emerald' },
        { slotId: 's-2-1', row: 2, col: 1, expectedPieceId: 'f-leaf', expectedRotation: 0, hintShape: 'triangle', color: 'emerald' },
      ]
    }
  ],
  // Level 3: 7-9 pieces, rotation required
  3: [
    {
      id: 'bird-1',
      name: 'Heritage Peacock',
      theme: 'Heritage Fauna',
      gridRows: 3,
      gridCols: 3,
      pieces: [
        { id: 'pk-crest', shape: 'diamond', color: 'bg-teal-400', rotation: 0, label: 'Crest Feather' },
        { id: 'pk-head', shape: 'quarter_circle', color: 'bg-blue-600', rotation: 90, label: 'Peacock Head' },
        { id: 'pk-sun', shape: 'quarter_circle', color: 'bg-amber-400', rotation: 0, label: 'Golden Glow' },
        { id: 'pk-neck', shape: 'rect', color: 'bg-blue-700', rotation: 0, label: 'Royal Neck' },
        { id: 'pk-body', shape: 'square', color: 'bg-teal-600', rotation: 0, label: 'Teal Body' },
        { id: 'pk-wing', shape: 'triangle', color: 'bg-emerald-500', rotation: 90, label: 'Emerald Wing' },
        { id: 'pk-tail1', shape: 'diamond', color: 'bg-indigo-500', rotation: 0, label: 'Tail Plume A' },
        { id: 'pk-tail2', shape: 'diamond', color: 'bg-emerald-600', rotation: 90, label: 'Tail Plume B' },
      ],
      slots: [
        { slotId: 's-0-0', row: 0, col: 0, expectedPieceId: 'pk-crest', expectedRotation: 0, hintShape: 'diamond', color: 'teal' },
        { slotId: 's-0-1', row: 0, col: 1, expectedPieceId: 'pk-head', expectedRotation: 90, hintShape: 'quarter_circle', color: 'blue' },
        { slotId: 's-0-2', row: 0, col: 2, expectedPieceId: 'pk-sun', expectedRotation: 0, hintShape: 'quarter_circle', color: 'amber' },
        { slotId: 's-1-0', row: 1, col: 0, expectedPieceId: 'pk-neck', expectedRotation: 0, hintShape: 'rect', color: 'blue' },
        { slotId: 's-1-1', row: 1, col: 1, expectedPieceId: 'pk-body', expectedRotation: 0, hintShape: 'square', color: 'teal' },
        { slotId: 's-1-2', row: 1, col: 2, expectedPieceId: 'pk-wing', expectedRotation: 90, hintShape: 'triangle', color: 'emerald' },
        { slotId: 's-2-0', row: 2, col: 0, expectedPieceId: 'pk-tail1', expectedRotation: 0, hintShape: 'diamond', color: 'indigo' },
        { slotId: 's-2-1', row: 2, col: 1, expectedPieceId: 'pk-tail2', expectedRotation: 90, hintShape: 'diamond', color: 'emerald' },
      ]
    }
  ]
};

const getPatternName = (id: string, name: string, t: (k: string, p?: any) => string): string => {
  if (id === 'house-1') return t('pattern_village_home');
  if (id === 'boat-1') return t('pattern_sailboat');
  if (id === 'flower-1') return t('pattern_lotus');
  if (id === 'bird-1') return t('pattern_peacock');
  return name;
};

export const MemoryMosaicGame: React.FC = () => {
  const { navigateTo, adaptiveDifficulties, t } = useApp();
  const difficulty = adaptiveDifficulties.memory_mosaic || 'standard';

  const numericLevel = difficulty === 'easier' ? 1 : difficulty === 'challenging' ? 3 : 2;

  const [currentLevel, setCurrentLevel] = useState<number>(numericLevel);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [placedSlots, setPlacedSlots] = useState<Record<string, { pieceId: string; rotation: number }>>({});
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [pieceRotations, setPieceRotations] = useState<Record<string, number>>({});
  const [showTargetReference, setShowTargetReference] = useState(true);
  const [isMemoryModeActive, setIsMemoryModeActive] = useState(false);
  const [memoryCountdown, setMemoryCountdown] = useState(6);
  const [isMemorizing, setIsMemorizing] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const patternList = MOSAIC_PATTERNS[currentLevel] || MOSAIC_PATTERNS[1];
  const activePattern = patternList[currentPatternIndex % patternList.length];

  const initializeGame = () => {
    setPlacedSlots({});
    setSelectedPieceId(null);
    setIsComplete(false);
    setMistakes(0);
    setAttempts(0);
    setHintsUsed(0);
    setStartTime(Date.now());

    // Initialize rotations: Level 1 has 0 deg default, Level 2/3 can randomize rotation
    const initialRotations: Record<string, number> = {};
    activePattern.pieces.forEach((p) => {
      if (currentLevel === 1) {
        initialRotations[p.id] = 0;
      } else {
        const randRot = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
        initialRotations[p.id] = randRot;
      }
    });
    setPieceRotations(initialRotations);

    if (isMemoryModeActive) {
      setIsMemorizing(true);
      setShowTargetReference(true);
      setMemoryCountdown(currentLevel === 1 ? 7 : 5);
    } else {
      setIsMemorizing(false);
      setShowTargetReference(true);
    }
  };

  useEffect(() => {
    setCurrentLevel(numericLevel);
  }, [difficulty]);

  useEffect(() => {
    initializeGame();
  }, [currentLevel, currentPatternIndex, isMemoryModeActive]);

  // Memory countdown timer
  useEffect(() => {
    if (isMemorizing && isMemoryModeActive) {
      if (memoryCountdown > 0) {
        const timer = setTimeout(() => setMemoryCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setIsMemorizing(false);
        setShowTargetReference(false);
        speechService.playChime('gentle_click');
      }
    }
  }, [isMemorizing, isMemoryModeActive, memoryCountdown]);

  const placedPieceIds = Object.values(placedSlots).map((slot) => slot.pieceId);
  const unplacedPieces = activePattern.pieces.filter((p) => !placedPieceIds.includes(p.id));

  const handleSelectPiece = (pieceId: string) => {
    speechService.playChime('gentle_click');
    if (selectedPieceId === pieceId) {
      setSelectedPieceId(null);
    } else {
      setSelectedPieceId(pieceId);
    }
  };

  const handleRotateSelectedPiece = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPieceId) return;
    speechService.playChime('card_flip');
    setPieceRotations((prev) => ({
      ...prev,
      [selectedPieceId]: ((prev[selectedPieceId] || 0) + 90) % 360,
    }));
  };

  const handleSlotClick = (slot: TargetSlot) => {
    if (isMemorizing) return;

    // If slot already has a piece placed, remove it back to tray
    if (placedSlots[slot.slotId]) {
      speechService.playChime('gentle_click');
      const removed = placedSlots[slot.slotId].pieceId;
      const next = { ...placedSlots };
      delete next[slot.slotId];
      setPlacedSlots(next);
      setSelectedPieceId(removed);
      return;
    }

    if (!selectedPieceId) return;

    // Place the selected piece
    setAttempts((prev) => prev + 1);
    const piece = activePattern.pieces.find((p) => p.id === selectedPieceId);
    const rotation = pieceRotations[selectedPieceId] || 0;

    const isPieceCorrect = slot.expectedPieceId === selectedPieceId;
    const isRotCorrect = currentLevel === 1 || slot.expectedRotation === rotation;

    if (!isPieceCorrect || !isRotCorrect) {
      setMistakes((prev) => prev + 1);
      speechService.playChime('warning');
    } else {
      speechService.playChime('gentle_click');
    }

    const updatedSlots = {
      ...placedSlots,
      [slot.slotId]: { pieceId: selectedPieceId, rotation },
    };
    setPlacedSlots(updatedSlots);
    setSelectedPieceId(null);

    // Check if puzzle is complete
    if (Object.keys(updatedSlots).length === activePattern.slots.length) {
      const allMatches = activePattern.slots.every((s) => {
        const placed = updatedSlots[s.slotId];
        if (!placed) return false;
        const matchesPiece = placed.pieceId === s.expectedPieceId;
        const matchesRot = currentLevel === 1 || placed.rotation === s.expectedRotation;
        return matchesPiece && matchesRot;
      });

      if (allMatches) {
        const elapsed = Math.max(5, Math.round((Date.now() - startTime) / 1000));
        setTimeSpent(elapsed);
        const calculatedScore = Math.max(50, 100 - (mistakes * 10) - (hintsUsed * 5));
        setFinalScore(calculatedScore);
        speechService.playChime('success_bell');
        setIsComplete(true);
      }
    }
  };

  const handlePeekTarget = () => {
    setHintsUsed((prev) => prev + 1);
    setShowTargetReference(true);
    setTimeout(() => {
      if (isMemoryModeActive) setShowTargetReference(false);
    }, 3000);
  };

  const renderShapeSvg = (shape: string, color: string, rotationDeg: number) => {
    return (
      <div 
        className="w-12 h-12 flex items-center justify-center transition-transform duration-200"
        style={{ transform: `rotate(${rotationDeg}deg)` }}
      >
        {shape === 'triangle' && (
          <div className={`w-0 h-0 border-x-[20px] border-x-transparent border-b-[36px] ${color.replace('bg-', 'border-b-')}`} />
        )}
        {shape === 'square' && (
          <div className={`w-9 h-9 rounded-md shadow-xs ${color}`} />
        )}
        {shape === 'quarter_circle' && (
          <div className={`w-9 h-9 rounded-tl-full rounded-tr-none rounded-br-none rounded-bl-none shadow-xs ${color}`} />
        )}
        {shape === 'diamond' && (
          <div className={`w-8 h-8 rotate-45 rounded-sm shadow-xs ${color}`} />
        )}
        {shape === 'rect' && (
          <div className={`w-10 h-6 rounded-md shadow-xs ${color}`} />
        )}
      </div>
    );
  };

  const instructionsAudio = `${t('game_memory_mosaic_title')}. ${t('game_memory_mosaic_desc')}`;

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header 
        title={t('game_memory_mosaic_title')} 
        subtitle={t('game_memory_mosaic_subtitle')}
        audioPrompt={instructionsAudio}
        showBack 
        onBack={() => navigateTo('patient_games')} 
      />

      <div className="flex-1 p-4 sm:p-5 space-y-4 max-w-md mx-auto w-full overflow-y-auto custom-scrollbar">
        
        {/* Level, Pattern & Mode Controls */}
        <div className="bg-white dark:bg-stone-850 p-3.5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
              {t('mosaic_level_pattern', { level: currentLevel, name: getPatternName(activePattern.id, activePattern.name, t) })}
            </span>
            <p className="text-xs font-bold text-stone-600 dark:text-stone-300 mt-1">
              {t('mosaic_pieces_count', { count: activePattern.slots.length })}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Memory mode toggle */}
            <button
              type="button"
              onClick={() => setIsMemoryModeActive(!isMemoryModeActive)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isMemoryModeActive
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
              title={t('mosaic_mode_memory')}
            >
              <Sparkles size={13} />
              <span>{isMemoryModeActive ? t('mosaic_mode_memory') : t('mosaic_mode_guided')}</span>
            </button>

            <button
              type="button"
              onClick={initializeGame}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors cursor-pointer"
              title={t('btn_restart_puzzle')}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Memorization Stage if in Memory Mode */}
        {isMemorizing && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 p-4 rounded-3xl text-center shadow-soft animate-pulse">
            <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              {t('mosaic_memorize_prompt')}
            </span>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">
              ⏱️ {memoryCountdown}s
            </p>
          </div>
        )}

        {/* Target Preview Box (Can be hidden in Memory Mode) */}
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-3.5 rounded-3xl shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>{t('mosaic_target_picture', { name: getPatternName(activePattern.id, activePattern.name, t) })}</span>
            </span>

            {isMemoryModeActive && !isMemorizing && (
              <button
                type="button"
                onClick={handlePeekTarget}
                className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Eye size={13} />
                <span>{t('mosaic_peek_target')}</span>
              </button>
            )}
          </div>

          {showTargetReference ? (
            <div className="flex justify-center p-3 bg-white dark:bg-stone-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
              <div 
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${activePattern.gridCols}, minmax(0, 1fr))` }}
              >
                {activePattern.slots.map((s) => {
                  const piece = activePattern.pieces.find((p) => p.id === s.expectedPieceId);
                  return (
                    <div 
                      key={s.slotId}
                      className="w-14 h-14 bg-indigo-50/70 dark:bg-stone-700/50 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-stone-600"
                    >
                      {piece && renderShapeSvg(piece.shape, piece.color, s.expectedRotation)}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center bg-white/60 dark:bg-stone-800/40 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800 flex flex-col items-center justify-center">
              <EyeOff size={22} className="text-indigo-400 mb-1" />
              <p className="text-xs font-extrabold text-stone-700 dark:text-stone-300">
                {t('mosaic_target_hidden')}
              </p>
            </div>
          )}
        </div>

        {/* Building Canvas Grid */}
        <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft text-center space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
              {t('mosaic_canvas_title')}
            </h3>
            <span className="text-xs font-semibold text-stone-500">
              {t('mosaic_placed_count', { count: Object.keys(placedSlots).length, total: activePattern.slots.length })}
            </span>
          </div>

          <div className="flex justify-center p-3 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700">
            <div 
              className="grid gap-2.5"
              style={{ gridTemplateColumns: `repeat(${activePattern.gridCols}, minmax(0, 1fr))` }}
            >
              {activePattern.slots.map((slot) => {
                const placed = placedSlots[slot.slotId];
                const piece = placed ? activePattern.pieces.find((p) => p.id === placed.pieceId) : null;

                return (
                  <div
                    key={slot.slotId}
                    onClick={() => handleSlotClick(slot)}
                    className={`w-16 h-16 rounded-2xl border-2 transition-all flex items-center justify-center cursor-pointer select-none ${
                      piece
                        ? 'bg-white dark:bg-stone-800 border-indigo-400 dark:border-indigo-500 shadow-sm active:scale-95'
                        : selectedPieceId
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 hover:border-indigo-500 animate-pulse'
                        : 'bg-stone-100 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {piece ? (
                      renderShapeSvg(piece.shape, piece.color, placed?.rotation || 0)
                    ) : (
                      <span className="text-[10px] font-bold text-stone-400">
                        {selectedPieceId ? t('mosaic_tap_to_place') : t('mosaic_slot')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-stone-400 font-medium">
            {t('mosaic_help_hint')}
          </p>
        </div>

        {/* Available Pieces Bank & Rotation Controls */}
        <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
              {t('mosaic_tray_title')}
            </h3>

            {selectedPieceId && currentLevel > 1 && (
              <button
                type="button"
                onClick={handleRotateSelectedPiece}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <RotateCw size={14} />
                <span>{t('mosaic_btn_rotate')}</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 min-h-[72px]">
            {unplacedPieces.length === 0 ? (
              <p className="text-xs text-stone-400 font-bold py-3">
                {t('mosaic_all_pieces_placed')}
              </p>
            ) : (
              unplacedPieces.map((piece) => {
                const isSelected = selectedPieceId === piece.id;
                const rot = pieceRotations[piece.id] || 0;

                return (
                  <button
                    key={piece.id}
                    type="button"
                    onClick={() => handleSelectPiece(piece.id)}
                    className={`p-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-800 scale-105'
                        : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {renderShapeSvg(piece.shape, piece.color, rot)}
                    <span className="text-[10px] font-bold text-stone-500 mt-1 max-w-[60px] truncate">
                      {piece.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Adaptive Completion Modal */}
      <AdaptiveDifficultyModal
        isOpen={isComplete}
        gameId="memory_mosaic"
        gameTitle={t('game_memory_mosaic_title')}
        score={finalScore}
        timeSpentSeconds={timeSpent}
        mistakes={mistakes}
        hintsUsed={hintsUsed}
        onPlayAgain={() => {
          setIsComplete(false);
          initializeGame();
        }}
        onExit={() => navigateTo('patient_games')}
      />

    </div>
  );
};
