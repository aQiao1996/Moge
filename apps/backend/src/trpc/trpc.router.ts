import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { AuthService } from '../auth/auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { User } from '@moge/types';

/**
 * tRPC 上下文接口
 */
export interface Context {
  authService: AuthService;
  prismaService: PrismaService;
  user?: User;
}

const t = initTRPC.context<Context>().create();

/**
 * 用户认证中间件
 * 验证用户是否已登录
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

/**
 * 受保护的过程，需要用户登录
 */
export const protectedProcedure = t.procedure.use(isAuthenticated);

/**
 * tRPC 应用路由
 */
export const appRouter = t.router({
  auth: t.router({
    /**
     * 用户登录接口
     */
    login: t.procedure
      .input(
        z.object({
          username: z.string().min(1, '用户名不能为空'),
          password: z.string().min(6, '密码至少6位'),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return ctx.authService.login(input.username, input.password);
      }),

    /**
     * 用户注册接口
     */
    register: t.procedure
      .input(
        z.object({
          username: z.string().min(3, '用户名至少3位').max(20, '用户名不超过20位'),
          password: z.string().min(6, '密码至少6位'),
          email: z.email('邮箱格式不正确').optional(),
          name: z.string().max(50, '昵称不超过50位').optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return ctx.authService.register(input.username, input.password, input.email, input.name);
      }),

    /**
     * 获取当前登录用户信息
     */
    me: protectedProcedure.query(({ ctx }) => {
      return ctx.user;
    }),
  }),

  /**
   * 测试接口
   */
  hello: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => ({ msg: `Hello ${input.name}` })),
});

export type AppRouter = typeof appRouter;
