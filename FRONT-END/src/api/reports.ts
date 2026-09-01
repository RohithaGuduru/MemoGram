import { apiClient } from './client';

export interface CategoryReportSummary {
  category: string;
  sessions_count: number;
  average_accuracy: number;
  average_response_time_ms: number;
  trend: string;
}

export interface WeeklyReportBackendResponse {
  id: string;
  patient_id: string;
  period_start: string;
  period_end: string;
  total_sessions_completed: number;
  average_accuracy: number;
  average_response_time_ms: number;
  medication_adherence_rate: number;
  categories: CategoryReportSummary[];
  daily_trend: Array<{ date: string; accuracy: number; sessions: number }>;
  positive_highlights: string[];
  gentle_encouragements: string[];
  ai_insights: string[];
  created_at: string;
}

export const reportsApi = {
  async getWeeklyReport(patientId: string, targetDate?: string): Promise<WeeklyReportBackendResponse> {
    return apiClient<WeeklyReportBackendResponse>(`/patients/${patientId}/reports/weekly`, {
      method: 'GET',
      params: targetDate ? { target_date: targetDate } : undefined,
    });
  },
};
