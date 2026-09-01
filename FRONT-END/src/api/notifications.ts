import { apiClient } from './client';

export interface NotificationBackendResponse {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  async listNotifications(unreadOnly: boolean = false): Promise<NotificationBackendResponse[]> {
    return apiClient<NotificationBackendResponse[]>('/notifications', {
      method: 'GET',
      params: unreadOnly ? { unread_only: true } : undefined,
    });
  },

  async markAsRead(id: string): Promise<NotificationBackendResponse> {
    return apiClient<NotificationBackendResponse>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },
};
