import { apiClient } from './client';

export interface AIStatusBackendResponse {
  available: boolean;
  configured: boolean;
  model: string;
  voice_model: string;
  provider: string;
  supported_languages: string[];
}

export interface AIInsightBackendResponse {
  id: string;
  patient_id: string;
  timeframe: string;
  summary: string;
  observations: string[];
  recommendations: string[];
  cautionary_notes: string[];
  metrics_snapshot: Record<string, any>;
  is_stale: boolean;
  generated_at: string;
}

export const aiApi = {
  async getStatus(): Promise<AIStatusBackendResponse> {
    return apiClient<AIStatusBackendResponse>('/ai/status', {
      method: 'GET',
    });
  },

  async getLatestInsights(patientId: string): Promise<AIInsightBackendResponse> {
    return apiClient<AIInsightBackendResponse>(`/ai/insights/${patientId}`, {
      method: 'GET',
    });
  },

  async generateInsights(patientId: string, timeframe: string = 'week'): Promise<AIInsightBackendResponse> {
    return apiClient<AIInsightBackendResponse>(`/ai/insights/${patientId}`, {
      method: 'POST',
      body: JSON.stringify({ timeframe, force_refresh: true }),
    });
  },
};
