import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export type Theme = 'light' | 'dark' | '';

export async function POST(req: NextRequest) {
  const { theme } = (await req.json()) as { theme: Theme };
  if (theme !== 'light' && theme !== 'dark') {
    return NextResponse.json({ error: 'invalid theme' }, { status: 400 });
  }
  cookies().set('theme', theme, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 年
    sameSite: 'lax',
    httpOnly: false, // 需让 JS 读到
  });
  return NextResponse.json({ ok: true });
}
