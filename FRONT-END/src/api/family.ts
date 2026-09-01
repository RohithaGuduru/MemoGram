import { apiClient } from './client';

export interface FamilyMemberBackendResponse {
  id: string;
  patient_id: string;
  name: string;
  relation: string;
  phone?: string;
  notes?: string;
  is_emergency_contact: boolean;
  created_at: string;
}

export interface FamilyMemberCreatePayload {
  name: string;
  relation: string;
  phone?: string;
  notes?: string;
  is_emergency_contact?: boolean;
}

export interface FamilyMemberUpdatePayload {
  name?: string;
  relation?: string;
  phone?: string;
  notes?: string;
  is_emergency_contact?: boolean;
}

export const familyApi = {
  async listFamilyMembers(patientId: string): Promise<FamilyMemberBackendResponse[]> {
    return apiClient<FamilyMemberBackendResponse[]>(`/patients/${patientId}/family`, {
      method: 'GET',
    });
  },

  async addFamilyMember(patientId: string, payload: FamilyMemberCreatePayload): Promise<FamilyMemberBackendResponse> {
    return apiClient<FamilyMemberBackendResponse>(`/patients/${patientId}/family`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateFamilyMember(id: string, payload: FamilyMemberUpdatePayload): Promise<FamilyMemberBackendResponse> {
    return apiClient<FamilyMemberBackendResponse>(`/family/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteFamilyMember(id: string): Promise<void> {
    return apiClient<void>(`/family/${id}`, {
      method: 'DELETE',
    });
  },
};
