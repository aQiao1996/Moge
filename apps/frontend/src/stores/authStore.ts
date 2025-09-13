import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { trpcClient, setAuthTokenGetter } from '@/lib/trpc'; // 引入 trpc client 和 token setter
import type { User, LoginParams, RegisterParams } from '@moge/types';

/**
 * 认证状态接口
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  loginApi: (params: LoginParams) => Promise<void>;
  registerApi: (params: RegisterParams) => Promise<void>;
  logoutApi: () => void;
  getCurrentUserApi: () => Promise<void>;
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
       * @param params - 登录所需的用户名和密码
       */
      loginApi: async (params: LoginParams) => {
        set({ isLoading: true, error: null });
        try {
          const result = await trpcClient.auth.login.mutate(params);
          set({ user: result.user, token: result.token, isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '登录失败';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      /**
       * 用户注册
       * @param params - 注册所需的信息
       */
      registerApi: async (params: RegisterParams) => {
        set({ isLoading: true, error: null });
        try {
          const result = await trpcClient.auth.register.mutate(params);
          set({ user: result.user, token: result.token, isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '注册失败';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      /**
       * 用户登出
       * @description 清除用户认证信息和状态
       */
      logoutApi: () => {
        set({ user: null, token: null, error: null });
      },

      /**
       * 获取当前登录用户信息
       * @description 如果存在 token,则尝试从后端获取用户信息
       */
      getCurrentUserApi: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true, error: null });
        try {
          const user = (await trpcClient.auth.me.query()) as User;
          set({ user, isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
          set({
            isLoading: false,
            error: errorMessage,
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
       * 手动设置加载状态
       * @param loading - 是否正在加载
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

/**
 * @description 将 store 中获取 token 的方法注入到 tRPC 客户端
 */
setAuthTokenGetter(() => useAuthStore.getState().token);

/**
 * 认证相关的工具函数
 */
export const authUtils = {
  /**
   * 检查用户是否已登录
   */
  isAuthenticated: (): boolean => {
    const { token } = useAuthStore.getState();
    return !!token;
  },

  /**
   * 获取当前登录的用户信息
   */
  getCurrentUser: (): User | null => {
    const { user } = useAuthStore.getState();
    return user;
  },

  /**
   * 获取当前的认证 token
   */
  getToken: (): string | null => {
    const { token } = useAuthStore.getState();
    return token;
  },
};
