import { create } from 'zustand';
import type { User } from '@moge/types';

/**
 * 定义 store 的状态和方法接口
 */
interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

/**
 * 一个轻量级的 store, 仅用于在客户端存储和访问当前用户信息。
 * 它的数据源将由 NextAuth 的 session 来驱动。
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  /**
   * 设置用户信息
   */
  setUser: (user: User | null) => set({ user }),
  /**
   * 清除用户信息
   */
  clearUser: () => set({ user: null }),
}));
