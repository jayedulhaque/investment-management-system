import { create } from 'zustand';
import {
  apiFetch,
  AuthResponse,
  clearAuth,
  getStoredToken,
  getStoredUser,
  persistAuth,
  type AuthUser,
  type RegisterCompanyResponse,
} from '../lib/api';
import type { CompanyRegistrationInfo } from '../types/company';
import type { InvestorRegistrationInfo } from '../types/investor';

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  registerInvestor: (email: string, password: string, investor: InvestorRegistrationInfo) => Promise<void>;
  registerCompany: (email: string, password: string, company: CompanyRegistrationInfo) => Promise<RegisterCompanyResponse>;
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

  registerInvestor: async (email, password, investor) => {
    const body: Record<string, string> = {
      email,
      password,
      fullName: investor.fullName,
      phone: investor.phone,
      nationalId: investor.nationalId,
      address: investor.address,
      city: investor.city,
      country: investor.country,
    };
    if (investor.dateOfBirth?.trim()) body.dateOfBirth = investor.dateOfBirth.trim();
    if (investor.occupation?.trim()) body.occupation = investor.occupation.trim();
    if (investor.contactEmail?.trim()) body.contactEmail = investor.contactEmail.trim();

    const res = await apiFetch<AuthResponse>('/api/auth/register/investor', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await persistAuth(res);
    set({ user: await getStoredUser(), token: res.accessToken });
  },

  registerCompany: async (email, password, company) => {
    return apiFetch<RegisterCompanyResponse>('/api/auth/register/company', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...company }),
    });
  },

  logout: async () => {
    await clearAuth();
    set({ user: null, token: null });
  },
}));
