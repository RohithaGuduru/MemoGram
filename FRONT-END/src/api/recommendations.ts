import { apiClient } from './client';
import { isRealPatientId, DemoModeApiError } from '../services/demoFallback';

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
    if (!isRealPatientId(patientId)) {
      throw new DemoModeApiError(`Cannot get game recommendation for demo patient ID: ${patientId}`);
    }
    return apiClient<RecommendationBackendResponse>(`/patients/${patientId}/recommendations/next`, {
      method: 'GET',
    });
  },
};
