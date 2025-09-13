import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '@/lib/api/auth';
import type { User, LoginParams, RegisterParams } from '@moge/types';

/**
 * 认证状态接口
 */
interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // 操作方法
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Zustand 认证状态管理 Store
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isLoading: false,
      error: null,

      /**
       * 用户登录
       */
      login: async (params: LoginParams) => {
        set({ isLoading: true, error: null });

        try {
          const result = await authApi.login(params);

          set({
            user: result.user,
            token: result.token,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '登录失败';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      /**
       * 用户注册
       */
      register: async (params: RegisterParams) => {
        set({ isLoading: true, error: null });

        try {
          const result = await authApi.register(params);

          set({
            user: result.user,
            token: result.token,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '注册失败';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      /**
       * 用户登出
       */
      logout: () => {
        set({
          user: null,
          token: null,
          error: null,
        });
      },

      /**
       * 获取当前用户信息
       */
      getCurrentUser: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true, error: null });

        try {
          const user = await authApi.getCurrentUser(token);
          set({
            user,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
          set({
            isLoading: false,
            error: errorMessage,
            // 如果获取用户信息失败，可能是 token 已过期，清除认证状态
            user: null,
            token: null,
          });
          throw error;
        }
      },

      /**
       * 清除错误信息
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * 设置加载状态
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage', // localStorage 中的键名
      storage: createJSONStorage(() => localStorage),
      // 只持久化 user 和 token，不持久化 loading 和 error 状态
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

/**
 * 认证工具函数
 */
export const authUtils = {
  /**
   * 检查是否已登录
   */
  isAuthenticated: (): boolean => {
    const { token } = useAuthStore.getState();
    return !!token;
  },

  /**
   * 获取当前用户
   */
  getCurrentUser: (): User | null => {
    const { user } = useAuthStore.getState();
    return user;
  },

  /**
   * 获取认证令牌
   */
  getToken: (): string | null => {
    const { token } = useAuthStore.getState();
    return token;
  },
};
