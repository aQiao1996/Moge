'use client';
import { signIn, useSession } from 'next-auth/react';
import { logoutClientSession } from '@/lib/auth/logout';

/**
 * 认证按钮组件
 * 根据用户的会话状态(session)显示不同的按钮。
 * - 如果用户已登录, 显示 "退出" 按钮。
 * - 如果用户未登录, 显示 "用 GitLab 登录" 按钮。
 */
export default function AuthButton() {
  const { data: session } = useSession();
  if (session) {
    return <button onClick={() => void logoutClientSession()}>退出</button>;
  }
  return <button onClick={() => void signIn('gitlab')}>用 GitLab 登录</button>;
}
