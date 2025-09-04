'use client';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function AuthButton() {
  const { data: session } = useSession();
  if (session) {
    return <button onClick={() => void signOut()}>退出</button>;
  }
  return <button onClick={() => void signIn('gitlab')}>用 GitLab 登录</button>;
}
