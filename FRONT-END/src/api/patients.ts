import { apiClient } from './client';
import { isRealPatientId, DemoModeApiError } from '../services/demoFallback';

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
  name?: string;
  full_name?: string;
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
  full_name?: string;
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
    const fullName = payload.full_name || payload.name || 'Patient';
    const body = {
      ...payload,
      full_name: fullName,
    };
    return apiClient<PatientBackendResponse>('/patients', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async listPatients(): Promise<PatientBackendResponse[]> {
    return apiClient<PatientBackendResponse[]>('/patients', {
      method: 'GET',
    });
  },

  async getPatient(id: string): Promise<PatientDetailBackendResponse> {
    if (!isRealPatientId(id)) {
      throw new DemoModeApiError(`Cannot fetch patient from backend with demo ID: ${id}`);
    }
    return apiClient<PatientDetailBackendResponse>(`/patients/${id}`, {
      method: 'GET',
    });
  },

  async updatePatient(id: string, payload: PatientUpdatePayload): Promise<PatientDetailBackendResponse> {
    if (!isRealPatientId(id)) {
      throw new DemoModeApiError(`Cannot update patient on backend with demo ID: ${id}`);
    }
    return apiClient<PatientDetailBackendResponse>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};
