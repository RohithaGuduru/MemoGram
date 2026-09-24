import React, { useState } from 'react';
import { 
  Gamepad2, 
  ShoppingBag, 
  ListOrdered, 
  Eye, 
  Sparkles, 
  Mic, 
  Play, 
  ArrowRight,
  Clock,
  Puzzle,
  Boxes
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { PatientBottomNav } from '../../components/layout/PatientBottomNav';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { CORE_GAMES } from '../../services/mockData';
import { t } from '../../services/languageCapabilities';
import { isRealPatientId } from '../../services/demoFallback';
import { GameId } from '../../types';
import { recommendationsApi } from '../../api';

export const PatientGamesScreen: React.FC = () => {
  const { navigateTo, adaptiveDifficulties, patient, t } = useApp();
  const [recommendedGame, setRecommendedGame] = useState<any>(null);

  React.useEffect(() => {
    if (patient.id && isRealPatientId(patient.id)) {
      (async () => {
        try {
          const res = await recommendationsApi.getNextRecommendation(patient.id);
          if (res) setRecommendedGame(res);
        } catch (e) {
          console.debug('[PatientGamesScreen] Using default catalog order', e);
        }
      })();
    }
  }, [patient.id]);

  const gamesTitle = t('games_title');
  const chooseGameSubtitle = t('choose_game');

  const getGameIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingBag size={28} />;
      case 'ListOrdered': return <ListOrdered size={28} />;
      case 'Eye': return <Eye size={28} />;
      case 'Sparkles': return <Sparkles size={28} />;
      case 'Mic': return <Mic size={28} />;
      case 'Puzzle': return <Puzzle size={28} />;
      case 'Boxes': return <Boxes size={28} />;
      default: return <Gamepad2 size={28} />;
    }
  };

  const getLocalizedGameName = (id: GameId) => {
    switch (id) {
      case 'groceries': return t('game_groceries_title');
      case 'routine': return t('game_routine_title');
      case 'cup_shuffle': return t('game_cup_shuffle_title');
      case 'cultural_match': return t('game_cultural_match_title');
      case 'family_stories': return t('game_family_stories_title');
      case 'memory_mosaic': return t('game_memory_mosaic_title');
      case 'block_mind': return t('game_block_mind_title');
    }
  };

  const getLocalizedGameDesc = (id: GameId) => {
    switch (id) {
      case 'groceries': return t('game_groceries_desc');
      case 'routine': return t('game_routine_desc');
      case 'cup_shuffle': return t('game_cup_shuffle_desc');
      case 'cultural_match': return t('game_cultural_match_desc');
      case 'family_stories': return t('game_family_stories_desc');
      case 'memory_mosaic': return t('game_memory_mosaic_desc');
      case 'block_mind': return t('game_block_mind_desc');
    }
  };

  const getLocalizedCategory = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'memory': return t('cog_cat_memory');
      case 'executive function': return t('cog_cat_executive');
      case 'attention & focus': return t('cog_cat_attention');
      case 'cultural memory': return t('cog_cat_cultural');
      case 'storytelling & speech': return t('cog_cat_storytelling');
      case 'pattern recognition': return t('cog_cat_pattern');
      case 'spatial planning': return t('cog_cat_spatial');
      default: return cat;
    }
  };

  const pageIntroAudio = `${gamesTitle}. ${chooseGameSubtitle}.`;

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <Header title={gamesTitle} subtitle={chooseGameSubtitle} audioPrompt={pageIntroAudio} showSOS />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Intro banner */}
        <div className="flex items-center justify-between bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              {gamesTitle}
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              {chooseGameSubtitle}
            </p>
          </div>

          <SpeakTextButton 
            textToSpeak={pageIntroAudio} 
            variant="pill" 
            size="sm" 
          />
        </div>

        {/* 5 Core Game Cards List */}
        <div className="space-y-4">
          {CORE_GAMES.map((game, index) => {
            const locName = getLocalizedGameName(game.id);
            const locDesc = getLocalizedGameDesc(game.id);
            const currentDiff = adaptiveDifficulties[game.id] || 'standard';
            const localizedDiff = currentDiff === 'easier' 
              ? t('difficulty_easier') 
              : currentDiff === 'challenging' 
                ? t('difficulty_challenging') 
                : t('difficulty_standard');
            const gameAudio = `${locName}. ${locDesc}`;

            return (
              <div
                key={game.id}
                onClick={() => navigateTo(`game_${game.id}` as any)}
                className={`group p-5 rounded-3xl border-2 transition-all duration-200 cursor-pointer shadow-soft hover:shadow-soft-lg active:scale-[0.99] ${game.colorScheme.bg} ${game.colorScheme.border}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Game Category Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-800 shadow-sm flex items-center justify-center text-teal-700 dark:text-teal-300 flex-shrink-0 group-hover:scale-105 transition-transform">
                      {getGameIcon(game.iconName)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${game.colorScheme.badge} uppercase tracking-wider`}>
                          {t('game_badge_label', { num: index + 1, category: getLocalizedCategory(game.category) })}
                        </span>

                        <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 bg-white/70 dark:bg-stone-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock size={11} />
                          {game.durationEstimate}
                        </span>
                      </div>

                      <h3 className={`text-lg sm:text-xl font-extrabold mt-1 leading-tight ${game.colorScheme.text}`}>
                        {locName}
                      </h3>

                      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed font-medium">
                        {locDesc}
                      </p>
                    </div>
                  </div>

                  {/* Audio Listen */}
                  <SpeakTextButton 
                    textToSpeak={gameAudio} 
                    variant="icon-only" 
                    size="sm" 
                  />
                </div>

                {/* Bottom Bar with Play Button */}
                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500">
                    {t('difficulty_label')} <strong className="capitalize text-stone-800 dark:text-stone-200">{localizedDiff}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo(`game_${game.id}` as any);
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-teal-600 group-hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Play size={15} fill="currentColor" />
                    <span>{t('btn_play_now')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <PatientBottomNav />
    </div>
  );
};
