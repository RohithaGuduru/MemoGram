import React, { useState, useEffect } from 'react';
import { 
  ListOrdered, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  HelpCircle,
  Clock,
  ArrowRight,
  Navigation,
  HelpCircle as QuestionIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { AdaptiveDifficultyModal } from './AdaptiveDifficultyModal';
import { speechService } from '../../services/speechService';

type GameMode = 'arrange' | 'predict' | 'journey';

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

const PREDICTION_QUESTIONS = [
  {
    id: 'pq-1',
    sequence: [
      { order: 1, title: 'Wake Up', emoji: '🌅' },
      { order: 2, title: 'Brush Teeth', emoji: '🪥' },
      { order: 3, title: 'Eat Breakfast', emoji: '☕' },
    ],
    question: 'What comes next in your morning routine?',
    correctOption: 'Take Morning Medicine 💊',
    distractors: ['Go to Bed & Sleep 🌙', 'Eat Dinner 🍲', 'Watch Night News 📺']
  },
  {
    id: 'pq-2',
    sequence: [
      { order: 1, title: 'Afternoon Nap', emoji: '🛋️' },
      { order: 2, title: 'Evening Chai', emoji: '🫖' },
      { order: 3, title: 'Garden Stroll', emoji: '🌿' },
    ],
    question: 'What comes next before bedtime?',
    correctOption: 'Healthy Dinner & Night Meds 🍲',
    distractors: ['Wake Up at Sunrise 🌅', 'Morning Toothbrush 🪥', 'Breakfast Toast 🍞']
  }
];

const JOURNEY_DATA = [
  {
    id: 'j-1',
    name: 'Morning Market Errand',
    stops: [
      { step: 1, name: 'Home', emoji: '🏠' },
      { step: 2, name: 'Bus Stop', emoji: '🚏' },
      { step: 3, name: 'Market', emoji: '🛒' },
      { step: 4, name: 'Park', emoji: '🌳' },
      { step: 5, name: 'Home', emoji: '🏠' },
    ],
    question: 'Where did you go right after the Market?',
    correctAnswer: 'Park 🌳',
    options: ['Park 🌳', 'Bus Stop 🚏', 'Doctor Clinic 🏥', 'Post Office 📮']
  },
  {
    id: 'j-2',
    name: 'Afternoon Tea Walk',
    stops: [
      { step: 1, name: 'Home', emoji: '🏠' },
      { step: 2, name: 'Tea Stall', emoji: '☕' },
      { step: 3, name: 'Flower Shop', emoji: '🌺' },
      { step: 4, name: 'Temple / Community Hall', emoji: '🛕' },
      { step: 5, name: 'Home', emoji: '🏠' },
    ],
    question: 'Which place did you visit before going back Home?',
    correctAnswer: 'Temple / Community Hall 🛕',
    options: ['Temple / Community Hall 🛕', 'Tea Stall ☕', 'Railway Station 🚂', 'Bakery 🥖']
  }
];

export const RoutineSequenceGame: React.FC = () => {
  const { navigateTo, adaptiveDifficulties, t } = useApp();
  const difficulty = adaptiveDifficulties.routine || 'standard';

  // Mode cycle: Arrange -> Predict -> Journey -> Arrange -> Journey -> Predict
  const MODE_CYCLE: GameMode[] = ['arrange', 'predict', 'journey'];
  const [currentModeIndex, setCurrentModeIndex] = useState(0);
  const activeMode: GameMode = MODE_CYCLE[currentModeIndex % MODE_CYCLE.length];

  // Mode A: Arrange My Day state
  const activeCount = difficulty === 'easier' ? 4 : 5;
  const [currentList, setCurrentList] = useState<RoutineStep[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Mode B: What Comes Next state
  const [predictQuestionIndex, setPredictQuestionIndex] = useState(0);
  const [selectedPredictOption, setSelectedPredictOption] = useState<string | null>(null);
  const [predictFeedback, setPredictFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Mode C: Journey Memory state
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [journeyPhase, setJourneyPhase] = useState<'memorize' | 'question'>('memorize');
  const [journeyCountdown, setJourneyCountdown] = useState(7);
  const [selectedJourneyOption, setSelectedJourneyOption] = useState<string | null>(null);
  const [journeyFeedback, setJourneyFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Common metrics
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Initialize Mode A
  const initArrangeMode = () => {
    const subset = CANONICAL_STEPS.slice(0, activeCount);
    let shuffled = [...subset].sort(() => 0.5 - Math.random());
    while (shuffled.every((item, i) => item.order === i + 1)) {
      shuffled = [...subset].sort(() => 0.5 - Math.random());
    }
    setCurrentList(shuffled);
    setValidationErrors([]);
  };

  // Initialize Mode B
  const initPredictMode = () => {
    setSelectedPredictOption(null);
    setPredictFeedback('idle');
  };

  // Initialize Mode C
  const initJourneyMode = () => {
    setJourneyPhase('memorize');
    setJourneyCountdown(difficulty === 'easier' ? 9 : 6);
    setSelectedJourneyOption(null);
    setJourneyFeedback('idle');
  };

  const startCurrentMode = () => {
    setStartTime(Date.now());
    if (activeMode === 'arrange') initArrangeMode();
    else if (activeMode === 'predict') initPredictMode();
    else if (activeMode === 'journey') initJourneyMode();
  };

  useEffect(() => {
    startCurrentMode();
  }, [activeMode, difficulty]);

  // Journey memorization countdown
  useEffect(() => {
    if (activeMode === 'journey' && journeyPhase === 'memorize') {
      if (journeyCountdown > 0) {
        const timer = setTimeout(() => setJourneyCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setJourneyPhase('question');
        speechService.playChime('gentle_click');
      }
    }
  }, [activeMode, journeyPhase, journeyCountdown]);

  // Next mode in the alternation cycle
  const handleAdvanceMode = () => {
    setCurrentModeIndex((prev) => prev + 1);
  };

  // Mode A: Arrange functions
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
      // Correct!
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setTimeSpent(elapsed);
      const score = Math.max(50, 100 - (mistakes * 10) - (attempts * 5));
      setFinalScore(score);
      speechService.playChime('success_bell');
      setIsComplete(true);
    } else {
      speechService.playChime('warning');
      setMistakes((prev) => prev + 1);
      setValidationErrors(errors);
    }
  };

  // Mode B: Predict functions
  const currentPQ = PREDICTION_QUESTIONS[predictQuestionIndex % PREDICTION_QUESTIONS.length];
  const predictOptions = React.useMemo(() => {
    return [currentPQ.correctOption, ...currentPQ.distractors].sort(() => 0.5 - Math.random());
  }, [currentPQ.id]);

  const handleSelectPredictOption = (opt: string) => {
    setSelectedPredictOption(opt);
    if (opt === currentPQ.correctOption) {
      speechService.playChime('success_bell');
      setPredictFeedback('correct');
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setTimeSpent(elapsed);
      setFinalScore(95);
      setTimeout(() => {
        setIsComplete(true);
      }, 900);
    } else {
      speechService.playChime('warning');
      setPredictFeedback('wrong');
      setMistakes((prev) => prev + 1);
    }
  };

  // Mode C: Journey functions
  const currentJourney = JOURNEY_DATA[journeyIndex % JOURNEY_DATA.length];

  const handleSelectJourneyOption = (opt: string) => {
    setSelectedJourneyOption(opt);
    if (opt === currentJourney.correctAnswer) {
      speechService.playChime('success_bell');
      setJourneyFeedback('correct');
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setTimeSpent(elapsed);
      setFinalScore(100);
      setTimeout(() => {
        setIsComplete(true);
      }, 900);
    } else {
      speechService.playChime('warning');
      setJourneyFeedback('wrong');
      setMistakes((prev) => prev + 1);
    }
  };

  const getAudioPrompt = () => {
    if (activeMode === 'arrange') {
      return "Daily Routine in Sequence. Mode: Arrange My Day. Arrange these everyday activities in chronological order using the arrows.";
    } else if (activeMode === 'predict') {
      return `Daily Routine in Sequence. Mode: What Comes Next? ${currentPQ.question} Select the matching choice.`;
    } else {
      return `Daily Routine in Sequence. Mode: Journey Memory. Follow the stops on your journey and remember the order.`;
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header 
        title={t('game_routine_title')} 
        subtitle={t('game_routine_desc')}
        audioPrompt={getAudioPrompt()}
        showBack 
        onBack={() => navigateTo('patient_games')} 
      />

      <div className="flex-1 p-4 sm:p-5 space-y-4 max-w-md mx-auto w-full overflow-y-auto custom-scrollbar">
        
        {/* Mode Selector Tabs & Alternate Indicator */}
        <div className="bg-white dark:bg-stone-850 p-2 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-soft flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => setCurrentModeIndex(0)}
            className={`flex-1 py-2 px-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer text-center ${
              activeMode === 'arrange'
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            {t('routine_mode_arrange')}
          </button>
          <button
            type="button"
            onClick={() => setCurrentModeIndex(1)}
            className={`flex-1 py-2 px-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer text-center ${
              activeMode === 'predict'
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            {t('routine_mode_predict')}
          </button>
          <button
            type="button"
            onClick={() => setCurrentModeIndex(2)}
            className={`flex-1 py-2 px-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer text-center ${
              activeMode === 'journey'
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            {t('routine_mode_journey')}
          </button>
        </div>

        {/* ===================== MODE A: ARRANGE MY DAY ===================== */}
        {activeMode === 'arrange' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-3xl shadow-soft flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles size={15} />
                  <span>{t('routine_mode_arrange')}</span>
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                  {t('game_routine_desc')}
                </p>
              </div>
              <button
                type="button"
                onClick={initArrangeMode}
                className="p-2 rounded-xl bg-white dark:bg-stone-800 text-stone-600 hover:bg-stone-100 cursor-pointer"
                title="Shuffle"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            {/* Step list */}
            <div className="space-y-2.5">
              {currentList.map((step, idx) => {
                const isError = validationErrors.includes(step.id);

                return (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-2xl bg-white dark:bg-stone-850 border-2 transition-all flex items-center justify-between gap-2 shadow-xs ${
                      isError
                        ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                        : 'border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 font-black text-amber-900 dark:text-amber-200 text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="text-lg mr-1.5">{step.emoji}</span>
                        <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                          {step.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveUp(idx)}
                        className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                        aria-label="Move Up"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === currentList.length - 1}
                        onClick={() => moveDown(idx)}
                        className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                        aria-label="Move Down"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {validationErrors.length > 0 && (
              <p className="text-xs font-bold text-rose-600 text-center animate-shake">
                {t('routine_retry_feedback')}
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckSequence}
              className="w-full py-3.5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <CheckCircle2 size={18} />
              <span>{t('routine_btn_check')}</span>
            </button>
          </div>
        )}

        {/* ===================== MODE B: WHAT COMES NEXT? ===================== */}
        {activeMode === 'predict' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-3xl shadow-soft">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <QuestionIcon size={15} />
                <span>{t('routine_mode_predict')}</span>
              </span>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                Follow the morning steps and choose what happens next.
              </p>
            </div>

            {/* Visible Sequence Flow */}
            <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-2 text-center">
              <div className="flex flex-col items-center gap-2">
                {currentPQ.sequence.map((step, idx) => (
                  <React.Fragment key={step.order}>
                    <div className="w-full py-2.5 px-4 rounded-2xl bg-amber-50/60 dark:bg-stone-800/60 border border-amber-200/60 dark:border-stone-700 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100">
                        <span className="text-base">{step.emoji}</span>
                        <span>{step.title}</span>
                      </div>
                      <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50">
                        Step {step.order}
                      </span>
                    </div>
                    <span className="text-xs text-stone-400 font-bold">↓</span>
                  </React.Fragment>
                ))}

                {/* Mystery Next Step */}
                <div className="w-full py-3 px-4 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border-2 border-dashed border-amber-400 text-amber-900 dark:text-amber-100 font-extrabold text-sm flex items-center justify-center gap-2 animate-pulse">
                  <QuestionIcon size={16} />
                  <span>? {t('routine_mode_predict')} ?</span>
                </div>
              </div>

              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 pt-2">
                {currentPQ.question}
              </h3>
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 gap-2">
              {predictOptions.map((opt) => {
                const isSelected = selectedPredictOption === opt;
                const isCorrect = opt === currentPQ.correctOption;

                let style = 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-amber-400';
                if (isSelected) {
                  if (isCorrect) {
                    style = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-400';
                  } else {
                    style = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-400';
                  }
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectPredictOption(opt)}
                    className={`p-3.5 rounded-2xl border-2 font-bold text-xs sm:text-sm text-left shadow-xs transition-all cursor-pointer flex items-center justify-between ${style}`}
                  >
                    <span>{opt}</span>
                    {isSelected && isCorrect && <CheckCircle2 size={16} className="text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            {predictFeedback === 'wrong' && (
              <p className="text-xs font-bold text-rose-600 text-center animate-shake">
                {t('routine_retry_feedback')}
              </p>
            )}
          </div>
        )}

        {/* ===================== MODE C: JOURNEY MEMORY ===================== */}
        {activeMode === 'journey' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-3xl shadow-soft">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Navigation size={15} />
                <span>{t('routine_mode_journey')}</span>
              </span>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                {journeyPhase === 'memorize'
                  ? 'Memorize the route taken on this gentle errand around town.'
                  : 'Journey is now hidden! Answer the question about your route.'}
              </p>
            </div>

            {/* Memorization Phase */}
            {journeyPhase === 'memorize' ? (
              <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft text-center space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-stone-500">
                    Route: {currentJourney.name}
                  </span>
                  <span className="text-xs font-black bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full animate-pulse">
                    ⏱️ {journeyCountdown}s
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5 py-2">
                  {currentJourney.stops.map((stop, i) => (
                    <React.Fragment key={stop.step}>
                      <div className="w-full py-2 px-4 rounded-2xl bg-amber-50/80 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-extrabold text-stone-800 dark:text-stone-100">
                          <span className="text-lg">{stop.emoji}</span>
                          <span>{stop.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-400">
                          Stop {stop.step}
                        </span>
                      </div>
                      {i < currentJourney.stops.length - 1 && (
                        <span className="text-xs text-stone-400 font-bold">↓</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setJourneyPhase('question')}
                  className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <EyeOff size={14} />
                  <span>I Remember! Ask Me</span>
                </button>
              </div>
            ) : (
              /* Recall Question Phase */
              <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-4 text-center">
                <div className="py-2 px-3 bg-stone-100 dark:bg-stone-800 rounded-2xl inline-block text-xs font-bold text-stone-600 dark:text-stone-300">
                  🗺️ Route: {currentJourney.name} (Hidden)
                </div>

                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  "{currentJourney.question}"
                </h3>

                <div className="grid grid-cols-1 gap-2">
                  {currentJourney.options.map((opt) => {
                    const isSelected = selectedJourneyOption === opt;
                    const isCorrect = opt === currentJourney.correctAnswer;

                    let style = 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-amber-400';
                    if (isSelected) {
                      if (isCorrect) {
                        style = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400';
                      } else {
                        style = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 ring-2 ring-rose-400';
                      }
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectJourneyOption(opt)}
                        className={`p-3.5 rounded-2xl border-2 font-bold text-xs sm:text-sm text-left shadow-xs transition-all cursor-pointer flex items-center justify-between ${style}`}
                      >
                        <span>{opt}</span>
                        {isSelected && isCorrect && <CheckCircle2 size={16} className="text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>

                {journeyFeedback === 'wrong' && (
                  <p className="text-xs font-bold text-rose-600 text-center animate-shake">
                    {t('routine_retry_feedback')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Adaptive Completion Modal */}
      <AdaptiveDifficultyModal
        isOpen={isComplete}
        gameId="routine"
        gameTitle={t('game_routine_title')}
        score={finalScore}
        timeSpentSeconds={timeSpent}
        mistakes={mistakes}
        hintsUsed={0}
        onPlayAgain={() => {
          setIsComplete(false);
          handleAdvanceMode();
        }}
        onExit={() => navigateTo('patient_games')}
      />

    </div>
  );
};
