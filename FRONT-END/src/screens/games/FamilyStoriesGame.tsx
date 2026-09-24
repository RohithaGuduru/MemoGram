import React, { useState, useMemo } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Save, 
  Sparkles, 
  Heart, 
  BookOpen, 
  Trash2,
  Users,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { AdaptiveDifficultyModal } from './AdaptiveDifficultyModal';
import { speechService } from '../../services/speechService';
import { getLanguageInfo, isVoiceInputAvailable } from '../../services/languageCapabilities';

const COMMON_RELATIONS = [
  'My Son',
  'My Daughter',
  'My Spouse',
  'My Grandson',
  'My Granddaughter',
  'My Sister',
  'My Brother',
  'My Daughter-in-law',
  'My Son-in-law'
];

const RELATION_KEY_MAP: Record<string, string> = {
  'my son': 'rel_my_son',
  'my daughter': 'rel_my_daughter',
  'my spouse': 'rel_my_spouse',
  'my grandson': 'rel_my_grandson',
  'my granddaughter': 'rel_my_granddaughter',
  'my sister': 'rel_my_sister',
  'my brother': 'rel_my_brother',
  'my daughter-in-law': 'rel_my_daughter_in_law',
  'my son-in-law': 'rel_my_son_in_law',
  'my mother': 'rel_my_mother',
  'my father': 'rel_my_father',
  'family member': 'rel_family_member'
};

