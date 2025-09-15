import type { AuthService } from '../auth/auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { UserService } from '../user/user.service';
import type { User } from '@moge/types';
import { createAppRouter, type TRPCContext } from '@moge/types';

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
 * 创建应用路由 - 使用 @moge/types 中定义的路由工厂
 */
export const appRouter = createAppRouter();
