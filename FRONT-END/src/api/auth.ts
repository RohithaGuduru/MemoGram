import { apiClient, setAuthTokens, clearAuthTokens } from './client';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  role: 'CAREGIVER' | 'CARETAKER' | 'PATIENT' | 'ADMIN';
  full_name: string;
}

export interface UserProfileResponse {
  id: string;
  email?: string;
  phone?: string;
  full_name: string;
  role: 'CAREGIVER' | 'CARETAKER' | 'PATIENT' | 'ADMIN';
  is_active: boolean;
  created_at: string;
  caregiver_id?: string;
  patient_id?: string;
}

export interface RegisterPayload {
  email?: string;
  phone?: string;
  password: string;
  full_name: string;
  role?: 'CAREGIVER' | 'CARETAKER' | 'PATIENT';
  agency?: string;
  notes?: string;
}

export interface LoginPayload {
  email_or_phone: string;
  password: string;
}

export interface GoogleAuthPayload {
  id_token: string;
  role?: 'CAREGIVER' | 'CARETAKER' | 'PATIENT';
  full_name?: string;
  preferred_language?: string;
}

export interface PatientRegisterPayload {
  email?: string;
  phone?: string;
  password: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<TokenResponse> {
    const res = await apiClient<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    setAuthTokens(res);
    return res;
  },

  async registerPatient(payload: PatientRegisterPayload): Promise<TokenResponse & { patient_id?: string }> {
    const res = await apiClient<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        role: 'PATIENT',
      }),
      skipAuth: true,
    });
    setAuthTokens(res);

    try {
      const me = await authApi.getMe();
      if (me?.patient_id) {
        return {
          ...res,
          patient_id: me.patient_id,
        };
      }
    } catch (err) {
      console.debug('[authApi] Could not fetch patient profile immediately after registration', err);
    }

    return res;
  },

  async login(payload: LoginPayload): Promise<TokenResponse> {
    const res = await apiClient<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    setAuthTokens(res);
    return res;
  },

  async googleAuth(payload: GoogleAuthPayload): Promise<TokenResponse> {
    const res = await apiClient<TokenResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    setAuthTokens(res);
    return res;
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const res = await apiClient<TokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      skipAuth: true,
    });
    setAuthTokens(res);
    return res;
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
      });
      clearAuthTokens();
      return res;
    } catch (e) {
      clearAuthTokens();
      return { success: true, message: 'Logged out locally' };
    }
  },

  async getMe(): Promise<UserProfileResponse> {
    return apiClient<UserProfileResponse>('/auth/me', {
      method: 'GET',
    });
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
    return apiClient<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    return apiClient<ResetPasswordResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },
};
