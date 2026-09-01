import { apiClient } from './client';

export interface RecommendationBackendResponse {
  patient_id: string;
  recommended_game: {
    id: string;
    code: string;
    name: string;
    category: string;
  };
  difficulty: number;
  reason: string;
  rationale_code: string;
}

export const recommendationsApi = {
  async getNextRecommendation(patientId: string): Promise<RecommendationBackendResponse> {
    return apiClient<RecommendationBackendResponse>(`/patients/${patientId}/recommendations/next`, {
      method: 'GET',
    });
  },
};
