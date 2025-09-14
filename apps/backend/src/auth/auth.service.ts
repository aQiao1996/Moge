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
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户名或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户名或密码错误' });
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
      data: { username, email, name, passwordHash: hashedPassword },
      select: { id: true, username: true, email: true, name: true, avatarUrl: true },
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
   * 第三方登录 (GitLab)
   * @param provider 第三方提供商名称 (e.g., 'gitlab')
   * @param providerAccountId 第三方用户 ID
   * @param email 用户邮箱
   * @param name 用户名
   * @param avatarUrl 用户头像 URL
   * @returns 用户信息和访问令牌
   */
  async gitlabLogin(
    provider: string,
    providerAccountId: string,
    email: string,
    name?: string,
    avatarUrl?: string
  ) {
    // 查找是否已存在该第三方账号
    const existingAccount = await this.prisma.accounts.findUnique({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, name: true, avatarUrl: true },
        },
      },
    });

    if (existingAccount) {
      // 如果存在, 直接返回用户信息和 token
      const token = jwt.sign(
        { userId: existingAccount.user.id, username: existingAccount.user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return {
        user: { ...existingAccount.user, id: existingAccount.user.id.toString() },
        token,
      };
    }

    // 如果第三方账号不存在, 检查是否已有同邮箱用户
    let user = await this.prisma.users.findUnique({
      where: { email },
      select: { id: true, username: true, email: true, name: true, avatarUrl: true },
    });

    if (user) {
      // 如果有同邮箱用户, 则将第三方账号绑定到该用户
      await this.prisma.accounts.create({
        data: {
          userId: user.id,
          provider,
          providerAccountId,
          providerData: { email, name, avatarUrl },
        },
      });
    } else {
      // 如果没有同邮箱用户, 则创建新用户和新第三方账号
      // 生成一个唯一的用户名, 避免与现有用户名冲突
      const baseUsername = name || email.split('@')[0];
      let newUsername = baseUsername;
      let usernameExists = await this.prisma.users.findUnique({ where: { username: newUsername } });
      let counter = 1;
      while (usernameExists) {
        newUsername = `${baseUsername}${counter}`;
        usernameExists = await this.prisma.users.findUnique({ where: { username: newUsername } });
        counter++;
      }

      user = await this.prisma.users.create({
        data: {
          username: newUsername,
          email,
          name,
          avatarUrl,
          accounts: {
            create: { provider, providerAccountId, providerData: { email, name, avatarUrl } },
          },
        },
        select: { id: true, username: true, email: true, name: true, avatarUrl: true },
      });
    }

    // 返回用户信息和 token
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
        select: { id: true, username: true, email: true, name: true, avatarUrl: true },
      });

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户不存在' });
      }

      return { ...user, id: user.id.toString() };
    } catch {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token 无效或已过期' });
    }
  }
}
