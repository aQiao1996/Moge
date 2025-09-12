import { Injectable } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter, type Context } from './trpc.router';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@moge/types';

@Injectable()
export class TrpcService {
  constructor(
    private authService: AuthService,
    private prismaService: PrismaService
  ) {}

  createContext = async ({ req }: trpcExpress.CreateExpressContextOptions): Promise<Context> => {
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
      user,
    };
  };

  appRouter = appRouter;
}
