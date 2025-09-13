import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * 用户认证模块
 * 提供用户登录、注册、Token 验证等功能
 */
@Module({
  imports: [PrismaModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
