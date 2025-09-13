import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';
import type { User } from '@moge/types';

/**
 * 用户认证服务
 * 提供用户登录、注册、Token 验证等核心功能
 */
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   * @returns 用户信息和访问令牌
   */
  async login(username: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatarUrl: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '用户名或密码错误',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '用户名或密码错误',
      });
    }

    const { passwordHash, ...userInfo } = user;
    void passwordHash;

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      user: { ...userInfo, id: userInfo.id.toString() },
      token,
    };
  }

  /**
   * 用户注册
   * @param username 用户名
   * @param password 密码
   * @param email 邮箱（可选）
   * @param name 昵称（可选）
   * @returns 用户信息和访问令牌
   */
  async register(username: string, password: string, email?: string, name?: string) {
    const existingUser = await this.prisma.users.findFirst({
      where: {
        OR: [{ username }, ...(email ? [{ email }] : [])],
      },
    });

    if (existingUser) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: existingUser.username === username ? '用户名已存在' : '邮箱已存在',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.users.create({
      data: {
        username,
        email,
        name,
        passwordHash: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      user: { ...user, id: user.id.toString() },
      token,
    };
  }

  /**
   * 验证访问令牌
   * @param token JWT 访问令牌
   * @returns 用户信息
   */
  async verifyToken(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET) as {
        userId: number;
        username: string;
      };

      const user = await this.prisma.users.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '用户不存在',
        });
      }

      return { ...user, id: user.id.toString() };
    } catch {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Token 无效或已过期',
      });
    }
  }
}
