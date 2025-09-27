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
  initializeFromStorage: () => void;
}

// 获取初始token（仅在客户端）
const getInitialToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth-token');
  }
  return null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getInitialToken(),
  loading: false,
  error: null,

  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await loginApi(data);
      set({ user: result.user, loading: false });
      get().setToken(result.token);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Login failed', loading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await registerApi(data);
      set({ user: result.user, loading: false });
      get().setToken(result.token);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Register failed', loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await logoutApi();
      set({ user: null, loading: false });
      get().setToken(null);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Logout failed', loading: false });
    }
  },

  setUser: (user) => {
    set({ user });
  },
  setToken: (token) => {
    set({ token });
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth-token', token);
      } else {
        localStorage.removeItem('auth-token');
      }
    }
  },
  resetError: () => {
    set({ error: null });
  },
  initializeFromStorage: () => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth-token');
      if (storedToken && !get().token) {
        set({ token: storedToken });
      }
    }
  },
}));
