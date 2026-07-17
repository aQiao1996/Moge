import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService JWT handling', () => {
  it('verifies tokens with the configured Nest JWT service', async () => {
    const prisma = {
      users: {
        findUnique: jest.fn().mockResolvedValue({
          id: 100,
          username: 'writer',
          email: 'writer@example.com',
          name: 'Writer',
          avatarUrl: null,
        }),
      },
    };
    const jwtService = {
      verify: jest.fn().mockReturnValue({ userId: 100, username: 'writer' }),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService
    );

    const user = await service.verifyToken('configured-token');

    expect(jwtService.verify).toHaveBeenCalledWith('configured-token');
    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { id: 100 },
      select: { id: true, username: true, email: true, name: true, avatarUrl: true },
    });
    expect(user).toEqual({
      id: '100',
      username: 'writer',
      email: 'writer@example.com',
      name: 'Writer',
      avatarUrl: null,
    });
  });

  it('normalizes JWT verification failures as unauthorized errors', async () => {
    const prisma = { users: { findUnique: jest.fn() } };
    const jwtService = {
      verify: jest.fn(() => {
        throw new Error('invalid signature');
      }),
    };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService
    );

    await expect(service.verifyToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    expect(prisma.users.findUnique).not.toHaveBeenCalled();
  });
});
