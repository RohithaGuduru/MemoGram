import { apiClient } from './client';

export interface PatientBackendResponse {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  primary_language: string;
  fallback_language?: string;
  preferred_language?: string;
  font_size: string;
  timezone?: string;
  voice_preference?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  interests?: string[];
  accessibility_preferences?: Record<string, any>;
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

export interface PatientDetailBackendResponse extends PatientBackendResponse {
  primary_caregiver?: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
  };
  active_medications_count?: number;
  active_reminders_count?: number;
  completed_sessions_count?: number;
}

export interface PatientCreatePayload {
  name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  primary_language?: string;
  fallback_language?: string;
  preferred_language?: string;
  font_size?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  interests?: string[];
  accessibility_preferences?: Record<string, any>;
}

export interface PatientUpdatePayload {
  primary_language?: string;
  fallback_language?: string;
  preferred_language?: string;
  font_size?: string;
  voice_preference?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  interests?: string[];
  accessibility_preferences?: Record<string, any>;
  gender?: string;
  date_of_birth?: string;
}

export const patientsApi = {
  async createPatient(payload: PatientCreatePayload): Promise<PatientBackendResponse> {
    return apiClient<PatientBackendResponse>('/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listPatients(): Promise<PatientBackendResponse[]> {
    return apiClient<PatientBackendResponse[]>('/patients', {
      method: 'GET',
    });
  },

  async getPatient(id: string): Promise<PatientDetailBackendResponse> {
    return apiClient<PatientDetailBackendResponse>(`/patients/${id}`, {
      method: 'GET',
    });
  },

  async updatePatient(id: string, payload: PatientUpdatePayload): Promise<PatientDetailBackendResponse> {
    return apiClient<PatientDetailBackendResponse>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};
