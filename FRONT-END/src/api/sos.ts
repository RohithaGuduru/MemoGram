import { apiClient } from './client';

export type SOSStatusType = 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface SOSPayload {
  patient_id: string;
  latitude?: number;
  longitude?: number;
  message?: string;
}

export interface SOSBackendResponse {
  id: string;
  patient_id: string;
  patient_name: string;
  status: SOSStatusType;
  latitude?: number;
  longitude?: number;
  message: string;
  triggered_at: string;
  resolved_at?: string;
}

export const sosApi = {
  async triggerSOS(payload: SOSPayload): Promise<SOSBackendResponse> {
    return apiClient<SOSBackendResponse>('/sos/trigger', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listSOSAlerts(activeOnly: boolean = false): Promise<SOSBackendResponse[]> {
    return apiClient<SOSBackendResponse[]>('/sos', {
      method: 'GET',
      params: activeOnly ? { active_only: true } : undefined,
    });
  },

  async resolveSOS(id: string): Promise<SOSBackendResponse> {
    return apiClient<SOSBackendResponse>(`/sos/${id}/resolve`, {
      method: 'PATCH',
    });
  },
};
