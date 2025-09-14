import { Injectable } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter, type Context } from './trpc.router';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service'; // 导入 UserService
import type { User } from '@moge/types';

/**
 * tRPC 服务
 * 负责创建 tRPC 上下文和路由
 */
@Injectable()
export class TrpcService {
  constructor(
    private authService: AuthService,
    private prismaService: PrismaService,
    private userService: UserService // 注入 UserService
  ) {}

  /**
   * 创建 tRPC 上下文
   * 从请求头中解析用户认证信息
   */
  createContext = async ({ req }: trpcExpress.CreateExpressContextOptions): Promise<Context> => {
    /**
     * 从请求头中获取用户信息
     */
    const getUserFromHeader = async (): Promise<User | undefined> => {
      if (req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        try {
          return await this.authService.verifyToken(token);
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const user: User | undefined = await getUserFromHeader();

    return {
      authService: this.authService,
      prismaService: this.prismaService,
      userService: this.userService,
      user,
    };
  };

  /**
   * tRPC 应用路由实例
   */
  appRouter = appRouter;
}
