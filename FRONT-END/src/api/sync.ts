import { apiClient } from './client';

export interface SyncOperationItemPayload {
  operation_id: string;
  entity_type: string;
  entity_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: string;
  data: Record<string, any>;
}

export interface SyncPushPayload {
  device_id: string;
  patient_id: string;
  platform?: string;
  app_version?: string;
  operations: SyncOperationItemPayload[];
}

export interface SyncPushBackendResponse {
  processed_count: number;
  successful_op_ids: string[];
  failed_ops: Array<Record<string, any>>;
  server_time: string;
}

export interface SyncPullPayload {
  patient_id: string;
  device_id: string;
  last_synced_at?: string;
}

export interface SyncPullBackendResponse {
  patient_id: string;
  server_time: string;
  games: Array<Record<string, any>>;
  active_medications: Array<Record<string, any>>;
  active_reminders: Array<Record<string, any>>;
  family_members: Array<Record<string, any>>;
  daily_activities: Array<Record<string, any>>;
  cultural_assets: Array<Record<string, any>>;
}

export const syncApi = {
  async pushBatch(payload: SyncPushPayload): Promise<SyncPushBackendResponse> {
    return apiClient<SyncPushBackendResponse>('/sync/push', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async pullDelta(payload: SyncPullPayload): Promise<SyncPullBackendResponse> {
    return apiClient<SyncPullBackendResponse>('/sync/pull', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
