import { apiClient } from './client';

export type RelationshipStatusType = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REVOKED';

export interface RelationshipInvitePayload {
  patient_email_or_phone: string;
  relation_type?: string;
}

export interface RelationshipInviteResponse {
  relationship_id: string;
  patient_id: string;
  patient_name: string;
  caretaker_id: string;
  status: RelationshipStatusType;
  expires_in_minutes: number;
  created_at: string;
  test_otp_code?: string;
}

export interface RelationshipVerifyOTPPayload {
  relationship_id: string;
  otp_code: string;
}

export interface RelationshipBackendResponse {
  id: string;
  patient_id: string;
  caretaker_id: string;
  patient_name?: string;
  patient_email?: string;
  caretaker_name?: string;
  relation_type: string;
  status: RelationshipStatusType;
  created_at: string;
  updated_at: string;
}

export const relationshipsApi = {
  async invitePatient(payload: RelationshipInvitePayload): Promise<RelationshipInviteResponse> {
    return apiClient<RelationshipInviteResponse>('/relationships/invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyOTP(payload: RelationshipVerifyOTPPayload): Promise<RelationshipBackendResponse> {
    return apiClient<RelationshipBackendResponse>('/relationships/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listRelationships(): Promise<RelationshipBackendResponse[]> {
    return apiClient<RelationshipBackendResponse[]>('/relationships', {
      method: 'GET',
    });
  },

  async updateStatus(id: string, newStatus: RelationshipStatusType): Promise<RelationshipBackendResponse> {
    return apiClient<RelationshipBackendResponse>(`/relationships/${id}/status`, {
      method: 'PATCH',
      params: { new_status: newStatus },
    });
  },
};
