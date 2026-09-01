import { apiClient } from './client';

export interface DifficultyRecommendationResult {
  current_difficulty: number;
  recommended_difficulty: number;
  action: 'increase' | 'maintain' | 'decrease' | string;
  reason: string;
  confidence: number;
}

export const adaptiveApi = {
  async evaluateDifficulty(patientId: string, gameId: string): Promise<DifficultyRecommendationResult> {
    return apiClient<DifficultyRecommendationResult>(`/adaptive/evaluate/${patientId}/${gameId}`, {
      method: 'GET',
    });
  },
};
