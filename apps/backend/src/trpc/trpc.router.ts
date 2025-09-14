import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { AuthService } from '../auth/auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { UserService } from '../user/user.service'; // 导入 UserService
import type { User } from '@moge/types';

/**
 * tRPC 上下文接口
 */
export interface Context {
  authService: AuthService;
  prismaService: PrismaService;
  userService: UserService; // 添加 UserService
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
     * 第三方登录接口 (GitLab)
     */
    gitlabLogin: t.procedure
      .input(
        z.object({
          provider: z.string(),
          providerAccountId: z.string(),
          email: z.email('邮箱格式不正确'),
          name: z.string().optional(),
          avatarUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return ctx.authService.gitlabLogin(
          input.provider,
          input.providerAccountId,
          input.email,
          input.name,
          input.avatarUrl
        );
      }),

    /**
     * 获取当前登录用户信息
     */
    me: protectedProcedure.query(({ ctx }) => {
      return ctx.user;
    }),

    /**
     * 修改密码接口
     */
    changePassword: protectedProcedure
      .input(
        z
          .object({
            currentPassword: z.string().min(1, '当前密码不能为空'),
            newPassword: z.string().min(6, '密码至少6位'),
            confirmNewPassword: z.string().min(1, '请再次输入新密码'),
          })
          .refine((data) => data.newPassword === data.confirmNewPassword, {
            message: '两次输入的新密码不一致',
            path: ['confirmNewPassword'],
          })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户未登录' });
        }
        return ctx.authService.changePassword(
          Number(ctx.user.id),
          input.currentPassword,
          input.newPassword
        );
      }),
  }),

  user: t.router({
    /**
     * 更新用户个人信息接口
     */
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1, '用户名不能为空').optional(),
          email: z.email('请输入有效的邮箱地址').optional().or(z.literal('')),
          avatarUrl: z.url('头像URL格式不正确').optional().or(z.literal('')),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户未登录' });
        }
        return ctx.userService.updateProfile(
          Number(ctx.user.id),
          input.name,
          input.email,
          input.avatarUrl
        );
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
