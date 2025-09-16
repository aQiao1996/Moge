import { initTRPC, TRPCError } from '@trpc/server';
import type { User } from '@moge/types';
import type { AuthService } from '../auth/auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { UserService } from '../user/user.service';

// =================================================================================
// 上下文
// =================================================================================

/**
 * @description 后端 tRPC 上下文接口
 */
export interface TRPCContext {
  authService: AuthService;
  prismaService: PrismaService;
  userService: UserService;
  user?: User;
}

// =================================================================================
// 初始化
// =================================================================================

/**
 * @description 初始化 tRPC, 并设置上下文类型
 */
export const t = initTRPC.context<TRPCContext>().create();

/**
 * @description 可重用的路由和过程辅助函数
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// =================================================================================
// 中间件
// =================================================================================

/**
 * @description 身份验证中间件
 * @description 检查上下文中是否存在用户
 */
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '需要登录',
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// =================================================================================
// 受保护的过程
// =================================================================================

/**
 * @description 受保护的过程
 * @description 需要用户登录才能访问
 */
export const protectedProcedure = t.procedure.use(isAuthenticated);
