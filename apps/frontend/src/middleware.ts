import { withAuth } from 'next-auth/middleware';

// 定义不需要登录即可访问的公开页面路径
const publicPaths = ['/login', '/signup'];

export default withAuth({
  callbacks: {
    /**
     * `authorized` 回调用于决定用户是否有权访问一个页面
     * 它会在中间件匹配到的每个页面上运行
     */
    authorized: ({ req, token }) => {
      const pathname = req.nextUrl.pathname;

      // 1. 如果用户访问的是公开页面, 直接放行
      if (publicPaths.some((path) => pathname.startsWith(path))) {
        return true;
      }

      // 2. 对于其他所有页面, 用户必须拥有 token (即已登录) 才能访问
      return !!token;
    },
  },
});

// 配置中间件需要拦截的路径
// 我们希望它拦截所有页面请求, 但放过静态资源和 next-auth 自己的 API 路由
export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
};
