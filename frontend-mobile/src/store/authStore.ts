import { create } from 'zustand';
import {
  apiFetch,
  AuthResponse,
  clearAuth,
  getStoredToken,
  getStoredUser,
  persistAuth,
  type AuthUser,
} from '../lib/api';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  registerInvestor: (email: string, password: string) => Promise<void>;
  registerCompany: (email: string, password: string, documentationUrl: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,

  hydrate: async () => {
    set({ user: await getStoredUser(), token: await getStoredToken(), hydrated: true });
  },

  login: async (email, password) => {
    const res = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await persistAuth(res);
    set({ user: await getStoredUser(), token: res.accessToken });
  },

  registerInvestor: async (email, password) => {
    const res = await apiFetch<AuthResponse>('/api/auth/register/investor', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await persistAuth(res);
    set({ user: await getStoredUser(), token: res.accessToken });
  },

  registerCompany: async (email, password, documentationUrl) => {
    const res = await apiFetch<AuthResponse>('/api/auth/register/company', {
      method: 'POST',
      body: JSON.stringify({ email, password, documentationUrl }),
    });
    await persistAuth(res);
    set({ user: await getStoredUser(), token: res.accessToken });
  },

  logout: async () => {
    await clearAuth();
    set({ user: null, token: null });
  },
}));
