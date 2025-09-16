import { TRPCError } from '@trpc/server';
import {
  changePasswordInputSchema,
  gitlabLoginInputSchema,
  loginInputSchema,
  registerInputSchema,
} from '@moge/types';
import { protectedProcedure, publicProcedure, t } from '../trpc-core';

export const authRouter = t.router({
  login: publicProcedure.input(loginInputSchema).mutation(async ({ input, ctx }) => {
    return ctx.authService.login(input.username, input.password);
  }),

  register: publicProcedure.input(registerInputSchema).mutation(async ({ input, ctx }) => {
    return ctx.authService.register(input.username, input.password, input.email, input.name);
  }),

  gitlabLogin: publicProcedure.input(gitlabLoginInputSchema).mutation(async ({ input, ctx }) => {
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
});
