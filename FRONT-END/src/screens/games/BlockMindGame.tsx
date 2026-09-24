import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  Trophy,
  Grid
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { AdaptiveDifficultyModal } from './AdaptiveDifficultyModal';
import { speechService } from '../../services/speechService';

interface BlockShape {
  id: string;
  name: string;
  matrix: number[][]; // 2D array: 1 = filled, 0 = empty
  color: string;
}

// Shape pools based on difficulty
const EASY_SHAPES: BlockShape[] = [
  { id: 'dot-1', name: 'Single Dot', matrix: [[1]], color: 'bg-amber-400' },
  { id: 'h2', name: 'Horizontal 2', matrix: [[1, 1]], color: 'bg-teal-500' },
  { id: 'v2', name: 'Vertical 2', matrix: [[1], [1]], color: 'bg-teal-500' },
  { id: 'h3', name: 'Horizontal 3', matrix: [[1, 1, 1]], color: 'bg-sky-500' },
  { id: 'v3', name: 'Vertical 3', matrix: [[1], [1], [1]], color: 'bg-sky-500' },
  { id: 'sq2', name: 'Square 2x2', matrix: [[1, 1], [1, 1]], color: 'bg-emerald-500' },
];

const MEDIUM_SHAPES: BlockShape[] = [
  ...EASY_SHAPES,
  { id: 'h4', name: 'Bar 4', matrix: [[1, 1, 1, 1]], color: 'bg-indigo-500' },
  { id: 'v4', name: 'Vertical 4', matrix: [[1], [1], [1], [1]], color: 'bg-indigo-500' },
  { id: 'l3-1', name: 'Corner L', matrix: [[1, 0], [1, 1]], color: 'bg-rose-500' },
  { id: 'l3-2', name: 'Corner L (Rev)', matrix: [[0, 1], [1, 1]], color: 'bg-rose-500' },
  { id: 'l3-3', name: 'Top Corner', matrix: [[1, 1], [1, 0]], color: 'bg-rose-500' },
  { id: 'l3-4', name: 'Top Corner (Rev)', matrix: [[1, 1], [0, 1]], color: 'bg-rose-500' },
];

const HARD_SHAPES: BlockShape[] = [
  ...MEDIUM_SHAPES,
  { id: 't4', name: 'T Shape', matrix: [[1, 1, 1], [0, 1, 0]], color: 'bg-purple-500' },
  { id: 'l4', name: 'Big L', matrix: [[1, 0], [1, 0], [1, 1]], color: 'bg-pink-500' },
  { id: 'c3', name: 'Corner 3x3', matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: 'bg-blue-600' },
  { id: 'r23', name: 'Rectangle 2x3', matrix: [[1, 1], [1, 1], [1, 1]], color: 'bg-violet-600' },
];

const GRID_SIZE = 7;

