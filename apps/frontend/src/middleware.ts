import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const theme = req.cookies.get('theme')?.value || 'light';
  const res = NextResponse.next();
  // 让服务端直出的 HTML 就是 dark
  if (theme === 'dark') {
    res.headers.set('x-dark-mode', '1'); // 可选，调试用
  }
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
