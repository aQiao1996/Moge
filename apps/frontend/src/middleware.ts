import { NextResponse, type NextRequest } from 'next/server';

// 白名单
const WHITE_LIST = ['/login', '/signup'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 白名单直接放过
  if (WHITE_LIST.includes(pathname)) {
    return NextResponse.next();
  }

  // 其它路径必须带 token
  const token = req.cookies.get('token')?.value;
  if (!token) {
    // 307 重定向到登录，同时记下原本想去的地方，方便扩展
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 只拦截页面请求，放过静态资源与 API
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
