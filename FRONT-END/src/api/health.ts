import { apiClient } from './client';

export interface HealthBackendResponse {
  status: string;
  project: string;
  environment: string;
  ai_providers?: {
    gemini?: { configured: boolean; available: boolean; model: string };
    sarvam?: { configured: boolean; available: boolean };
    azure_speech?: { configured: boolean };
  };
}

export const healthApi = {
  async checkHealth(): Promise<HealthBackendResponse> {
    return apiClient<HealthBackendResponse>('/health', {
      method: 'GET',
      skipAuth: true,
    });
  },
};