export const BlockMindGame: React.FC = () => {
  const { navigateTo, adaptiveDifficulties, t } = useApp();
  const difficulty = adaptiveDifficulties.block_mind || 'standard';

  const shapePool = 
    difficulty === 'easier' ? EASY_SHAPES : difficulty === 'challenging' ? HARD_SHAPES : MEDIUM_SHAPES;
  const targetLinesToWin = difficulty === 'easier' ? 2 : difficulty === 'challenging' ? 4 : 3;

  const [grid, setGrid] = useState<string[][]>(() => 
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''))
  );
  const [currentShapes, setCurrentShapes] = useState<(BlockShape | null)[]>([]);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(null);
  const [rowsCleared, setRowsCleared] = useState(0);
  const [colsCleared, setColsCleared] = useState(0);
  const [correctPlacements, setCorrectPlacements] = useState(0);
  const [wrongPlacements, setWrongPlacements] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [clearingLines, setClearingLines] = useState<{ rows: number[]; cols: number[] }>({ rows: [], cols: [] });

  const dealShapes = () => {
    const dealt: BlockShape[] = [];
    for (let i = 0; i < 3; i++) {
      const rand = shapePool[Math.floor(Math.random() * shapePool.length)];
      dealt.push({ ...rand, id: `${rand.id}-${Date.now()}-${i}` });
    }
    setCurrentShapes(dealt);
    setSelectedShapeIndex(null);
  };

  const startNewGame = () => {
    setGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('')));
    setRowsCleared(0);
    setColsCleared(0);
    setCorrectPlacements(0);
    setWrongPlacements(0);
    setScore(0);
    setStartTime(Date.now());
    setIsComplete(false);
    setClearingLines({ rows: [], cols: [] });
    dealShapes();
  };

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  const canPlace = (matrix: number[][], startRow: number, startCol: number) => {
    const numRows = matrix.length;
    const numCols = matrix[0].length;

    if (startRow + numRows > GRID_SIZE || startCol + numCols > GRID_SIZE) {
      return false;
    }

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (matrix[r][c] === 1 && grid[startRow + r][startCol + c] !== '') {
          return false;
        }
      }
    }
    return true;
  };

  const handleCellClick = (row: number, col: number) => {
    if (selectedShapeIndex === null) return;
    const shape = currentShapes[selectedShapeIndex];
    if (!shape) return;

    if (!canPlace(shape.matrix, row, col)) {
      speechService.playChime('warning');
      setWrongPlacements((prev) => prev + 1);
      return;
    }

    // Place the block
    speechService.playChime('gentle_click');
    setCorrectPlacements((prev) => prev + 1);

    const newGrid = grid.map((r) => [...r]);
    let placedCellsCount = 0;

    for (let r = 0; r < shape.matrix.length; r++) {
      for (let c = 0; c < shape.matrix[0].length; c++) {
        if (shape.matrix[r][c] === 1) {
          newGrid[row + r][col + c] = shape.color;
          placedCellsCount += 1;
        }
      }
    }

    // Remove placed shape from tray
    const nextShapes = [...currentShapes];
    nextShapes[selectedShapeIndex] = null;
    setCurrentShapes(nextShapes);
    setSelectedShapeIndex(null);

    // Check for full rows and columns
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      if (newGrid[r].every((cell) => cell !== '')) {
        fullRows.push(r);
      }
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      let isColFull = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (newGrid[r][c] === '') {
          isColFull = false;
          break;
        }
      }
      if (isColFull) {
        fullCols.push(c);
      }
    }

    const linesCount = fullRows.length + fullCols.length;
    const addedScore = placedCellsCount * 10 + linesCount * 100;
    setScore((prev) => prev + addedScore);

    if (linesCount > 0) {
      setClearingLines({ rows: fullRows, cols: fullCols });
      speechService.playChime('success_bell');

      setTimeout(() => {
        const clearedGrid = newGrid.map((r, rIdx) => 
          r.map((cell, cIdx) => {
            if (fullRows.includes(rIdx) || fullCols.includes(cIdx)) {
              return '';
            }
            return cell;
          })
        );
        setGrid(clearedGrid);
        setClearingLines({ rows: [], cols: [] });
        setRowsCleared((prev) => prev + fullRows.length);
        setColsCleared((prev) => prev + fullCols.length);

        const totalClearedNow = rowsCleared + colsCleared + linesCount;
        if (totalClearedNow >= targetLinesToWin) {
          const elapsed = Math.max(5, Math.round((Date.now() - startTime) / 1000));
          setTimeSpent(elapsed);
          setIsComplete(true);
        }
      }, 400);
    } else {
      setGrid(newGrid);
    }

    // If all 3 shapes used, deal new set
    if (nextShapes.every((s) => s === null)) {
      setTimeout(() => {
        dealShapes();
      }, 300);
    }
  };

  const instructionsAudio = `${t('game_block_mind_title')}. ${t('game_block_mind_desc')}`;

  const totalLinesCleared = rowsCleared + colsCleared;

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header 
        title={t('game_block_mind_title')} 
        subtitle={t('game_block_mind_subtitle')}
        audioPrompt={instructionsAudio}
        showBack 
        onBack={() => navigateTo('patient_games')} 
      />

      <div className="flex-1 p-4 sm:p-5 space-y-4 max-w-md mx-auto w-full overflow-y-auto custom-scrollbar">
        
        {/* Score & Progress Bar */}
        <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
              {t('block_mind_lines_target', { cleared: totalLinesCleared, target: targetLinesToWin })}
            </span>
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 mt-1">
              {score} <span className="text-xs font-semibold text-stone-400">{t('pts_label')}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right text-xs">
              <span className="text-stone-500 font-bold block">{t('block_mind_cleared_label')}</span>
              <span className="font-extrabold text-sky-600 dark:text-sky-400">
                {t('block_mind_rows_cols', { rows: rowsCleared, cols: colsCleared })}
              </span>
            </div>

            <button
              type="button"
              onClick={startNewGame}
              className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors cursor-pointer"
              title={t('btn_reset_grid')}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* 7x7 Grid Stage */}
        <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft flex flex-col items-center justify-center">
          <div className="grid grid-cols-7 gap-1.5 p-2 bg-stone-100 dark:bg-stone-900/80 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-inner">
            {grid.map((row, rIdx) =>
              row.map((cellColor, cIdx) => {
                const isClearing =
                  clearingLines.rows.includes(rIdx) || clearingLines.cols.includes(cIdx);

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center select-none ${
                      isClearing
                        ? 'bg-amber-300 dark:bg-amber-400 scale-95 shadow-md shadow-amber-400/50 animate-pulse'
                        : cellColor
                        ? `${cellColor} shadow-xs`
                        : selectedShapeIndex !== null
                        ? 'bg-white dark:bg-stone-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-stone-200/60 dark:border-stone-700/60'
                        : 'bg-white dark:bg-stone-800 border border-stone-200/40 dark:border-stone-700/40'
                    }`}
                  />
                );
              })
            )}
          </div>

          <p className="text-[11px] text-stone-400 mt-2 font-medium">
            {selectedShapeIndex !== null
              ? t('block_mind_tap_empty')
              : t('block_mind_choose_shape')}
          </p>
        </div>

        {/* Shape Tray */}
        <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-stone-500">
              {t('block_mind_pick_shape')}
            </h3>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
              {t('block_mind_left_in_round', { count: currentShapes.filter(Boolean).length })}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 min-h-[90px] items-center">
            {currentShapes.map((shape, idx) => {
              if (!shape) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-20 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-300 text-xs font-bold"
                  >
                    {t('block_mind_placed')}
                  </div>
                );
              }

              const isSelected = selectedShapeIndex === idx;

              return (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => {
                    speechService.playChime('gentle_click');
                    setSelectedShapeIndex(isSelected ? null : idx);
                  }}
                  className={`h-20 p-2 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-600 ring-2 ring-sky-300 dark:ring-sky-800 scale-105 shadow-md'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div
                    className="grid gap-0.5"
                    style={{
                      gridTemplateColumns: `repeat(${shape.matrix[0].length}, minmax(0, 1fr))`,
                    }}
                  >
                    {shape.matrix.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`${r}-${c}`}
                          className={`w-4 h-4 rounded-xs ${
                            val === 1 ? shape.color : 'bg-transparent'
                          }`}
                        />
                      ))
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Finish / Complete Round Early if lines cleared */}
        {totalLinesCleared > 0 && !isComplete && (
          <button
            type="button"
            onClick={() => {
              const elapsed = Math.max(5, Math.round((Date.now() - startTime) / 1000));
              setTimeSpent(elapsed);
              setIsComplete(true);
            }}
            className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-md shadow-sky-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Trophy size={15} />
            <span>{t('block_mind_finish_round')}</span>
          </button>
        )}

      </div>

      {/* Adaptive Modal */}
      <AdaptiveDifficultyModal
        isOpen={isComplete}
        gameId="block_mind"
        gameTitle={t('game_block_mind_title')}
        score={Math.min(100, Math.max(50, score))}
        timeSpentSeconds={timeSpent}
        mistakes={wrongPlacements}
        hintsUsed={0}
        onPlayAgain={() => {
          setIsComplete(false);
          startNewGame();
        }}
        onExit={() => navigateTo('patient_games')}
      />

    </div>
  );
};
