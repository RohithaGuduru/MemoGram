import { apiClient } from './client';

export interface CapabilityProviderInfo {
  available: boolean;
  provider: string;
}

export interface LanguageCapabilityDetail {
  stt: CapabilityProviderInfo;
  translation: CapabilityProviderInfo;
  tts: CapabilityProviderInfo;
}

export interface LanguageCapabilityBackendResponse {
  language_code: string;
  display_name: string;
  native_name: string;
  script: string;
  text_available: boolean;
  ui_text_available: boolean;
  capabilities: LanguageCapabilityDetail;
  status: 'AVAILABLE' | 'PARTIAL' | 'IN_DEVELOPMENT' | 'UNAVAILABLE';
  enabled: boolean;
}

export const languagesApi = {
  async listLanguages(): Promise<LanguageCapabilityBackendResponse[]> {
    return apiClient<LanguageCapabilityBackendResponse[]>('/languages', {
      method: 'GET',
      skipAuth: true,
    });
  },

  async getLanguageCapability(code: string): Promise<LanguageCapabilityBackendResponse> {
    return apiClient<LanguageCapabilityBackendResponse>(`/languages/${code}`, {
      method: 'GET',
      skipAuth: true,
    });
  },
};
