/**
 * Centralized API Client for Memogram Frontend
 * Connects directly to the Memogram FastAPI Backend.
 */

const rawBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:8000/api/v1';
export const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const TOKEN_KEY = 'memogram_access_token';
const REFRESH_TOKEN_KEY = 'memogram_refresh_token';
const USER_ID_KEY = 'memogram_user_id';
const ROLE_KEY = 'memogram_user_role';

let accessToken: string | null = localStorage.getItem(TOKEN_KEY);
let refreshToken: string | null = localStorage.getItem(REFRESH_TOKEN_KEY);

export function getAccessToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem(TOKEN_KEY);
  }
  return accessToken;
}

export function getRefreshToken(): string | null {
  if (!refreshToken) {
    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return refreshToken;
}

export function setAuthTokens(tokens: {
  access_token: string;
  refresh_token: string;
  user_id?: string;
  role?: string;
}): void {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  localStorage.setItem(TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  if (tokens.user_id) localStorage.setItem(USER_ID_KEY, tokens.user_id);
  if (tokens.role) localStorage.setItem(ROLE_KEY, tokens.role);
}

export function clearAuthTokens(): void {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Queue to handle simultaneous token refreshing
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function tryRefreshToken(): Promise<string | null> {
  const currentRefresh = getRefreshToken();
  if (!currentRefresh) {
    clearAuthTokens();
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: currentRefresh }),
    });

    if (!res.ok) {
      clearAuthTokens();
      return null;
    }

    const data = await res.json();
    setAuthTokens(data);
    return data.access_token;
  } catch {
    clearAuthTokens();
    return null;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuth = false, headers = {}, ...customOptions } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token && !skipAuth && !reqHeaders['Authorization']) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...customOptions,
      headers: reqHeaders,
    });
  } catch (netErr: any) {
    throw new ApiError(0, netErr?.message || 'Network request failed. Please check your backend connection.');
  }

  // Handle 401 Unauthorized - Attempt Token Refresh once
  if (response.status === 401 && !skipAuth && getRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefreshToken();
      isRefreshing = false;
      onRefreshed(newToken);

      if (newToken) {
        reqHeaders['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...customOptions,
          headers: reqHeaders,
        });
      }
    } else {
      // Wait for ongoing refresh
      const retryToken = await new Promise<string | null>((resolve) => {
        subscribeTokenRefresh((newToken) => resolve(newToken));
      });

      if (retryToken) {
        reqHeaders['Authorization'] = `Bearer ${retryToken}`;
        response = await fetch(url, {
          ...customOptions,
          headers: reqHeaders,
        });
      }
    }
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg), data);
  }

  return data as T;
}
