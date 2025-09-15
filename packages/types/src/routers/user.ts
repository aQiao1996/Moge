import { TRPCError } from '@trpc/server';
import { updateProfileInputSchema } from '../schemas/trpc';
import { protectedProcedure, t } from '../trpc-core';

export const userRouter = t.router({
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
});
