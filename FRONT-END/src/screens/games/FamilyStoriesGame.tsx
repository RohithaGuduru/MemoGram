import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  Save, 
  Sparkles, 
  Heart, 
  BookOpen, 
  Volume2, 
  Trash2,
  Share2,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { AdaptiveDifficultyModal } from './AdaptiveDifficultyModal';
import { speechService } from '../../services/speechService';
import { getLanguageInfo, isVoiceInputAvailable } from '../../services/languageCapabilities';

const STORY_PROMPTS = [
  "Tell me about a happy childhood memory you remember.",
  "Tell me about someone special in your family circle.",
  "Tell me about a favorite festival or celebration with sweets.",
  "Tell me about your favorite trip or place in nature.",
  "What was your favorite recipe or meal made at home?"
];

export const FamilyStoriesGame: React.FC = () => {
  const { 
    navigateTo, 
    stories, 
    addStory, 
    deleteStory, 
    primaryLanguage, 
    showToast 
  } = useApp();

  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedStoryText, setRecordedStoryText] = useState('');
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  const langInfo = getLanguageInfo(primaryLanguage);
  const voiceAvailable = isVoiceInputAvailable(primaryLanguage);
  const currentPrompt = STORY_PROMPTS[selectedPromptIndex];

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
        `Voice support for ${langInfo.name} is currently under development.`,
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
        setStoryTitle(`Story: ${currentPrompt.slice(0, 30)}...`);
      }
      setRecordedStoryText(
        "I remember when the sun was shining over the hills in Shillong. We had the whole family together and Priya was running happily with a yellow pinwheel."
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
      speechService.speak(recordedStoryText || currentPrompt, primaryLanguage, () => {
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
      prompt: currentPrompt,
      audioDurationSeconds: Math.max(15, recordingSeconds),
      transcript: recordedStoryText,
      photoUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=300&auto=format&fit=crop&q=80',
      tags: ['Family', 'Cherished Memory']
    });

    setHasRecording(false);
    setRecordedStoryText('');
    setStoryTitle('');
    setRecordingSeconds(0);
    setIsCompleteModalOpen(true);
  };

  const audioPrompt = `Family Memories and Stories. Prompt: ${currentPrompt}. Tap the large microphone to record your voice.`;

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header 
        title="Family Memories & Stories" 
        subtitle="Voice Storytelling & Audio Journal"
        audioPrompt={audioPrompt}
        showBack 
        onBack={() => navigateTo('patient_games')} 
      />

      <div className="flex-1 p-4 sm:p-5 space-y-5 max-w-md mx-auto w-full overflow-y-auto custom-scrollbar">
        
        {/* Story Prompt Card */}
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800 p-5 rounded-3xl shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <Heart size={15} />
              <span>Prompt {selectedPromptIndex + 1} of {STORY_PROMPTS.length}</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedPromptIndex((prev) => (prev + 1) % STORY_PROMPTS.length)}
              className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline"
            >
              Next Prompt →
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 leading-snug">
            "{currentPrompt}"
          </h2>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">
              Speak naturally from your heart
            </span>
            <SpeakTextButton textToSpeak={currentPrompt} variant="pill" size="sm" />
          </div>
        </div>

        {/* Large Voice Recording Stage */}
        <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft text-center space-y-4">
          
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
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${
                !voiceAvailable
                  ? 'bg-stone-200 text-stone-400 cursor-pointer'
                  : isRecording
                  ? 'bg-rose-600 text-white ring-8 ring-rose-200 dark:ring-rose-900 animate-pulse'
                  : 'bg-gradient-to-tr from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/30'
              }`}
              aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              {isRecording ? <Square size={36} /> : <Mic size={42} />}
            </button>

            <span className="mt-3 font-extrabold text-base text-stone-900 dark:text-stone-100">
              {isRecording ? `Recording... (${recordingSeconds}s)` : hasRecording ? 'Recording Ready!' : 'Tap to Record Memory'}
            </span>

            <p className="text-xs text-stone-500 mt-0.5">
              {!voiceAvailable
                ? `Voice input in ${langInfo.name} is under development`
                : isRecording
                ? 'Speak your memories aloud, tap again when finished'
                : 'Your family will cherish listening to this'}
            </p>
          </div>

          {/* Playback & Save Controls when recorded */}
          {hasRecording && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3 text-left animate-fade-in">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Story Title
                </label>
                <input
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="e.g. Summer in Shillong"
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
                  className="flex-1 py-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-900 dark:text-teal-200 border border-teal-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {isPlayingAudio ? <Pause size={16} /> : <Play size={16} />}
                  <span>{isPlayingAudio ? 'Pause' : 'Listen Back'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveMemory}
                  className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30"
                >
                  <Save size={16} />
                  <span>Save Story ✨</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Saved Memories Library */}
        <div className="bg-white dark:bg-stone-850 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-rose-500" />
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                Your Saved Memories Diary ({stories.length})
              </h3>
            </div>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {stories.map((s) => (
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
                      className="p-1 text-stone-400 hover:text-rose-600 rounded"
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
            ))}
          </div>
        </div>

      </div>

      {/* Adaptive Modal */}
      <AdaptiveDifficultyModal
        isOpen={isCompleteModalOpen}
        gameId="family_stories"
        gameTitle="Family Memories & Stories"
        score={100}
        timeSpentSeconds={recordingSeconds || 45}
        mistakes={0}
        hintsUsed={0}
        onPlayAgain={() => setIsCompleteModalOpen(false)}
        onExit={() => navigateTo('patient_games')}
      />

    </div>
  );
};
