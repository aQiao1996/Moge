import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

export interface Context {
  authService: AuthService;
  prismaService: PrismaService;
  user?: {
    id: number;
    username: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
}

const t = initTRPC.context<Context>().create();

const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '需要登录' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

export const appRouter = t.router({
  auth: t.router({
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

    me: protectedProcedure.query(({ ctx }) => {
      return ctx.user;
    }),
  }),

  hello: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => ({ msg: `Hello ${input.name}` })),
});

export type AppRouter = typeof appRouter;
