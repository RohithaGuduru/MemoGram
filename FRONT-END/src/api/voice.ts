import { apiClient } from './client';
import { isRealPatientId, DemoModeApiError } from '../services/demoFallback';

export type VoiceIntentType =
  | 'MEDICATION_SCHEDULE'
  | 'NEXT_GAME'
  | 'UPCOMING_REMINDERS'
  | 'PATIENT_PROGRESS'
  | 'SOS_TRIGGER'
  | 'GENERAL_CHAT';

export interface VoiceProcessPayload {
  patient_id: string;
  language?: string;
  audio_base64?: string;
  audio_content_type?: string;
  transcript_text?: string;
  session_context?: Record<string, any>;
}

export interface VoiceProcessBackendResponse {
  recognized_text: string;
  intent: VoiceIntentType;
  reply_text: string;
  audio_base64?: string;
  audio_url?: string;
  language: string;
  tts_available: boolean;
  tts_status: string;
  tts_message?: string;
  tool_executed?: string;
  data?: Record<string, any>;
}

export const voiceApi = {
  async processVoice(payload: VoiceProcessPayload): Promise<VoiceProcessBackendResponse> {
    if (!isRealPatientId(payload.patient_id)) {
      throw new DemoModeApiError(`Cannot process voice for demo patient ID: ${payload.patient_id}`);
    }
    return apiClient<VoiceProcessBackendResponse>('/voice/process', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
