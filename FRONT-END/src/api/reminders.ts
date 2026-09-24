import { apiClient } from './client';
import { isRealPatientId, isDemoId, DemoModeApiError } from '../services/demoFallback';

export type ReminderTypeValue = 'MEDICATION' | 'HYDRATION' | 'APPOINTMENT' | 'DAILY_ACTIVITY' | 'COGNITIVE_ACTIVITY';

export interface ReminderBackendResponse {
  id: string;
  patient_id: string;
  medication_id?: string;
  title: string;
  description?: string;
  reminder_type: ReminderTypeValue;
  scheduled_time: string;
  recurrence_rule: string;
  is_active: boolean;
  created_at: string;
}

export interface ReminderCreatePayload {
  title: string;
  description?: string;
  reminder_type: ReminderTypeValue;
  scheduled_time: string;
  recurrence_rule?: string;
  medication_id?: string;
  is_active?: boolean;
}

export interface ReminderUpdatePayload {
  title?: string;
  description?: string;
  reminder_type?: ReminderTypeValue;
  scheduled_time?: string;
  recurrence_rule?: string;
  medication_id?: string;
  is_active?: boolean;
}

export interface ReminderLogBackendResponse {
  id: string;
  reminder_id: string;
  patient_id: string;
  scheduled_time: string;
  actual_time: string;
  status: string;
  notes?: string;
  created_at: string;
}

export const remindersApi = {
  async listPatientReminders(patientId: string, activeOnly: boolean = false): Promise<ReminderBackendResponse[]> {
    if (!isRealPatientId(patientId)) {
      throw new DemoModeApiError(`Cannot list reminders for demo patient ID: ${patientId}`);
    }
    return apiClient<ReminderBackendResponse[]>(`/patients/${patientId}/reminders`, {
      method: 'GET',
      params: activeOnly ? { active_only: true } : undefined,
    });
  },

  async createReminder(patientId: string, payload: ReminderCreatePayload): Promise<ReminderBackendResponse> {
    if (!isRealPatientId(patientId)) {
      throw new DemoModeApiError(`Cannot create reminder for demo patient ID: ${patientId}`);
    }
    return apiClient<ReminderBackendResponse>(`/patients/${patientId}/reminders`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateReminder(id: string, payload: ReminderUpdatePayload): Promise<ReminderBackendResponse> {
    if (isDemoId(id)) {
      throw new DemoModeApiError(`Cannot update reminder with demo ID: ${id}`);
    }
    return apiClient<ReminderBackendResponse>(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteReminder(id: string): Promise<void> {
    if (isDemoId(id)) {
      throw new DemoModeApiError(`Cannot delete reminder with demo ID: ${id}`);
    }
    return apiClient<void>(`/reminders/${id}`, {
      method: 'DELETE',
    });
  },

  async completeReminder(id: string, notes?: string): Promise<ReminderLogBackendResponse> {
    if (isDemoId(id)) {
      throw new DemoModeApiError(`Cannot complete reminder with demo ID: ${id}`);
    }
    return apiClient<ReminderLogBackendResponse>(`/reminders/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ status: 'completed', notes }),
    });
  },
};
