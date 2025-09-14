import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TRPCError } from '@trpc/server';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: number, name?: string, email?: string, avatarUrl?: string) {
    // 检查邮箱是否已被其他用户占用
    if (email) {
      const existingUserWithEmail = await this.prisma.users.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      });
      if (existingUserWithEmail) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '邮箱已被其他用户占用' });
      }
    }

    const updatedUser = await this.prisma.users.update({
      where: { id: userId },
      data: {
        name,
        email,
        avatarUrl,
      },
      select: { id: true, username: true, email: true, name: true, avatarUrl: true },
    });

    return { ...updatedUser, id: updatedUser.id.toString() };
  }
}
