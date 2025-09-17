import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

const publicPaths = ['/login', '/signup'];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    /* 公开页面直接过 */
    if (publicPaths.some((p) => pathname.startsWith(p))) return;

    /* 已登录用户访问“/”时 → 重定向到 /outline */
    if (pathname === '/' && token) {
      return NextResponse.redirect(new URL('/outline', req.url));
    }

    /* 其余情况由 withAuth 自带的 authorized 回调处理 */
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // 公开路径放行
        if (publicPaths.some((p) => pathname.startsWith(p))) return true;
        // 其余必须登录
        return !!token;
      },
    },
  }
);

// 配置中间件需要拦截的路径
// 拦截所有页面请求, 但放过静态资源和 next-auth 自己的 API 路由
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
