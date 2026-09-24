import { apiClient } from './client';
import { isRealPatientId, DemoModeApiError } from '../services/demoFallback';

export interface CategoryMetricSummary {
  category: string;
  sessions_count: number;
  average_accuracy: number;
  average_response_time_ms: number;
  current_difficulty: number;
  trend_direction: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
}

export interface PerformanceOverviewBackendResponse {
  patient_id: string;
  total_sessions_completed: number;
  overall_accuracy: number;
  overall_error_rate: number;
  overall_response_time_ms: number;
  categories: CategoryMetricSummary[];
  recent_sessions: Array<{
    session_id: string;
    game_name: string;
    game_category: string;
    difficulty: number;
    accuracy: number;
    average_response_time_ms: number;
    submitted_at: string;
  }>;
  recommended_next_activity?: {
    recommended_game: {
      id: string;
      code: string;
      name: string;
      category: string;
    };
    difficulty: number;
    reason: string;
    rationale_code: string;
  };
}

export interface TimeSeriesPoint {
  date: string;
  accuracy: number;
  response_time_ms: number;
  sessions_count: number;
}

export interface PerformanceHistoryBackendResponse {
  patient_id: string;
  timeframe: 'day' | 'week' | 'month';
  data_points: TimeSeriesPoint[];
}

export const metricsApi = {
  async getPerformanceOverview(patientId: string): Promise<PerformanceOverviewBackendResponse> {
    if (!isRealPatientId(patientId)) {
      throw new DemoModeApiError(`Cannot get performance overview for demo patient ID: ${patientId}`);
    }
    return apiClient<PerformanceOverviewBackendResponse>(`/patients/${patientId}/performance/overview`, {
      method: 'GET',
    });
  },

  async getPerformanceHistory(patientId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<PerformanceHistoryBackendResponse> {
    if (!isRealPatientId(patientId)) {
      throw new DemoModeApiError(`Cannot get performance history for demo patient ID: ${patientId}`);
    }
    return apiClient<PerformanceHistoryBackendResponse>(`/patients/${patientId}/performance/history`, {
      method: 'GET',
      params: { timeframe },
    });
  },
};
