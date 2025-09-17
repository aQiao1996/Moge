'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@moge/types';

/**
 * 一个"幽灵"组件, 它的唯一作用是保持 useAuthStore 和 NextAuth session 的同步，
 * 并将后端的 token 保存到 localStorage 供 HTTP 客户端使用。
 */
export function AuthStoreSyncer() {
  const { data: session } = useSession();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (session?.user) {
      // session.user 的类型已经和我们内部的 User 类型匹配
      setUser(session.user as User);

      // 将后端 token 保存到 localStorage 供 HTTP 客户端使用
      if (session.backendToken) {
        localStorage.setItem('auth-token', session.backendToken);
      }
    } else {
      // 如果 session 不存在 (用户登出), 则清空所有状态
      setUser(null);
      localStorage.removeItem('auth-token');
    }
  }, [session, setUser]);

  // 这个组件不渲染任何 UI
  return null;
}
