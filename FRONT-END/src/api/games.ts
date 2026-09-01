import { apiClient } from './client';

export type GameCategoryType =
  | 'MEMORY'
  | 'ATTENTION'
  | 'PATTERN_RECOGNITION'
  | 'OBJECT_RECOGNITION'
  | 'DAILY_ROUTINE_RECALL'
  | 'CULTURAL'
  | 'FAMILY';

export interface GameBackendResponse {
  id: string;
  code: string;
  name: string;
  category: GameCategoryType;
  description: string;
  min_difficulty: number;
  max_difficulty: number;
  default_config: Record<string, any>;
  metadata_info: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface GameContentGeneratePayload {
  game_code: string;
  difficulty?: number;
  theme?: string;
  language?: string;
}

export interface GameContentGenerateBackendResponse {
  game_code: string;
  difficulty: number;
  language: string;
  title: string;
  instructions: string;
  items: Array<Record<string, any>>;
  cultural_context?: string;
}

export const gamesApi = {
  async listGames(category?: GameCategoryType): Promise<GameBackendResponse[]> {
    return apiClient<GameBackendResponse[]>('/games', {
      method: 'GET',
      params: category ? { category } : undefined,
    });
  },

  async getGame(id: string): Promise<GameBackendResponse> {
    return apiClient<GameBackendResponse>(`/games/${id}`, {
      method: 'GET',
    });
  },

  async generateGameContent(payload: GameContentGeneratePayload): Promise<GameContentGenerateBackendResponse> {
    return apiClient<GameContentGenerateBackendResponse>('/games/content/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
