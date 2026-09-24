import { apiClient } from './client';
import { RelationshipBackendResponse } from './relationships';

export interface CaregiverBackendResponse {
  id: string;
  user_id: string;
  agency?: string;
  notes?: string;
  relationship_with_patient?: string;
  preferred_language?: string;
  font_size?: string;
  created_at: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    full_name: string;
    role: string;
    is_active: boolean;
  };
}

export const caretakersApi = {
  async getProfile(): Promise<CaregiverBackendResponse> {
    return apiClient<CaregiverBackendResponse>('/caretakers/me', {
      method: 'GET',
    });
  },

  async updateProfile(payload: {
    preferred_language?: string;
    font_size?: string;
    agency?: string;
    notes?: string;
  }): Promise<CaregiverBackendResponse> {
    return apiClient<CaregiverBackendResponse>('/caretakers/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async listAssignedPatients(): Promise<RelationshipBackendResponse[]> {
    return apiClient<RelationshipBackendResponse[]>('/caretakers/me/patients', {
      method: 'GET',
    });
  },
};
