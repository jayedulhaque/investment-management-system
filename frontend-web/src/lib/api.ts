import { apiBaseUrl } from './config';

export const TOKEN_STORAGE_KEY = 'ims_access_token';
export const USER_STORAGE_KEY = 'ims_user';

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

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function persistAuth(response: AuthResponse) {
  localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
  localStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify({
      userId: response.userId,
      email: response.email,
      role: response.role,
    } satisfies AuthUser),
  );
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
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
