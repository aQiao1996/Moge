import { create } from 'zustand';
import { loginApi, registerApi, logoutApi } from '@/api/auth.api';
import type { LoginData, SignupData, User } from '@moge/types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  resetError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await loginApi(data);
      set({ user: result.user, token: result.token, loading: false });
      localStorage.setItem('token', result.token);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Login failed', loading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await registerApi(data);
      set({ user: result.user, token: result.token, loading: false });
      localStorage.setItem('token', result.token);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Register failed', loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await logoutApi();
      set({ user: null, token: null, loading: false });
      localStorage.removeItem('token');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Logout failed', loading: false });
    }
  },

  setUser: (user) => {
    set({ user });
  },
  setToken: (token) => {
    set({ token });
  },
  resetError: () => {
    set({ error: null });
  },
}));
