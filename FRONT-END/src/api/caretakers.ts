import { apiClient } from './client';
import { RelationshipBackendResponse } from './relationships';

export interface CaregiverBackendResponse {
  id: string;
  user_id: string;
  agency?: string;
  notes?: string;
  relationship_with_patient?: string;
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

  async listAssignedPatients(): Promise<RelationshipBackendResponse[]> {
    return apiClient<RelationshipBackendResponse[]>('/caretakers/me/patients', {
      method: 'GET',
    });
  },
};
