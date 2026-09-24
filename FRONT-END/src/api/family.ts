import { apiClient } from './client';
import { isRealPatientId, isDemoId, DemoModeApiError } from '../services/demoFallback';

export interface FamilyMemberBackendResponse {
  id: string;
  patient_id: string;
  name: string;
  relation: string;
  photo_url?: string;
  phone?: string;
  notes?: string;
  is_emergency_contact: boolean;
  created_at: string;
}

export interface FamilyMemberCreatePayload {
  name: string;
  relation: string;
  photo_url?: string;
  phone?: string;
  notes?: string;
  is_emergency_contact?: boolean;
}

export interface FamilyMemberUpdatePayload {
  name?: string;
  relation?: string;
  photo_url?: string;
  phone?: string;
  notes?: string;
  is_emergency_contact?: boolean;
}

export const familyApi = {
  async listFamilyMembers(patientId: string): Promise<FamilyMemberBackendResponse[]> {
    if (!isRealPatientId(patientId)) {
      throw new DemoModeApiError(`Cannot list family members for demo patient ID: ${patientId}`);
    }
    return apiClient<FamilyMemberBackendResponse[]>(`/patients/${patientId}/family`, {
      method: 'GET',
    });
  },

  async addFamilyMember(patientId: string, payload: FamilyMemberCreatePayload): Promise<FamilyMemberBackendResponse> {
    if (!isRealPatientId(patientId)) {
      throw new DemoModeApiError(`Cannot add family member for demo patient ID: ${patientId}`);
    }
    return apiClient<FamilyMemberBackendResponse>(`/patients/${patientId}/family`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateFamilyMember(id: string, payload: FamilyMemberUpdatePayload): Promise<FamilyMemberBackendResponse> {
    if (isDemoId(id)) {
      throw new DemoModeApiError(`Cannot update family member with demo ID: ${id}`);
    }
    return apiClient<FamilyMemberBackendResponse>(`/family/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteFamilyMember(id: string): Promise<void> {
    if (isDemoId(id)) {
      throw new DemoModeApiError(`Cannot delete family member with demo ID: ${id}`);
    }
    return apiClient<void>(`/family/${id}`, {
      method: 'DELETE',
    });
  },
};
