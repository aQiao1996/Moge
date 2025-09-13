'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/stores/authStore';
import { setAuthTokenGetter } from '@/lib/trpc';
import type { User } from '@moge/types';

/**
 * 一个"幽灵"组件, 它的唯一作用是保持 useAuthStore 和 NextAuth session 的同步,
 * 并将后端的 token 提供给 tRPC 客户端。
 */
export function AuthStoreSyncer() {
  const { data: session } = useSession();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (session?.user) {
      // 当 session 存在时, 同步用户信息到 zustand store
      setUser(session.user as User);
      // 同时, 将后端 token 设置给 tRPC client, 以便后续的 API 调用能携带认证信息
      setAuthTokenGetter(() => session.backendToken ?? null);
    } else {
      // 如果 session 不存在 (用户登出), 则清空所有状态
      setUser(null);
      setAuthTokenGetter(() => null);
    }
  }, [session, setUser]);

  // 这个组件不渲染任何 UI
  return null;
}
