import { helloInputSchema } from './schemas/trpc';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { publicProcedure, t } from './trpc-core';

/**
 * 创建应用路由 - 使用 @moge/types 中定义的路由工厂
 * @description 将所有模块化路由合并到根路由中
 */
export function createAppRouter() {
  return t.router({
    auth: authRouter,
    user: userRouter,
    hello: publicProcedure
      .input(helloInputSchema)
      .query(({ input }) => ({ msg: `Hello ${input.name}` })),
  });
}

// AppRouter 类型 - 通过工厂函数推导
export type AppRouter = ReturnType<typeof createAppRouter>;
