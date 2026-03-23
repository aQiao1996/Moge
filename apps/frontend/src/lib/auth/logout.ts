'use client';

import { signOut } from 'next-auth/react';
import { useAuthStore } from '@/stores/authStore';

interface LogoutOptions {
  redirectTo?: string;
}

/**
 * 统一处理前端登出。
 * 先清理本地认证状态，再退出 NextAuth，会话跳转由前端自行完成。
 * @param options 登出选项
 */
export async function logoutClientSession(options?: LogoutOptions): Promise<void> {
  const redirectTo = options?.redirectTo ?? '/login';

  useAuthStore.getState().setUser(null);
  useAuthStore.getState().setToken(null);

  await signOut({ redirect: false });

  if (typeof window !== 'undefined') {
    window.location.replace(redirectTo);
  }
}