export const FamilyStoriesGame: React.FC = () => {
  const { 
    navigateTo, 
    stories, 
    addStory, 
    deleteStory, 
    primaryLanguage, 
    showToast,
    familyMembers,
    t
  } = useApp();

  // Active family circle from Caretaker Setup
  const activeFamily = useMemo(() => {
    return familyMembers || [];
  }, [familyMembers]);

  // Family Question Game State
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questionFeedback, setQuestionFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);

  // Independent Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedStoryText, setRecordedStoryText] = useState('');
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  const langInfo = getLanguageInfo(primaryLanguage);
  const voiceAvailable = isVoiceInputAvailable(primaryLanguage);

  const currentMember = activeFamily.length > 0 ? activeFamily[currentMemberIndex % activeFamily.length] : null;

  // Helper to normalize relationships into friendly options
  const normalizeRelation = (rel: string): string => {
    if (!rel) return 'Family Member';
    const clean = rel.trim();
    const lower = clean.toLowerCase();
    if (lower.includes('daughter-in-law')) return 'My Daughter-in-law';
    if (lower.includes('son-in-law')) return 'My Son-in-law';
    if (lower.includes('daughter')) return 'My Daughter';
    if (lower.includes('grandson')) return 'My Grandson';
    if (lower.includes('granddaughter')) return 'My Granddaughter';
    if (lower.includes('son')) return 'My Son';
    if (lower.includes('spouse') || lower.includes('wife') || lower.includes('husband')) return 'My Spouse';
    if (lower.includes('brother')) return 'My Brother';
    if (lower.includes('sister')) return 'My Sister';
    if (lower.includes('mother')) return 'My Mother';
    if (lower.includes('father')) return 'My Father';
    return clean.startsWith('My ') ? clean : `My ${clean}`;
  };

  const getRelationLabel = (rel: string): string => {
    const norm = normalizeRelation(rel).toLowerCase();
    const key = RELATION_KEY_MAP[norm];
    if (key) return t(key);
    return rel;
  };

  const currentCorrectRelation = normalizeRelation(currentMember?.relationship || 'Daughter');

  // Dynamic 4 multiple-choice options for current family member
  const dynamicOptions = useMemo(() => {
    const distractors = COMMON_RELATIONS.filter((r) => r !== currentCorrectRelation);
    // Shuffle distractors
    const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
    // Combine with correct and shuffle
    return [...shuffledDistractors, currentCorrectRelation].sort(() => 0.5 - Math.random());
  }, [currentMember?.id, currentCorrectRelation]);

  // Handle relationship quiz option select
  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    if (option === currentCorrectRelation) {
      speechService.playChime('success_bell');
      setQuestionFeedback('correct');
      setCorrectAnswersCount((prev) => prev + 1);
    } else {
      speechService.playChime('warning');
      setQuestionFeedback('wrong');
      setWrongAnswersCount((prev) => prev + 1);
    }
  };

  // Move to next family member in circle
  const handleNextMember = () => {
    setSelectedOption(null);
    setQuestionFeedback('idle');
    setCurrentMemberIndex((prev) => (prev + 1) % activeFamily.length);
  };

  // Recording timer simulation
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggleRecord = () => {
    if (!voiceAvailable) {
      showToast(
        t('voice_input_dev_note', { lang: langInfo.name }),
        'warning',
        'Story Recording'
      );
      return;
    }

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setHasRecording(true);
      if (!storyTitle) {
        setStoryTitle(`Memory (${new Date().toLocaleDateString()})`);
      }
      setRecordedStoryText(
        "I remember when the sun was shining over the hills in Shillong. We had the whole family together and everyone was laughing and enjoying warm tea."
      );
      speechService.playChime('success_bell');
      showToast('Memory audio captured! You can preview and save it.', 'success');
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingSeconds(0);
      setHasRecording(false);
      speechService.playChime('gentle_click');
    }
  };

  const handleTogglePlayback = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      speechService.stop();
    } else {
      setIsPlayingAudio(true);
      speechService.speak(recordedStoryText || 'Cherished memory recorded with love.', primaryLanguage, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  const handleSaveMemory = () => {
    if (!hasRecording && !recordedStoryText) {
      showToast('Please record a voice memory first', 'warning');
      return;
    }

    addStory({
      title: storyTitle || `Memory (${new Date().toLocaleDateString()})`,
      prompt: `Cherished memories & reflections`,
      audioDurationSeconds: Math.max(15, recordingSeconds),
      transcript: recordedStoryText,
      photoUrl: currentMember?.photoUrl || 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=300&auto=format&fit=crop&q=80',
      tags: ['Family', 'Cherished Memory']
    });

    setHasRecording(false);
    setRecordedStoryText('');
    setStoryTitle('');
    setRecordingSeconds(0);
    setIsCompleteModalOpen(true);
  };

  const audioPrompt = `${t('game_family_stories_title')}. ${t('family_quiz_question', { name: currentMember?.name || '' })} ${t('family_quiz_instruction')}`;

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header 
        title={t('game_family_stories_title')} 
        subtitle={t('game_family_stories_subtitle')}
        audioPrompt={audioPrompt}
        showBack 
        onBack={() => navigateTo('patient_games')} 
      />

      <div className="flex-1 p-4 sm:p-5 space-y-5 max-w-md mx-auto w-full overflow-y-auto custom-scrollbar">
        
        {/* Dynamic Family Question Card or Empty Notice */}
        {activeFamily.length === 0 ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800 p-6 rounded-3xl shadow-soft text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-200 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center mx-auto">
              <Users size={28} />
            </div>
            <h3 className="text-base font-extrabold text-rose-900 dark:text-rose-100">
              {t('family_no_members_title')}
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 font-medium max-w-xs mx-auto">
              {t('family_no_members_desc')}
            </p>
          </div>
        ) : (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800 p-5 rounded-3xl shadow-soft">
          
          {/* Card Top Indicator & Next Person Button */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <Users size={15} />
              <span>{t('family_circle_progress', { current: currentMemberIndex + 1, total: activeFamily.length })}</span>
            </span>

            <button
              type="button"
              onClick={handleNextMember}
              className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('family_next_person')}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Person Image or Graceful Name Avatar (NO broken image icons!) */}
          {currentMember?.photoUrl ? (
            <div className="flex flex-col items-center justify-center mb-3">
              <img 
                src={currentMember.photoUrl} 
                alt={currentMember.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white dark:border-stone-800 shadow-md"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="mt-2 text-xs font-extrabold px-3 py-1 rounded-full bg-white dark:bg-stone-800 text-rose-900 dark:text-rose-200 shadow-xs">
                {currentMember.name}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center mb-3">
              <div className="w-24 h-24 rounded-3xl bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-100 font-black text-3xl flex items-center justify-center shadow-inner border-2 border-rose-300 dark:border-rose-700">
                {currentMember?.name ? currentMember.name.slice(0, 2).toUpperCase() : 'FM'}
              </div>
              <span className="mt-2 text-sm font-extrabold text-stone-900 dark:text-stone-100">
                {currentMember?.name}
              </span>
            </div>
          )}

          {/* Question Text */}
          <div className="text-center my-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 leading-snug">
              {t('family_quiz_question', { name: currentMember?.name || '' })}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {t('family_quiz_instruction')}
            </p>
          </div>

          {/* Multiple Choice Relationship Options */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {dynamicOptions.map((opt) => {
              const isChosen = selectedOption === opt;
              
              let buttonStyle = 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:border-rose-300';
              if (isChosen) {
                if (questionFeedback === 'correct') {
                  buttonStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-400';
                } else if (questionFeedback === 'wrong') {
                  buttonStyle = 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-400';
                }
              }

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`p-3.5 rounded-2xl border-2 font-bold text-xs sm:text-sm text-center shadow-xs transition-all cursor-pointer active:scale-95 ${buttonStyle}`}
                >
                  {getRelationLabel(opt)}
                </button>
              );
            })}
          </div>

          {/* Feedback Banner: Success state or Friendly Retry */}
          {questionFeedback === 'correct' && (
            <div className="mt-4 p-3.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 rounded-2xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>{t('family_feedback_correct', { name: currentMember?.name || '', relation: getRelationLabel(currentCorrectRelation) })}</span>
              </div>
              <button
                type="button"
                onClick={handleNextMember}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <span>{t('btn_continue')}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}

          {questionFeedback === 'wrong' && (
            <div className="mt-4 p-3.5 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 rounded-2xl flex items-center justify-between animate-fade-in">
              <span className="font-extrabold text-xs sm:text-sm">
                {t('family_feedback_wrong')}
              </span>
              <button
                type="button"
                onClick={handleNextMember}
                className="text-xs font-bold text-amber-900 dark:text-amber-200 underline cursor-pointer"
              >
                {t('family_skip_person')}
              </button>
            </div>
          )}

          {/* Listen to question prompt */}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-rose-200/50 dark:border-rose-900/40">
            <span className="text-[11px] text-stone-500 font-medium">
              {t('family_details_from_setup')}
            </span>
            <SpeakTextButton 
              textToSpeak={t('family_quiz_question', { name: currentMember?.name || '' })} 
              variant="pill" 
              size="sm" 
            />
          </div>

        </div>
        )}

        {/* INDEPENDENT RECORDING SECTION (Scroll down) */}
        <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft text-center space-y-4">
          
          <div className="text-left">
            <span className="text-xs font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">
              {t('story_journal_subtitle')}
            </span>
            <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
              {t('story_tap_record_heading')}
            </h3>
            <p className="text-xs text-stone-500">
              {t('story_journal_desc')}
            </p>
          </div>

          {/* Waveform / Live Visualizer */}
          <div className="flex items-center justify-center gap-1.5 h-12">
            {[40, 70, 90, 60, 100, 75, 45, 85, 95, 60, 50, 80].map((h, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  isRecording
                    ? 'bg-rose-500 animate-pulse'
                    : isPlayingAudio
                    ? 'bg-teal-500 animate-bounce'
                    : 'bg-stone-200 dark:bg-stone-700'
                }`}
                style={{
                  height: isRecording || isPlayingAudio ? `${h}%` : '20%'
                }}
              />
            ))}
          </div>

          {/* Large Record / Stop Button */}
          <div className="flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={handleToggleRecord}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 cursor-pointer ${
                !voiceAvailable
                  ? 'bg-stone-200 text-stone-400'
                  : isRecording
                  ? 'bg-rose-600 text-white ring-8 ring-rose-200 dark:ring-rose-900 animate-pulse'
                  : 'bg-gradient-to-tr from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/30'
              }`}
              aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              {isRecording ? <Square size={36} /> : <Mic size={42} />}
            </button>

            <span className="mt-3 font-extrabold text-base text-stone-900 dark:text-stone-100">
              {isRecording 
                ? t('story_recording_seconds', { seconds: recordingSeconds })
                : hasRecording 
                ? t('story_recording_ready')
                : t('story_tap_to_record')}
            </span>

            <p className="text-xs text-stone-500 mt-0.5">
              {!voiceAvailable
                ? t('voice_input_dev_note', { lang: langInfo.name })
                : isRecording
                ? t('story_speak_instructions')
                : t('story_family_cherish')}
            </p>
          </div>

          {/* Playback & Save Controls when recorded */}
          {hasRecording && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3 text-left animate-fade-in">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  {t('story_title_label')}
                </label>
                <input
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder={t('story_title_placeholder')}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-300 italic">
                "{recordedStoryText}"
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlayback}
                  className="flex-1 py-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-900 dark:text-teal-200 border border-teal-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isPlayingAudio ? <Pause size={16} /> : <Play size={16} />}
                  <span>{isPlayingAudio ? t('audio_pause') : t('story_listen_back')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveMemory}
                  className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  <Save size={16} />
                  <span>{t('story_save_story')}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Saved Memories Diary */}
        <div className="bg-white dark:bg-stone-850 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-rose-500" />
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                {t('story_diary_title', { count: stories.length })}
              </h3>
            </div>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {stories.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center">
                {t('story_diary_empty')}
              </p>
            ) : (
              stories.map((s) => (
                <div key={s.id} className="p-3 rounded-2xl bg-rose-50/50 dark:bg-stone-800/60 border border-rose-100 dark:border-stone-700 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                        {s.title}
                      </h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {s.recordedAt} • {s.audioDurationSeconds}s audio
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {s.transcript && (
                        <SpeakTextButton textToSpeak={s.transcript} variant="icon-only" size="sm" />
                      )}
                      <button
                        type="button"
                        onClick={() => deleteStory(s.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                        title={t('common_delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {s.transcript && (
                    <p className="text-stone-600 dark:text-stone-300 mt-2 italic leading-relaxed">
                      "{s.transcript}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Adaptive Modal */}
      <AdaptiveDifficultyModal
        isOpen={isCompleteModalOpen}
        gameId="family_stories"
        gameTitle={t('game_family_stories_title')}
        score={Math.max(50, 100 - (wrongAnswersCount * 10))}
        timeSpentSeconds={recordingSeconds || 45}
        mistakes={wrongAnswersCount}
        hintsUsed={0}
        onPlayAgain={() => setIsCompleteModalOpen(false)}
        onExit={() => navigateTo('patient_games')}
      />

    </div>
  );
};
