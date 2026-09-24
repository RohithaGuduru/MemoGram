import { apiClient } from './client';
import { isRealPatientId, isDemoId, DemoModeApiError } from '../services/demoFallback';
import { GameCategoryType } from './games';

export type SessionStatusType = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface GameSessionCreatePayload {
  client_session_id: string;
  patient_id: string;
  difficulty?: number;
  device_id?: string;
  started_at?: string;
}

export interface GameSessionBackendResponse {
  id: string;
  client_session_id: string;
  patient_id: string;
  game_id: string;
  game_category: GameCategoryType;
  difficulty: number;
  device_id?: string;
  status: SessionStatusType;
  started_at: string;
  completed_at?: string;
}

export interface GameResultSubmitPayload {
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  errors_count?: number;
  attempts_count?: number;
  hints_used?: number;
  total_time_ms: number;
  response_times?: number[];
  raw_events?: Array<Record<string, any>>;
  completed_at?: string;
}

export interface GameResultBackendResponse {
  result_id: string;
  session_id: string;
  patient_id: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  errors_count: number;
  hints_used: number;
  total_time_ms: number;
  submitted_at: string;
  metrics?: {
    accuracy: number;
    error_rate: number;
    average_response_time_ms: number;
    median_response_time_ms: number;
    hint_rate: number;
    completion_rate: number;
    attempts: number;
  };
  baseline_comparison?: {
    category: string;
    has_baseline: boolean;
    sample_count: number;
    comparison?: {
      accuracy_diff: number;
      response_time_diff_ms: number;
      error_rate_diff: number;
    };
  };
  difficulty_recommendation?: {
    current_difficulty: number;
    recommended_difficulty: number;
    action: 'increase' | 'maintain' | 'decrease';
    reason: string;
    confidence: number;
  };
}

export const gameSessionsApi = {
  async startSession(gameId: string, payload: GameSessionCreatePayload): Promise<GameSessionBackendResponse> {
    if (!isRealPatientId(payload.patient_id)) {
      throw new DemoModeApiError(`Cannot start backend game session for demo patient ID: ${payload.patient_id}`);
    }
    return apiClient<GameSessionBackendResponse>(`/games/${gameId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async submitResult(sessionId: string, payload: GameResultSubmitPayload): Promise<GameResultBackendResponse> {
    if (isDemoId(sessionId)) {
      throw new DemoModeApiError(`Cannot submit game result for demo session ID: ${sessionId}`);
    }
    return apiClient<GameResultBackendResponse>(`/games/sessions/${sessionId}/result`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
