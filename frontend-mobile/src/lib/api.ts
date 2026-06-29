import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiBaseUrl } from './config';

export const TOKEN_STORAGE_KEY = 'ims_access_token';
export const USER_STORAGE_KEY = 'ims_user';

export type RegisterCompanyResponse = {
  message: string;
  email: string;
  companyName: string;
  approvalStatus: string;
};

export type AuthUser = {
  userId: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  accessToken: string;
  expiresAt: string;
  email: string;
  role: string;
  userId: string;
};

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function persistAuth(response: AuthResponse) {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
  await AsyncStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify({ userId: response.userId, email: response.email, role: response.role }),
  );
}

export async function clearAuth() {
  await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getStoredToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    let message = response.statusText;
    try {
      const err = (await response.json()) as { message?: string };
      message = err.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
