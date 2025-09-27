'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@moge/types';
import { setClientHandlers } from '@/lib/request';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/**
 * 一个"幽灵"组件, 它的唯一作用是：
 * 1. 保持 useAuthStore 和 NextAuth session 的同步。
 * 2. 在客户端环境中，为全局请求客户端 (request) 设置处理器 (handlers)，
 *    包括 token 获取、通知和 401 错误处理。
 */
export function AuthStoreSyncer() {
  const { data: session, status } = useSession();
  const { setUser, setToken, initializeFromStorage } = useAuthStore();
  const router = useRouter();

  const sessionUser = session?.user;
  const backendToken = session?.backendToken;

  // 初始化：从localStorage恢复token状态
  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  // 负责将服务端的 session 同步到客户端的 Zustand store
  useEffect(() => {
    if (status === 'loading') {
      // session还在加载中，不做任何操作
      return;
    }

    if (sessionUser && backendToken) {
      // 有session和token，同步到store
      setUser(sessionUser as User);
      setToken(backendToken);
    } else if (status === 'unauthenticated') {
      // 明确未认证状态，清除store
      setUser(null);
      setToken(null);
    }
    // 如果status是authenticated但没有backendToken，保持当前store状态不变
  }, [sessionUser, backendToken, status, setUser, setToken]);

  // 负责为请求客户端注入 handlers
  useEffect(() => {
    setClientHandlers({
      // getToken 优先从 store 中读取, 其次是 localStorage, 确保响应性
      getToken: () =>
        useAuthStore.getState().token || localStorage.getItem('auth-token') || undefined,
      // onAuthError 在遇到 401 时触发
      onAuthError: () => {
        // 清除本地状态和 next-auth session
        useAuthStore.getState().setToken(null);
        useAuthStore.getState().setUser(null);
        void (async () => {
          await signOut({ redirect: false });
          // 重定向到登录页
          router.push('/login');
        })();
      },
      // 使用 sonner 作为通知处理器
      notify: (msg, level) => {
        if (level === 'error') {
          toast.error(msg);
        } else if (level === 'success') {
          toast.success(msg);
        } else {
          toast(msg);
        }
      },
    });
  }, [router, setUser, setToken]); // 添加更多依赖

  // 这个组件不渲染任何 UI
  return null;
}
