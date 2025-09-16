import type { AuthService } from '../auth/auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { UserService } from '../user/user.service';
import type { User } from '@moge/types';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { t, type TRPCContext } from './trpc-core';

/**
 * 后端实现的 tRPC 上下文接口
 * 继承基础契约，使用具体的服务实现
 */
export interface Context extends TRPCContext {
  authService: AuthService;
  prismaService: PrismaService;
  userService: UserService;
  user?: User;
}

/**
 * 创建应用路由 - 在后端创建，避免客户端引入 @trpc/server
 */
export const appRouter = t.router({
  auth: authRouter, // 认证相关路由
  user: userRouter, // 用户相关路由
});

// 导出路由类型供类型推导使用
export type AppRouter = typeof appRouter;
