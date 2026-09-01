import { apiClient } from './client';

export type MedicationActionTypeValue = 'TOOK_IT' | 'REMIND_LATER';

export interface MedicationBackendResponse {
  id: string;
  patient_id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string;
  start_date: string;
  end_date?: string;
  instructions?: string;
  photo_url?: string;
  remaining_quantity: number;
  total_quantity: number;
  is_active: boolean;
  created_at: string;
}

export interface MedicationCreatePayload {
  name: string;
  dosage: string;
  time_of_day: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  instructions?: string;
  photo_url?: string;
  remaining_quantity?: number;
  total_quantity?: number;
  is_active?: boolean;
}

export interface MedicationUpdatePayload {
  name?: string;
  dosage?: string;
  time_of_day?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  instructions?: string;
  photo_url?: string;
  remaining_quantity?: number;
  total_quantity?: number;
  is_active?: boolean;
}

export interface MedicationActionPayload {
  action: MedicationActionTypeValue;
  scheduled_for?: string;
  notes?: string;
}

export interface MedicationActionBackendResponse {
  medication_id: string;
  medication_name: string;
  action_recorded: MedicationActionTypeValue;
  recorded_at: string;
  status: string;
  message: string;
}

export const medicinesApi = {
  async listPatientMedicines(patientId: string, activeOnly: boolean = false): Promise<MedicationBackendResponse[]> {
    return apiClient<MedicationBackendResponse[]>(`/medicines/patient/${patientId}`, {
      method: 'GET',
      params: activeOnly ? { active_only: true } : undefined,
    });
  },

  async createMedicine(patientId: string, payload: MedicationCreatePayload): Promise<MedicationBackendResponse> {
    return apiClient<MedicationBackendResponse>(`/medicines/patient/${patientId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateMedicine(id: string, payload: MedicationUpdatePayload): Promise<MedicationBackendResponse> {
    return apiClient<MedicationBackendResponse>(`/medicines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteMedicine(id: string): Promise<void> {
    return apiClient<void>(`/medicines/${id}`, {
      method: 'DELETE',
    });
  },

  async recordAction(
    id: string,
    payload: MedicationActionPayload,
    patientId?: string
  ): Promise<MedicationActionBackendResponse> {
    return apiClient<MedicationActionBackendResponse>(`/medicines/${id}/action`, {
      method: 'POST',
      body: JSON.stringify(payload),
      params: patientId ? { patient_id: patientId } : undefined,
    });
  },
};
