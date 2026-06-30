import { apiBaseUrl } from './config';

function readApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;

  const record = body as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim()) return record.message;

  const errors = record.errors;
  if (errors && typeof errors === 'object') {
    const messages = Object.values(errors as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : []))
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (messages.length > 0) return messages.join(' ');
  }

  return fallback;
}

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
      const err = await response.json();
      message = readApiErrorMessage(err, message);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
