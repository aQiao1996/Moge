import { initTRPC, TRPCError } from '@trpc/server';
import type { User } from './user';
import {
  loginInputSchema,
  registerInputSchema,
  gitlabLoginInputSchema,
  changePasswordInputSchema,
  updateProfileInputSchema,
  helloInputSchema,
} from './schemas/trpc';

// Context interface - 定义 tRPC 上下文的类型契约
export interface TRPCContext {
  authService: {
    login: (username: string, password: string) => Promise<{ user: User; token: string }>;
    register: (
      username: string,
      password: string,
      email?: string,
      name?: string
    ) => Promise<{ user: User; token: string }>;
    gitlabLogin: (
      provider: string,
      providerAccountId: string,
      email: string,
      name?: string,
      avatarUrl?: string
    ) => Promise<{ user: User; token: string }>;
    changePassword: (
      userId: number,
      currentPassword: string,
      newPassword: string
    ) => Promise<{ message: string }>;
  };
  prismaService: {
    [key: string]: any;
  };
  userService: {
    updateProfile: (
      userId: number,
      name?: string,
      email?: string,
      avatarUrl?: string
    ) => Promise<User>;
  };
  user?: User;
}

/**
 * 创建标准的 tRPC 路由工厂函数
 * 简化泛型以避免复杂的类型推导问题
 */
export function createAppRouter() {
  const t = initTRPC.context<TRPCContext>().create();

  // 身份验证 中间件
  const isAuthenticated = t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '需要登录',
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });

  const protectedProcedure = t.procedure.use(isAuthenticated);

  return t.router({
    auth: t.router({
      login: t.procedure.input(loginInputSchema).mutation(async ({ input, ctx }) => {
        return ctx.authService.login(input.username, input.password);
      }),

      register: t.procedure.input(registerInputSchema).mutation(async ({ input, ctx }) => {
        return ctx.authService.register(input.username, input.password, input.email, input.name);
      }),

      gitlabLogin: t.procedure.input(gitlabLoginInputSchema).mutation(async ({ input, ctx }) => {
        return ctx.authService.gitlabLogin(
          input.provider,
          input.providerAccountId,
          input.email,
          input.name,
          input.avatarUrl
        );
      }),

      me: protectedProcedure.query(({ ctx }) => {
        return ctx.user;
      }),

      changePassword: protectedProcedure
        .input(changePasswordInputSchema)
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
      updateProfile: protectedProcedure
        .input(updateProfileInputSchema)
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

    hello: t.procedure
      .input(helloInputSchema)
      .query(({ input }) => ({ msg: `Hello ${input.name}` })),
  });
}

// AppRouter 类型 - 通过工厂函数推导
export type AppRouter = ReturnType<typeof createAppRouter>;
